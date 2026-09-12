import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import { db } from './server/db.js';
import { fetchLeetCodeProfile } from './server/leetcode.js';
import { 
  enrichStudentWithSnapshots, 
  computeDashboardSummary, 
  computeSectionStats, 
  computeBatchStats, 
  calculateEngagementScore, 
  getPerformanceTier, 
  getDaysInactive, 
  getActivityStatus, 
  getRiskLevel 
} from './server/analytics.js';
import { 
  generateExcelReport, 
  generateStudentTemplateExcel, 
  generateStudentTemplateCSV, 
  generateStudentsCSV 
} from './server/reports.js';
import { 
  LEETCODE_DSA_QUEST_NODES,
  computeStudentQuestProgress,
  computeFacultyQuestSummary
} from './server/questData.js';
import {
  LEETCODE_75_CATEGORIES,
  computeStudentLeetCode75Progress,
  computeFacultyLeetCode75Summary
} from './server/leetcode75Data.js';
import { 
  BatchFetchProgress, 
  StudentWithLatest, 
  Student, 
  POTDItem, 
  CuratedTrack, 
  CuratedProblem, 
  SchedulerStatus 
} from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  // Anti-clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Anti-MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy (blocks camera, mic, screen display-capture)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), display-capture=()');
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent caching for API data
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
});

// Campus-Safe Rate Limiter for Login Brute Force Protection (tracks failed attempts only)
const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>();
function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = failedLoginAttempts.get(ip);
  if (!record) return true;
  if (now > record.resetAt) {
    failedLoginAttempts.delete(ip);
    return true;
  }
  return record.count < 15; // Max 15 failed logins per minute per IP
}
function recordFailedLogin(ip: string) {
  const now = Date.now();
  const record = failedLoginAttempts.get(ip) || { count: 0, resetAt: now + 60 * 1000 };
  record.count++;
  failedLoginAttempts.set(ip, record);
}
function clearFailedLogin(ip: string) {
  failedLoginAttempts.delete(ip);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure Supabase database state is populated on cold starts / page reloads with timeout guard
let isSupabaseLoaded = false;
let supabaseLoadPromise: Promise<void> | null = null;

app.use(async (req, res, next) => {
  if (!isSupabaseLoaded) {
    if (!supabaseLoadPromise) {
      const loadTask = db.loadFromSupabase().then(() => {
        isSupabaseLoaded = true;
      }).catch(err => {
        console.error('Supabase middleware load error:', err);
      });

      const timeoutTask = new Promise<void>((resolve) => setTimeout(resolve, 2500));
      supabaseLoadPromise = Promise.race([loadTask, timeoutTask]);
    }
    await supabaseLoadPromise;
  }
  next();
});

// State for asynchronous batch fetching
let batchProgress: BatchFetchProgress = {
  is_running: false,
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  logs: [],
};

// Scheduler State
const schedulerState = {
  lastRunAt: null as string | null,
  nextRunAt: null as string | null,
};

function calculateNextRunTime(intervalHours: number, fromDate: Date = new Date()): string {
  return new Date(fromDate.getTime() + intervalHours * 3600 * 1000).toISOString();
}

// Background scheduler ticker - checks every 30 seconds
setInterval(async () => {
  try {
    const settings = db.getSettings();
    if (!settings.auto_sync_enabled || batchProgress.is_running) return;

    const now = Date.now();
    const intervalHours = settings.auto_sync_interval_hours || 12;

    if (!schedulerState.nextRunAt) {
      schedulerState.nextRunAt = calculateNextRunTime(intervalHours);
    }

    if (schedulerState.nextRunAt && now >= new Date(schedulerState.nextRunAt).getTime()) {
      const activeStudents = db.getStudents().filter(s => s.active);
      if (activeStudents.length > 0) {
        schedulerState.lastRunAt = new Date().toISOString();
        schedulerState.nextRunAt = calculateNextRunTime(intervalHours);
        db.addLog('INFO', `⏰ [Auto-Sync] Scheduled LeetCode synchronization triggered for ${activeStudents.length} students.`);
        runBatchFetchWorker(activeStudents, 'Scheduled Background Auto-Sync');
      }
    }
  } catch (e) {
    console.error('Scheduler interval error:', e);
  }
}, 30000);

async function runBatchFetchWorker(studentsToFetch: Student[], reason: string = 'Manual Batch Sync') {
  if (batchProgress.is_running) return;

  const settings = db.getSettings();
  batchProgress = {
    is_running: true,
    total: studentsToFetch.length,
    processed: 0,
    successful: 0,
    failed: 0,
    started_at: new Date().toISOString(),
    logs: [
      {
        timestamp: new Date().toISOString(),
        message: `Started ${reason} for ${studentsToFetch.length} students in parallel concurrency pools.`,
        type: 'info',
      }
    ],
  };

  db.addLog('INFO', `Started ${reason} for ${studentsToFetch.length} students.`);

  // On Vercel / serverless, use 5 concurrent workers for fast response without timing out
  const CONCURRENCY = process.env.VERCEL ? 6 : 4;
  const timeoutMs = process.env.VERCEL ? 7000 : 12000;

  for (let i = 0; i < studentsToFetch.length; i += CONCURRENCY) {
    if (!batchProgress.is_running) break; // Allow cancel

    const chunk = studentsToFetch.slice(i, i + CONCURRENCY);
    batchProgress.current_student = chunk.map(s => s.student_name).join(', ');

    await Promise.all(chunk.map(async (student) => {
      try {
        const fetchResult = await fetchLeetCodeProfile(student.username, timeoutMs, 1);
        const prevSnapshot = db.getLatestSnapshot(student.id);

        if (fetchResult.status === 'SUCCESS' && fetchResult.data) {
          const data = fetchResult.data;
          const daysInactive = getDaysInactive(data.last_active);
          const activityStatus = getActivityStatus(daysInactive, settings.inactivity_threshold_days);
          const tier = getPerformanceTier(data.total_solved, settings);

          const impRate = prevSnapshot ? Math.max(0, data.total_solved - prevSnapshot.total_solved) : 0;
          const engagement = calculateEngagementScore({
            total_solved: data.total_solved,
            medium: data.medium,
            hard: data.hard,
            streak: data.streak,
            contest_rating: data.contest_rating,
            contests_attended: data.contests_attended,
            days_inactive: daysInactive,
            improvement_rate: impRate,
          }, settings);

          db.addSnapshot({
            student_id: student.id,
            captured_at: new Date().toISOString(),
            total_solved: data.total_solved,
            easy: data.easy,
            medium: data.medium,
            hard: data.hard,
            acceptance_rate: data.acceptance_rate,
            ranking: data.ranking,
            reputation: data.reputation,
            contest_rating: data.contest_rating,
            contest_rank: data.contest_rank,
            contests_attended: data.contests_attended,
            top_percentage: data.top_percentage,
            streak: data.streak,
            active_days: data.active_days,
            last_active: data.last_active,
            languages: data.languages,
            skills: data.skills,
            badges: data.badges,
            submission_calendar: data.submission_calendar,
            engagement_score: engagement,
            performance_tier: tier,
            activity_status: activityStatus,
            status: 'SUCCESS',
          });

          if (data.recent_submissions && data.recent_submissions.length > 0) {
            db.setSubmissions(student.id, data.recent_submissions.map((s, idx) => ({
              id: `sub_${student.id}_${Date.now()}_${idx}`,
              student_id: student.id,
              title: s.title,
              titleSlug: s.titleSlug,
              timestamp: s.timestamp,
              language: s.language || s.lang || 'Python3',
              statusDisplay: s.statusDisplay || 'Accepted',
            })));
          }

          batchProgress.successful++;
          batchProgress.logs.push({
            timestamp: new Date().toISOString(),
            message: `[SUCCESS] ${student.student_name}: ${data.total_solved} solved (Easy: ${data.easy}, Med: ${data.medium}, Hard: ${data.hard}).`,
            type: 'success',
          });
        } else {
          batchProgress.failed++;
          batchProgress.logs.push({
            timestamp: new Date().toISOString(),
            message: `[${fetchResult.status}] ${student.student_name} (@${student.username}): ${fetchResult.error || 'Failed'}`,
            type: 'warn',
          });
        }
      } catch (err: any) {
        batchProgress.failed++;
        batchProgress.logs.push({
          timestamp: new Date().toISOString(),
          message: `[ERROR] ${student.student_name}: ${err.message}`,
          type: 'error',
        });
      } finally {
        batchProgress.processed++;
      }
    }));

    // Slight pause between concurrency batches to prevent LeetCode rate limit
    await new Promise(r => setTimeout(r, 400));
  }

  batchProgress.is_running = false;
  batchProgress.completed_at = new Date().toISOString();
  batchProgress.current_student = undefined;
  batchProgress.logs.push({
    timestamp: new Date().toISOString(),
    message: `Batch sync completed: ${batchProgress.successful} successful, ${batchProgress.failed} errors.`,
    type: 'info',
  });
  db.addLog('INFO', `Batch sync finished: ${batchProgress.successful}/${batchProgress.total} updated.`);
}

// Helper to get enriched student records
function getAllEnrichedStudents(): StudentWithLatest[] {
  const students = db.getStudents();
  const snapshots = db.getSnapshots();
  const settings = db.getSettings();
  return students.map(s => enrichStudentWithSnapshots(s, snapshots, settings));
}

// Token helper
function createAuthToken(user: any): string {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    student_id: user.student_id,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function parseAuthHeader(req: express.Request): any | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const raw = Buffer.from(auth.substring(7), 'base64').toString('utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// Authentication guard middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = parseAuthHeader(req);
  if (!session || !session.id) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const user = db.getUserById(session.id);
  if (!user) {
    return res.status(401).json({ error: 'User session invalid or expired.' });
  }
  (req as any).user = user;
  (req as any).session = session;
  next();
}

// Faculty/Staff role authorization middleware
function requireStaff(req: express.Request, res: express.Response, next: express.NextFunction) {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== 'staff') {
      return res.status(403).json({ error: 'Access denied. Faculty/Staff privilege required.' });
    }
    next();
  });
}

// Helper to build student dashboard data
function buildStudentDashboardPayload(studentId: string) {
  const student = db.getStudentById(studentId);
  if (!student) return null;

  const snapshots = db.getSnapshots(student.id);
  const settings = db.getSettings();
  const enrichedStudent = enrichStudentWithSnapshots(student, snapshots, settings);
  const recentSubmissions = db.getSubmissions(student.id);

  const rawPotdList = db.getTodayPOTDList();
  const potdListWithSolved = rawPotdList.map(p => {
    const isSolved = recentSubmissions.some(s => 
      (s.titleSlug && s.titleSlug.toLowerCase() === p.titleSlug.toLowerCase()) ||
      (s.title && s.title.toLowerCase().trim() === p.title.toLowerCase().trim())
    );
    return {
      ...p,
      isSolvedByMe: isSolved
    };
  });

  const contests = db.getContests();

  const tracks = db.getTracks();
  const studentTracks = tracks.map(t => {
    const fullTrack = db.getTrackById(t.id);
    const problems = fullTrack?.problems || [];
    let solvedCount = 0;
    const problemsWithSolved = problems.map(p => {
      const isSolved = recentSubmissions.some(sub => 
        (sub.titleSlug && sub.titleSlug.toLowerCase() === p.titleSlug.toLowerCase()) ||
        (sub.title && sub.title.toLowerCase().trim() === p.title.toLowerCase().trim())
      );
      if (isSolved) solvedCount++;
      return {
        ...p,
        isSolvedBySelectedStudent: isSolved
      };
    });

    const userRate = problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0;

    return {
      ...t,
      totalProblems: problems.length,
      userSolvedCount: solvedCount,
      userCompletionRate: userRate,
      problems: problemsWithSolved
    };
  });

  const compareStudents = (a: any, b: any) => {
    const snapA = a.latest_snapshot;
    const snapB = b.latest_snapshot;
    const solvedA = snapA?.total_solved || 0;
    const solvedB = snapB?.total_solved || 0;
    if (solvedB !== solvedA) return solvedB - solvedA;

    const medA = snapA?.medium || 0;
    const medB = snapB?.medium || 0;
    if (medB !== medA) return medB - medA;

    const hardA = snapA?.hard || 0;
    const hardB = snapB?.hard || 0;
    if (hardB !== hardA) return hardB - hardA;

    const scoreA = snapA?.engagement_score || 0;
    const scoreB = snapB?.engagement_score || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const rateA = snapA?.contest_rating || 0;
    const rateB = snapB?.contest_rating || 0;
    return rateB - rateA;
  };

  const allStudents = getAllEnrichedStudents();
  const deptSorted = [...allStudents].sort(compareStudents);
  const rankInDept = deptSorted.findIndex(s => s.id === student.id) + 1 || 1;

  const sectionStudents = allStudents.filter(s => s.section === student.section);
  const sectionSorted = [...sectionStudents].sort(compareStudents);
  const rankInSec = sectionSorted.findIndex(s => s.id === student.id) + 1 || 1;

  return {
    student: enrichedStudent,
    potd: potdListWithSolved[0] || null,
    potdList: potdListWithSolved,
    contests,
    tracks: studentTracks,
    recentSubmissions,
    rankInSection: rankInSec,
    rankInDepartment: rankInDept,
    totalStudentsDepartment: allStudents.length,
    totalStudentsSection: sectionStudents.length
  };
}

function buildFacultyDashboardPayload() {
  const students = getAllEnrichedStudents();
  const settings = db.getSettings();
  const summary = computeDashboardSummary(students, settings);
  const sectionStats = computeSectionStats(students, settings);
  const batchStats = computeBatchStats(students, settings);

  const allSnaps = db.getSnapshots();
  const dateMap = new Map<string, { date: string; totalSolved: number; count: number; avgRating: number; ratingCount: number }>();
  allSnaps.forEach(snap => {
    const d = snap.captured_at.split('T')[0];
    if (!dateMap.has(d)) {
      dateMap.set(d, { date: d, totalSolved: 0, count: 0, avgRating: 0, ratingCount: 0 });
    }
    const item = dateMap.get(d)!;
    item.totalSolved += snap.total_solved;
    item.count++;
    if (snap.contest_rating > 0) {
      item.avgRating += snap.contest_rating;
      item.ratingCount++;
    }
  });

  const timeline = Array.from(dateMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(item => ({
      date: item.date,
      total_problems: item.totalSolved,
      avg_problems: item.count > 0 ? Math.round(item.totalSolved / item.count) : 0,
      avg_rating: item.ratingCount > 0 ? Math.round(item.avgRating / item.ratingCount) : 0,
    }));

  return {
    dashData: {
      summary,
      sectionStats,
      batchStats,
      timeline,
      settings
    },
    students
  };
}

// ================= AUTH ROUTES =================

// 0. Login (Staff or Student)
app.post('/api/auth/login', (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    if (!checkLoginRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many failed login attempts. Please wait 1 minute before trying again.' });
    }

    const { identifier, username, password, role } = req.body;
    const loginId = identifier || username;

    if (!loginId) {
      return res.status(400).json({ error: 'Email ID / Register Number is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required to log in.' });
    }

    const authResult = db.authenticateUser(loginId, password, role);
    if (!authResult) {
      recordFailedLogin(clientIp);
      return res.status(401).json({ 
        error: role === 'student' 
          ? 'Invalid student credentials. Please check your Email ID / Register Number and password.'
          : 'Invalid staff credentials. Please check your username and password.'
      });
    }

    clearFailedLogin(clientIp);
    const { user, student } = authResult;
    const token = createAuthToken(user);

    let enrichedStudent: StudentWithLatest | undefined;
    let studentDashboard: any = null;
    let facultyDashboard: any = null;

    if (user.role === 'student' && (user.student_id || student?.id)) {
      const targetStudentId = user.student_id || student?.id;
      const s = student || (targetStudentId ? db.getStudentById(targetStudentId) : undefined);
      if (s) {
        studentDashboard = buildStudentDashboardPayload(s.id);
        enrichedStudent = studentDashboard?.student;

        // Async background sync for logged in student
        setTimeout(() => {
          const settings = db.getSettings();
          fetchLeetCodeProfile(s.username, settings.api_timeout_seconds * 1000).then(fetchResult => {
            if (fetchResult.status === 'SUCCESS' && fetchResult.data) {
              const prevSnap = db.getLatestSnapshot(s.id);
              const daysInactive = getDaysInactive(fetchResult.data.last_active);
              const activityStatus = getActivityStatus(daysInactive, settings.inactivity_threshold_days);
              const tier = getPerformanceTier(fetchResult.data.total_solved, settings);
              const impRate = prevSnap ? Math.max(0, fetchResult.data.total_solved - prevSnap.total_solved) : 0;
              const engagement = calculateEngagementScore({
                total_solved: fetchResult.data.total_solved,
                medium: fetchResult.data.medium,
                hard: fetchResult.data.hard,
                streak: fetchResult.data.streak,
                contest_rating: fetchResult.data.contest_rating,
                contests_attended: fetchResult.data.contests_attended,
                days_inactive: daysInactive,
                improvement_rate: impRate,
              }, settings);

              db.addSnapshot({
                student_id: s.id,
                captured_at: new Date().toISOString(),
                total_solved: fetchResult.data.total_solved,
                easy: fetchResult.data.easy,
                medium: fetchResult.data.medium,
                hard: fetchResult.data.hard,
                acceptance_rate: fetchResult.data.acceptance_rate,
                ranking: fetchResult.data.ranking,
                reputation: fetchResult.data.reputation,
                contest_rating: fetchResult.data.contest_rating,
                contest_rank: fetchResult.data.contest_rank,
                contests_attended: fetchResult.data.contests_attended,
                top_percentage: fetchResult.data.top_percentage,
                streak: fetchResult.data.streak,
                active_days: fetchResult.data.active_days,
                last_active: fetchResult.data.last_active,
                languages: fetchResult.data.languages,
                skills: fetchResult.data.skills,
                badges: fetchResult.data.badges,
                submission_calendar: fetchResult.data.submission_calendar,
                engagement_score: engagement,
                performance_tier: tier,
                activity_status: activityStatus,
                status: 'SUCCESS'
              });

              if (fetchResult.data.recent_submissions && fetchResult.data.recent_submissions.length > 0) {
                db.setSubmissions(s.id, fetchResult.data.recent_submissions.map((sub, idx) => ({
                  id: `sub_${s.id}_${Date.now()}_${idx}`,
                  student_id: s.id,
                  title: sub.title,
                  titleSlug: sub.titleSlug,
                  timestamp: sub.timestamp,
                  language: sub.language || sub.lang || (fetchResult.data.languages && fetchResult.data.languages.length > 0 ? fetchResult.data.languages[0].languageName : 'Python3'),
                  statusDisplay: sub.statusDisplay || 'Accepted',
                })));
              }
            }
          }).catch(err => console.log('Auto login student sync background error:', err));
        }, 500);
      }
    } else if (user.role === 'staff') {
      facultyDashboard = buildFacultyDashboardPayload();
      // Delay batch fetch worker by 5 seconds to avoid network & DB contention on initial faculty load
      setTimeout(() => {
        if (!batchProgress.is_running) {
          const activeStudents = db.getStudents().filter(s => s.active);
          if (activeStudents.length > 0) {
            runBatchFetchWorker(activeStudents, 'Auto Faculty Login Sync');
          }
        }
      }, 5000);
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        student: enrichedStudent,
        created_at: user.created_at
      },
      studentDashboard,
      facultyDashboard
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// 0.1 Current authenticated user
app.get('/api/auth/me', (req, res) => {
  try {
    const session = parseAuthHeader(req);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = db.getUserById(session.id);
    if (!user) {
      return res.status(401).json({ error: 'User session expired or user not found' });
    }

    let enrichedStudent: StudentWithLatest | undefined;
    if (user.role === 'student' && user.student_id) {
      const s = db.getStudentById(user.student_id);
      if (s) {
        const snapshots = db.getSnapshots(s.id);
        const settings = db.getSettings();
        enrichedStudent = enrichStudentWithSnapshots(s, snapshots, settings);
      }
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        student: enrichedStudent,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user session.' });
  }
});

// 0.2 Change password
app.post('/api/auth/change-password', (req, res) => {
  try {
    const session = parseAuthHeader(req);
    const { userId, oldPassword, newPassword } = req.body;
    const targetUserId = session?.id || userId;

    if (!targetUserId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required.' });
    }

    const user = db.getUserById(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (oldPassword) {
      const checkAuth = db.authenticateUser(user.username, oldPassword, user.role);
      if (!checkAuth) {
        return res.status(401).json({ error: 'Current password does not match.' });
      }
    }

    const success = db.changeUserPassword(targetUserId, newPassword);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update password.' });
    }

    db.addLog('INFO', `Password updated for user ${user.username} (${user.role}).`);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to change password.' });
  }
});

// ================= DSA QUEST ROUTES =================

app.get('/api/quest/nodes', (req, res) => {
  res.json({ nodes: LEETCODE_DSA_QUEST_NODES });
});

app.get('/api/quest/student', (req, res) => {
  try {
    const session = parseAuthHeader(req);
    const studentIdQuery = req.query.studentId as string;
    const studentId = session?.student_id || studentIdQuery;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID required.' });
    }

    const student = db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const snapshots = db.getSnapshots(student.id);
    const settings = db.getSettings();
    const enriched = enrichStudentWithSnapshots(student, snapshots, settings);

    const questProgress = computeStudentQuestProgress(enriched, enriched.latest_snapshot);
    res.json({ questProgress });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch student quest progress.' });
  }
});

app.get('/api/quest/faculty-overview', (req, res) => {
  try {
    const students = db.getStudents();
    const settings = db.getSettings();
    const studentsWithLatest = students.map(s => {
      const snapshots = db.getSnapshots(s.id);
      return enrichStudentWithSnapshots(s, snapshots, settings);
    });

    const summary = computeFacultyQuestSummary(studentsWithLatest);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch faculty quest summary.' });
  }
});

// ================= LEETCODE 75 ROUTES =================

app.get('/api/leetcode75/problems', (req, res) => {
  res.json({ categories: LEETCODE_75_CATEGORIES });
});

app.get('/api/leetcode75/student', (req, res) => {
  try {
    const session = parseAuthHeader(req);
    const studentIdQuery = req.query.studentId as string;
    const studentId = session?.student_id || studentIdQuery;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID required.' });
    }

    const student = db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const snapshots = db.getSnapshots(student.id);
    const settings = db.getSettings();
    const enriched = enrichStudentWithSnapshots(student, snapshots, settings);
    const submissions = db.getSubmissions(student.id);

    const leetcode75Progress = computeStudentLeetCode75Progress(enriched, enriched.latest_snapshot, submissions);
    res.json({ leetcode75Progress, categories: LEETCODE_75_CATEGORIES });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch student LeetCode 75 progress.' });
  }
});

app.get('/api/leetcode75/faculty-overview', (req, res) => {
  try {
    const students = db.getStudents();
    const settings = db.getSettings();
    const studentsWithLatest = students.map(s => {
      const snapshots = db.getSnapshots(s.id);
      const subs = db.getSubmissions(s.id);
      const enriched = enrichStudentWithSnapshots(s, snapshots, settings);
      return { ...enriched, submissions: subs };
    });

    const summary = computeFacultyLeetCode75Summary(studentsWithLatest);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch faculty LeetCode 75 summary.' });
  }
});

// ================= STUDENT PORTAL ROUTES =================

// 0.3 Student Personalized Dashboard
app.get('/api/student/dashboard', (req, res) => {
  try {
    const session = parseAuthHeader(req);
    const studentIdQuery = req.query.studentId as string;
    const studentId = session?.student_id || studentIdQuery;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID required.' });
    }

    // Authorization: logged-in students can only view their own dashboard
    if (session && session.role === 'student' && session.student_id && studentIdQuery && studentIdQuery !== session.student_id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own student dashboard.' });
    }

    const payload = buildStudentDashboardPayload(studentId);
    if (!payload) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate student dashboard.' });
  }
});

// 0.4 Student Live LeetCode Sync
app.post('/api/student/sync', async (req, res) => {
  try {
    const session = parseAuthHeader(req);
    const studentId = session?.student_id || req.body.studentId;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID required.' });
    }

    // Authorization: students can only synchronize their own profile
    if (session && session.role === 'student' && session.student_id && req.body.studentId && req.body.studentId !== session.student_id) {
      return res.status(403).json({ error: 'Access denied. You can only synchronize your own LeetCode account.' });
    }

    const student = db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const settings = db.getSettings();
    const fetchResult = await fetchLeetCodeProfile(
      student.username, 
      settings.api_timeout_seconds * 1000
    );

    const prevSnapshot = db.getLatestSnapshot(student.id);

    if (fetchResult.status === 'SUCCESS' && fetchResult.data) {
      const data = fetchResult.data;
      const daysInactive = getDaysInactive(data.last_active);
      const activityStatus = getActivityStatus(daysInactive, settings.inactivity_threshold_days);
      const tier = getPerformanceTier(data.total_solved, settings);

      const impRate = prevSnapshot ? Math.max(0, data.total_solved - prevSnapshot.total_solved) : 0;
      
      const engagement = calculateEngagementScore({
        total_solved: data.total_solved,
        medium: data.medium,
        hard: data.hard,
        streak: data.streak,
        contest_rating: data.contest_rating,
        contests_attended: data.contests_attended,
        days_inactive: daysInactive,
        improvement_rate: impRate,
      }, settings);

      const snapshot = db.addSnapshot({
        student_id: student.id,
        captured_at: new Date().toISOString(),
        total_solved: data.total_solved,
        easy: data.easy,
        medium: data.medium,
        hard: data.hard,
        acceptance_rate: data.acceptance_rate,
        ranking: data.ranking,
        reputation: data.reputation,
        contest_rating: data.contest_rating,
        contest_rank: data.contest_rank,
        contests_attended: data.contests_attended,
        top_percentage: data.top_percentage,
        streak: data.streak,
        active_days: data.active_days,
        last_active: data.last_active,
        languages: data.languages,
        skills: data.skills,
        badges: data.badges,
        submission_calendar: data.submission_calendar,
        engagement_score: engagement,
        performance_tier: tier,
        activity_status: activityStatus,
        status: 'SUCCESS',
      });

      if (data.recent_submissions && data.recent_submissions.length > 0) {
        db.setSubmissions(student.id, data.recent_submissions.map((s, idx) => ({
          id: `sub_${student.id}_${Date.now()}_${idx}`,
          student_id: student.id,
          title: s.title,
          titleSlug: s.titleSlug,
          timestamp: s.timestamp,
          language: s.language || s.lang || (data.languages && data.languages.length > 0 ? data.languages[0].languageName : 'Python3'),
          statusDisplay: s.statusDisplay || 'Accepted',
        })));
      }

      db.addLog('INFO', `[Student Portal Sync] ${student.student_name} refreshed their LeetCode profile: ${data.total_solved} solved.`);

      const enriched = enrichStudentWithSnapshots(student, [snapshot], settings);

      return res.json({
        success: true,
        status: 'SUCCESS',
        snapshot,
        student: enriched
      });
    } else {
      return res.status(400).json({
        success: false,
        status: fetchResult.status,
        error: fetchResult.error || 'Failed to fetch latest LeetCode profile.'
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error during student live sync.' });
  }
});

// ================= API ROUTES =================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Dashboard Summary
app.get('/api/dashboard', (req, res) => {
  try {
    const students = getAllEnrichedStudents();
    const settings = db.getSettings();
    const summary = computeDashboardSummary(students, settings);
    const sectionStats = computeSectionStats(students, settings);
    const batchStats = computeBatchStats(students, settings);

    // Collect historical timeline aggregates for dashboard charts
    const allSnaps = db.getSnapshots();
    const dateMap = new Map<string, { date: string; totalSolved: number; count: number; avgRating: number; ratingCount: number }>();
    
    allSnaps.forEach(snap => {
      const d = snap.captured_at.split('T')[0];
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, totalSolved: 0, count: 0, avgRating: 0, ratingCount: 0 });
      }
      const item = dateMap.get(d)!;
      item.totalSolved += snap.total_solved;
      item.count++;
      if (snap.contest_rating > 0) {
        item.avgRating += snap.contest_rating;
        item.ratingCount++;
      }
    });

    const timeline = Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        date: item.date,
        total_problems: item.totalSolved,
        avg_problems: item.count > 0 ? Math.round(item.totalSolved / item.count) : 0,
        avg_rating: item.ratingCount > 0 ? Math.round(item.avgRating / item.ratingCount) : 0,
      }));

    res.json({
      summary,
      sectionStats,
      batchStats,
      timeline,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute dashboard analytics.' });
  }
});

// 3. Students - List & Filter
app.get('/api/students', (req, res) => {
  try {
    let students = getAllEnrichedStudents();
    const { search, section, year, batch, tier, activity } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      students = students.filter(s => 
        s.student_name.toLowerCase().includes(q) ||
        s.register_no.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        (s.mentor && s.mentor.toLowerCase().includes(q))
      );
    }

    if (section && typeof section === 'string' && section !== 'ALL') {
      students = students.filter(s => s.section === section);
    }

    if (year && typeof year === 'string' && year !== 'ALL') {
      students = students.filter(s => s.year === year);
    }

    if (batch && typeof batch === 'string' && batch !== 'ALL') {
      students = students.filter(s => s.batch === batch);
    }

    if (tier && typeof tier === 'string' && tier !== 'ALL') {
      students = students.filter(s => (s.latest_snapshot?.performance_tier || 'Beginner') === tier);
    }

    if (activity && typeof activity === 'string' && activity !== 'ALL') {
      students = students.filter(s => (s.latest_snapshot?.activity_status || 'No Data') === activity);
    }

    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list students.' });
  }
});

// 4. Student - Get Single Detail & History
app.get('/api/students/:id', (req, res) => {
  try {
    const student = db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const snapshots = db.getSnapshots(student.id);
    const submissions = db.getSubmissions(student.id);
    const settings = db.getSettings();
    const enriched = enrichStudentWithSnapshots(student, snapshots, settings);

    res.json({
      student: enriched,
      snapshots,
      recent_submissions: submissions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch student details.' });
  }
});

// 5. Student - Create
app.post('/api/students', requireStaff, async (req, res) => {
  try {
    const { register_no, student_name, section, year, batch, username, email, mentor, academic_year, notes } = req.body;

    if (!register_no || !student_name || !username) {
      return res.status(400).json({ error: 'Register Number, Student Name, and LeetCode Username are required.' });
    }

    // Duplicate check
    const existingUsername = db.getStudentByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: `LeetCode username '${username}' is already registered to ${existingUsername.student_name} (${existingUsername.register_no}).` });
    }

    const existingReg = db.getStudentByRegisterNo(register_no);
    if (existingReg) {
      return res.status(400).json({ error: `Register number '${register_no}' is already registered.` });
    }

    const student = db.addStudent({
      register_no: register_no.trim().toUpperCase(),
      student_name: student_name.trim(),
      section: (section || 'A').trim().toUpperCase(),
      year: (year || 'II').trim(),
      batch: (batch || '2023-2027').trim(),
      username: username.trim(),
      email: email ? email.trim() : undefined,
      mentor: mentor ? mentor.trim() : undefined,
      academic_year: academic_year ? academic_year.trim() : db.getSettings().academic_year,
      notes: notes ? notes.trim() : undefined,
      active: true,
    });

    db.addLog('INFO', `Added student ${student.student_name} (${student.register_no}) with LeetCode handle ${student.username}.`);

    // Automatically fetch LeetCode profile statistics for the new student
    if (student.username && !student.username.startsWith('pending_')) {
      try {
        const settings = db.getSettings();
        const fetchResult = await fetchLeetCodeProfile(
          student.username,
          settings.api_timeout_seconds * 1000
        );

        if (fetchResult.status === 'SUCCESS' && fetchResult.data) {
          const data = fetchResult.data;
          const daysInactive = getDaysInactive(data.last_active);
          const activityStatus = getActivityStatus(daysInactive, settings.inactivity_threshold_days);
          const tier = getPerformanceTier(data.total_solved, settings);

          const engagement = calculateEngagementScore({
            total_solved: data.total_solved,
            medium: data.medium,
            hard: data.hard,
            streak: data.streak,
            contest_rating: data.contest_rating,
            contests_attended: data.contests_attended,
            days_inactive: daysInactive,
            improvement_rate: 0,
          }, settings);

          db.addSnapshot({
            student_id: student.id,
            captured_at: new Date().toISOString(),
            total_solved: data.total_solved,
            easy: data.easy,
            medium: data.medium,
            hard: data.hard,
            acceptance_rate: data.acceptance_rate,
            ranking: data.ranking,
            reputation: data.reputation,
            contest_rating: data.contest_rating,
            contest_rank: data.contest_rank,
            contests_attended: data.contests_attended,
            top_percentage: data.top_percentage,
            streak: data.streak,
            active_days: data.active_days,
            last_active: data.last_active,
            languages: data.languages,
            skills: data.skills,
            badges: data.badges,
            submission_calendar: data.submission_calendar,
            engagement_score: engagement,
            performance_tier: tier,
            activity_status: activityStatus,
            status: 'SUCCESS',
          });

          if (data.recent_submissions && data.recent_submissions.length > 0) {
            db.setSubmissions(student.id, data.recent_submissions.map((s, idx) => ({
              id: `sub_${student.id}_${Date.now()}_${idx}`,
              student_id: student.id,
              title: s.title,
              titleSlug: s.titleSlug,
              timestamp: s.timestamp,
              language: s.language || s.lang || 'Python3',
              statusDisplay: s.statusDisplay || 'Accepted',
            })));
          }
        }
      } catch (autoFetchErr) {
        console.warn(`[Auto-Fetch] Failed to fetch LeetCode profile for new student ${student.username}:`, autoFetchErr);
      }
    }

    res.status(201).json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create student.' });
  }
});

// 6. Student - Update
app.put('/api/students/:id', requireStaff, (req, res) => {
  try {
    const student = db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const { username, register_no } = req.body;
    if (username && username.toLowerCase() !== student.username.toLowerCase()) {
      const dup = db.getStudentByUsername(username);
      if (dup && dup.id !== student.id) {
        return res.status(400).json({ error: `LeetCode username '${username}' is already used by ${dup.student_name}.` });
      }
    }

    if (register_no && register_no.toLowerCase() !== student.register_no.toLowerCase()) {
      const dup = db.getStudentByRegisterNo(register_no);
      if (dup && dup.id !== student.id) {
        return res.status(400).json({ error: `Register number '${register_no}' is already registered.` });
      }
    }

    const updated = db.updateStudent(student.id, req.body);
    db.addLog('INFO', `Updated details for student ${student.student_name} (${student.register_no}).`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update student.' });
  }
});

// 7. Student - Delete
app.delete('/api/students/:id', requireStaff, (req, res) => {
  try {
    const student = db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    db.deleteStudent(student.id);
    db.addLog('WARN', `Deleted student ${student.student_name} (${student.register_no}) and associated history.`);
    res.json({ message: 'Student and history deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete student.' });
  }
});

// 8. Bulk Import Students (CSV / JSON data payload)
app.post('/api/students/import', requireStaff, (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No student data rows provided.' });
    }

    const inserted: any[] = [];
    const updated: any[] = [];
    const errors: { row: number; identifier: string; error: string }[] = [];

    const allStudents = db.getStudents();
    const studentByRegMap = new Map<string, any>();
    const studentByUsernameMap = new Map<string, any>();
    const studentByEmailMap = new Map<string, any>();

    allStudents.forEach(s => {
      if (s.register_no) {
        studentByRegMap.set(s.register_no.trim().toLowerCase(), s);
      }
      if (s.username && !s.username.toLowerCase().startsWith('pending_')) {
        studentByUsernameMap.set(s.username.trim().toLowerCase(), s);
      }
      if (s.email) {
        studentByEmailMap.set(s.email.trim().toLowerCase(), s);
      }
    });

    const activeUsernames = new Set(allStudents.map(s => s.username.toLowerCase()));

    rows.forEach((r, idx) => {
      let regNo = '';
      let name = '';
      let username = '';
      let rawSec = '';
      let rawYear = '';
      let batch = '';
      let email = '';
      let mentor = '';

      // Collect all non-empty cell values
      const keys = Object.keys(r);
      const values = keys.map(k => (r[k] ?? '').toString().trim()).filter(v => v.length > 0);

      // Skip table header rows (e.g. if row contains "Student Name", "Register Number", etc.)
      const isHeaderRow = values.some(v => {
        const lower = v.toLowerCase();
        return lower === 'student name' || lower === 'register number' || lower === 'leetcode username' || lower === 'register no';
      });
      if (isHeaderRow) return;

      // Strategy 1: Dynamic Key Matching
      keys.forEach(key => {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const val = (r[key] ?? '').toString().trim();
        if (!val) return;

        if (cleanKey.includes('register') || cleanKey.includes('regno') || cleanKey.includes('regnum') || cleanKey === 'reg') {
          if (!regNo) regNo = val.toUpperCase();
        } else if (cleanKey.includes('leetcode') || cleanKey === 'username' || cleanKey === 'user') {
          if (!username) username = val;
        } else if (cleanKey.includes('name') || cleanKey === 'student' || cleanKey === 'studentname') {
          if (!name) name = val;
        } else if (cleanKey.includes('section') || cleanKey === 'class' || cleanKey === 'sec') {
          if (!rawSec) rawSec = val.toUpperCase();
        } else if (cleanKey.includes('year') || cleanKey === 'yr') {
          if (!rawYear) rawYear = val.toUpperCase();
        } else if (cleanKey.includes('batch')) {
          if (!batch) batch = val;
        } else if (cleanKey.includes('email') || cleanKey.includes('mail')) {
          if (!email) email = val;
        } else if (cleanKey.includes('mentor')) {
          if (!mentor) mentor = val;
        }
      });

      // Strategy 2: Value Pattern Fallback (if regNo or name still missing)
      if (!regNo) {
        const regMatch = values.find(v => /^[0-9]{4,}[A-Za-z0-9]+$/i.test(v));
        if (regMatch) regNo = regMatch.toUpperCase();
      }

      if (!email) {
        const emailMatch = values.find(v => v.includes('@'));
        if (emailMatch) email = emailMatch;
      }

      if (!name) {
        const nameMatch = values.find(v => {
          if (v === regNo || v === email || v === username || v === rawSec || v === rawYear || v === batch) return false;
          if (/^\d+$/.test(v) || v.includes('@') || v.length < 2) return false;
          if (/^(section|year|batch|ii|iii|iv|202\d)/i.test(v)) return false;
          return /[a-zA-Z]/.test(v);
        });
        if (nameMatch) name = nameMatch;
      }

      let section: string | undefined = undefined;
      if (rawSec) {
        const cleanSec = rawSec.trim().toUpperCase();
        if (cleanSec.includes('SECTION A') || cleanSec.includes('SEC A') || cleanSec.includes('SEC-A') || cleanSec === 'A' || cleanSec === '1') {
          section = 'A';
        } else if (cleanSec.includes('SECTION B') || cleanSec.includes('SEC B') || cleanSec.includes('SEC-B') || cleanSec === 'B' || cleanSec === '2') {
          section = 'B';
        } else if (cleanSec.includes('SECTION C') || cleanSec.includes('SEC C') || cleanSec.includes('SEC-C') || cleanSec === 'C' || cleanSec === '3') {
          section = 'C';
        } else {
          section = cleanSec;
        }
      }

      let year: string | undefined = undefined;
      if (rawYear) {
        const cleanYr = rawYear.trim().toUpperCase();
        if (/\b(IV|4TH|4|FOURTH)\b/i.test(cleanYr)) {
          year = 'IV';
        } else if (/\b(III|3RD|3|THIRD)\b/i.test(cleanYr)) {
          year = 'III';
        } else if (/\b(II|2ND|2|SECOND)\b/i.test(cleanYr)) {
          year = 'II';
        } else if (/\b(I|1ST|1|FIRST)\b/i.test(cleanYr)) {
          year = 'I';
        } else {
          year = cleanYr;
        }
      }

      if (!year) year = 'III';

      if (!regNo && !name && !email) {
        errors.push({ row: idx + 1, identifier: `Row ${idx + 1}`, error: 'Missing mandatory field (Register No or Student Name).' });
        return;
      }

      // Find existing student by Register No, Email, or Username
      let existingStudent = regNo ? studentByRegMap.get(regNo.toLowerCase()) : null;
      if (!existingStudent && email) {
        existingStudent = studentByEmailMap.get(email.toLowerCase());
      }
      if (!existingStudent && username && !username.toLowerCase().startsWith('pending_')) {
        existingStudent = studentByUsernameMap.get(username.toLowerCase());
      }

      if (existingStudent) {
        // UPDATE existing student record dynamically with new values from uploaded dataset row
        const updateFields: any = {};
        let updatedAny = false;

        if (name && name.trim() !== existingStudent.student_name) {
          updateFields.student_name = name.trim();
          updatedAny = true;
        }
        if (section && section !== existingStudent.section) {
          updateFields.section = section;
          updatedAny = true;
        }
        if (year && year !== existingStudent.year) {
          updateFields.year = year;
          updatedAny = true;
        }
        if (batch && batch !== existingStudent.batch) {
          updateFields.batch = batch;
          updatedAny = true;
        }
        if (email && email !== existingStudent.email) {
          updateFields.email = email;
          updatedAny = true;
        }
        if (mentor && mentor !== existingStudent.mentor) {
          updateFields.mentor = mentor;
          updatedAny = true;
        }
        if (regNo && regNo !== existingStudent.register_no) {
          updateFields.register_no = regNo;
          updatedAny = true;
        }

        if (username) {
          const cleanUsername = username.trim();
          const oldUsername = existingStudent.username || '';
          if (cleanUsername.toLowerCase() !== oldUsername.toLowerCase()) {
            const matchOther = studentByUsernameMap.get(cleanUsername.toLowerCase());
            if (matchOther && matchOther.id !== existingStudent.id) {
              errors.push({ row: idx + 1, identifier: regNo || name, error: `LeetCode handle '${cleanUsername}' is already assigned to another student (${matchOther.student_name}).` });
            } else {
              updateFields.username = cleanUsername;
              updatedAny = true;
            }
          }
        }

        if (updatedAny) {
          const resStudent = db.updateStudent(existingStudent.id, updateFields);
          if (resStudent) {
            updated.push(resStudent);
            if (resStudent.register_no) studentByRegMap.set(resStudent.register_no.toLowerCase(), resStudent);
            if (resStudent.username && !resStudent.username.startsWith('pending_')) {
              studentByUsernameMap.set(resStudent.username.toLowerCase(), resStudent);
            }
            if (resStudent.email) studentByEmailMap.set(resStudent.email.toLowerCase(), resStudent);
          }
        } else {
          updated.push(existingStudent);
        }
      } else {
        // INSERT new student record dynamically
        if (!regNo || !name) {
          errors.push({ row: idx + 1, identifier: regNo || name || `Row ${idx + 1}`, error: 'Missing mandatory field (Register No or Student Name).' });
          return;
        }

        const finalUsername = username ? username : `pending_${regNo.toLowerCase()}`;
        if (username && activeUsernames.has(username.toLowerCase())) {
          errors.push({ row: idx + 1, identifier: username, error: `Duplicate username '${username}' already exists in database.` });
          return;
        }

        const newStudent = db.addStudent({
          register_no: regNo,
          student_name: name,
          section: section || 'A',
          year: year || 'II',
          batch: batch || '2024-2028',
          username: finalUsername,
          email: email || undefined,
          mentor: mentor || undefined,
          academic_year: db.getSettings().academic_year,
          active: true,
        });

        inserted.push(newStudent);
        if (newStudent.register_no) studentByRegMap.set(newStudent.register_no.toLowerCase(), newStudent);
        if (username) studentByUsernameMap.set(username.toLowerCase(), newStudent);
        if (email) studentByEmailMap.set(email.toLowerCase(), newStudent);
        activeUsernames.add(finalUsername.toLowerCase());
      }
    });

    db.addLog('INFO', `Imported ${inserted.length} new students and updated ${updated.length} existing students. Encountered ${errors.length} validation errors.`);

    // Ensure complete cloud database synchronization for all newly imported/updated student records
    db.syncAllToSupabase().catch(err => {
      console.error('[Supabase] Post-import cloud sync error:', err);
    });

    // Automatically trigger background LeetCode profile fetch for newly inserted or updated students with handles
    const allProcessed = [...inserted, ...updated];
    const toFetch = allProcessed.filter(s => s.username && !s.username.startsWith('pending_'));
    if (toFetch.length > 0) {
      setTimeout(() => {
        runBatchFetchWorker(toFetch, 'Auto-Sync Post Roster Upload/Update').catch(err => {
          console.error('[Auto-Fetch] Roster upload worker error:', err);
        });
      }, 100);
    }

    res.json({
      success: true,
      insertedCount: inserted.length,
      updatedCount: updated.length,
      errorsCount: errors.length,
      errors,
      inserted,
      updated,
      autoFetchStarted: toFetch.length > 0,
      autoFetchCount: toFetch.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to import student dataset.' });
  }
});

// 9. Download Student Master Import Template (.xlsx / .csv)
app.get('/api/students/template', (req, res) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
    if (format === 'csv') {
      const csv = generateStudentTemplateCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="csbs_students_import_template.csv"');
      return res.send(csv);
    }

    const excelBuf = generateStudentTemplateExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="csbs_students_import_template.xlsx"');
    res.send(excelBuf);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate template.' });
  }
});

// 10. Fetch Single Student LeetCode Data
app.post('/api/fetch/student/:id', async (req, res) => {
  try {
    const student = db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const settings = db.getSettings();
    const fetchResult = await fetchLeetCodeProfile(
      student.username, 
      settings.api_timeout_seconds * 1000
    );

    const prevSnapshot = db.getLatestSnapshot(student.id);

    if (fetchResult.status === 'SUCCESS' && fetchResult.data) {
      const data = fetchResult.data;
      const daysInactive = getDaysInactive(data.last_active);
      const activityStatus = getActivityStatus(daysInactive, settings.inactivity_threshold_days);
      const tier = getPerformanceTier(data.total_solved, settings);

      const impRate = prevSnapshot ? Math.max(0, data.total_solved - prevSnapshot.total_solved) : 0;
      
      const engagement = calculateEngagementScore({
        total_solved: data.total_solved,
        medium: data.medium,
        hard: data.hard,
        streak: data.streak,
        contest_rating: data.contest_rating,
        contests_attended: data.contests_attended,
        days_inactive: daysInactive,
        improvement_rate: impRate,
      }, settings);

      const snapshot = db.addSnapshot({
        student_id: student.id,
        captured_at: new Date().toISOString(),
        total_solved: data.total_solved,
        easy: data.easy,
        medium: data.medium,
        hard: data.hard,
        acceptance_rate: data.acceptance_rate,
        ranking: data.ranking,
        reputation: data.reputation,
        contest_rating: data.contest_rating,
        contest_rank: data.contest_rank,
        contests_attended: data.contests_attended,
        top_percentage: data.top_percentage,
        streak: data.streak,
        active_days: data.active_days,
        last_active: data.last_active,
        languages: data.languages,
        skills: data.skills,
        badges: data.badges,
        submission_calendar: data.submission_calendar,
        engagement_score: engagement,
        performance_tier: tier,
        activity_status: activityStatus,
        status: 'SUCCESS',
      });

      if (data.recent_submissions && data.recent_submissions.length > 0) {
        db.setSubmissions(student.id, data.recent_submissions.map((s, idx) => ({
          id: `sub_${student.id}_${Date.now()}_${idx}`,
          student_id: student.id,
          title: s.title,
          titleSlug: s.titleSlug,
          timestamp: s.timestamp,
          language: s.language || s.lang || (data.languages && data.languages.length > 0 ? data.languages[0].languageName : 'Python3'),
          statusDisplay: s.statusDisplay || 'Accepted',
        })));
      }

      db.addLog('INFO', `Successfully updated snapshot for ${student.student_name} (${student.username}): ${data.total_solved} solved.`);

      return res.json({
        success: true,
        status: 'SUCCESS',
        snapshot,
      });
    } else {
      // Failed fetch or user not found
      const status = fetchResult.status;
      const errorMsg = fetchResult.error || 'Failed to fetch data';

      // Record snapshot with error status
      const failedSnap = db.addSnapshot({
        student_id: student.id,
        captured_at: new Date().toISOString(),
        total_solved: prevSnapshot?.total_solved || 0,
        easy: prevSnapshot?.easy || 0,
        medium: prevSnapshot?.medium || 0,
        hard: prevSnapshot?.hard || 0,
        acceptance_rate: prevSnapshot?.acceptance_rate || 0,
        ranking: prevSnapshot?.ranking || 0,
        reputation: prevSnapshot?.reputation || 0,
        contest_rating: prevSnapshot?.contest_rating || 0,
        contest_rank: prevSnapshot?.contest_rank || 0,
        contests_attended: prevSnapshot?.contests_attended || 0,
        top_percentage: prevSnapshot?.top_percentage || 0,
        streak: prevSnapshot?.streak || 0,
        active_days: prevSnapshot?.active_days || 0,
        last_active: prevSnapshot?.last_active,
        languages: prevSnapshot?.languages || [],
        skills: prevSnapshot?.skills || [],
        badges: prevSnapshot?.badges || [],
        engagement_score: prevSnapshot?.engagement_score || 0,
        performance_tier: prevSnapshot?.performance_tier || 'Beginner',
        activity_status: 'No Data',
        status,
        error: errorMsg,
      });

      db.addLog('WARN', `Fetch issue for ${student.student_name} (${student.username}): ${status} - ${errorMsg}`);

      return res.json({
        success: false,
        status,
        error: errorMsg,
        snapshot: failedSnap,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error while fetching student data.' });
  }
});

// 11. Batch Fetch All Students (Async Background Execution)
app.post('/api/fetch/all', requireStaff, async (req, res) => {
  if (batchProgress.is_running) {
    return res.status(409).json({
      error: 'A batch fetch operation is already in progress.',
      progress: batchProgress,
    });
  }

  const { section, year } = req.body || {};
  let studentsToFetch = db.getStudents().filter(s => s.active);

  if (section && section !== 'ALL') {
    studentsToFetch = studentsToFetch.filter(s => s.section === section);
  }
  if (year && year !== 'ALL') {
    studentsToFetch = studentsToFetch.filter(s => s.year === year);
  }

  if (studentsToFetch.length === 0) {
    return res.status(400).json({ error: 'No active students found matching the selected criteria.' });
  }

  // Immediate response acknowledging start
  res.json({
    message: 'Batch synchronization started in background.',
    total: studentsToFetch.length,
  });

  // Execute asynchronously
  runBatchFetchWorker(studentsToFetch, 'Faculty Triggered Batch Sync');
});

// 12. Batch Fetch Progress
app.get('/api/fetch/progress', (req, res) => {
  res.json(batchProgress);
});

// 13. Cancel Batch Fetch
app.post('/api/fetch/cancel', requireStaff, (req, res) => {
  if (batchProgress.is_running) {
    batchProgress.is_running = false;
    batchProgress.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Batch synchronization was cancelled by faculty.',
      type: 'warn',
    });
    return res.json({ message: 'Batch synchronization stopped.' });
  }
  res.json({ message: 'No active batch synchronization.' });
});

// ================= POTD & CURATED TRACKS & CONTESTS ENDPOINTS =================

// 14. POTD - Get Today's Challenges + Student Completion (Multiple problems supported)
app.get('/api/potd', (req, res) => {
  try {
    const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const potdList = db.getTodayPOTDList(targetDate);
    const students = getAllEnrichedStudents();
    
    // For each problem in POTD, calculate which students solved it
    const enrichedList = potdList.map(item => {
      const solvedStudents: any[] = [];
      for (const student of students) {
        const subs = db.getSubmissions(student.id);
        const found = subs.find(s => 
          (s.titleSlug && s.titleSlug.toLowerCase() === item.titleSlug.toLowerCase()) ||
          (s.title && s.title.toLowerCase().trim() === item.title.toLowerCase().trim())
        );
        if (found) {
          solvedStudents.push({
            studentId: student.id,
            studentName: student.student_name,
            registerNo: student.register_no,
            section: student.section,
            username: student.username,
            solvedAt: found.timestamp,
          });
        }
      }

      return {
        ...item,
        solvedCount: solvedStudents.length,
        solvedStudents,
      };
    });

    const totalStudents = students.length;
    const avgSolvedCount = enrichedList.length > 0 
      ? enrichedList.reduce((acc, curr) => acc + curr.solvedCount, 0) / enrichedList.length 
      : 0;
    const completionRate = totalStudents > 0 ? Math.round((avgSolvedCount / totalStudents) * 100) : 0;

    res.json({
      potd: enrichedList[0] || null,
      potdList: enrichedList,
      departmentTotalStudents: totalStudents,
      completionRate,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch Problem of the Day.' });
  }
});

// 15. POTD - Add a new Problem of the Day link/challenge
app.post('/api/potd', requireStaff, (req, res) => {
  try {
    const { date, title, titleSlug, difficulty, topic, acceptanceRate, leetcodeUrl, hint, orderIndex } = req.body;
    if (!title && !leetcodeUrl) {
      return res.status(400).json({ error: 'Problem title or LeetCode URL is required.' });
    }

    // Auto extract slug and title from LeetCode URL if given
    let derivedSlug = titleSlug || '';
    let derivedTitle = title || '';

    if (leetcodeUrl && !derivedSlug) {
      const match = leetcodeUrl.match(/leetcode\.com\/problems\/([^/]+)/);
      if (match && match[1]) {
        derivedSlug = match[1];
        if (!derivedTitle) {
          derivedTitle = derivedSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }
    }

    if (!derivedTitle) derivedTitle = derivedSlug || 'New POTD Problem';
    if (!derivedSlug) derivedSlug = derivedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const d = date || new Date().toISOString().split('T')[0];
    const createdItem = db.addPOTDItem({
      date: d,
      title: derivedTitle.trim(),
      titleSlug: derivedSlug.trim(),
      difficulty: difficulty || 'Medium',
      topic: topic || 'General',
      acceptanceRate: acceptanceRate ? Number(acceptanceRate) : undefined,
      leetcodeUrl: leetcodeUrl || `https://leetcode.com/problems/${derivedSlug}/`,
      hint: hint || '',
      orderIndex: Number(orderIndex) || 0,
    });

    db.addLog('INFO', `POTD problem added for ${d}: ${derivedTitle}`);
    res.json({ success: true, potd: createdItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add Problem of the Day.' });
  }
});

// 15.1 POTD - Update a Problem of the Day
app.put('/api/potd/:id', requireStaff, (req, res) => {
  try {
    const updated = db.updatePOTDItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'POTD item not found.' });
    res.json({ success: true, potd: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update POTD item.' });
  }
});

// 15.2 POTD - Delete a Problem of the Day
app.delete('/api/potd/:id', requireStaff, (req, res) => {
  try {
    const ok = db.deletePOTDItem(req.params.id);
    if (!ok) return res.status(404).json({ error: 'POTD item not found.' });
    res.json({ success: true, message: 'POTD problem removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete POTD item.' });
  }
});

// ================= LEETCODE CONTESTS ENDPOINTS =================

// 15.3 Get Contests
app.get('/api/contests', (req, res) => {
  try {
    const contests = db.getContests();
    res.json(contests);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch contests.' });
  }
});

// 15.4 Get Contest By ID
app.get('/api/contests/:id', (req, res) => {
  try {
    const contest = db.getContestById(req.params.id);
    if (!contest) return res.status(404).json({ error: 'Contest not found.' });
    res.json(contest);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch contest.' });
  }
});

// 15.5 Create Contest
app.post('/api/contests', requireStaff, (req, res) => {
  try {
    const { title, titleSlug, type, contestUrl, startTime, durationMinutes, description, problems, status } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Contest title is required.' });
    }

    const newContest = db.addContest({
      title: title.trim(),
      titleSlug: titleSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: type || 'Weekly Contest',
      contestUrl: contestUrl || `https://leetcode.com/contest/${titleSlug || 'weekly-contest'}`,
      startTime: startTime || new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: Number(durationMinutes) || 90,
      description: description || '',
      problems: Array.isArray(problems) ? problems : [],
      status: status || 'UPCOMING',
    });

    db.addLog('INFO', `New contest scheduled: ${title} (${type})`);
    res.json({ success: true, contest: newContest });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create contest.' });
  }
});

// 15.6 Update Contest
app.put('/api/contests/:id', requireStaff, (req, res) => {
  try {
    const updated = db.updateContest(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Contest not found.' });
    res.json({ success: true, contest: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update contest.' });
  }
});

// 15.7 Delete Contest
app.delete('/api/contests/:id', requireStaff, (req, res) => {
  try {
    const ok = db.deleteContest(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Contest not found.' });
    res.json({ success: true, message: 'Contest deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete contest.' });
  }
});

// ================= CURATED TRACKS ENDPOINTS =================

// 16. Curated Tracks - Get All Tracks with Department Stats
app.get('/api/tracks', (req, res) => {
  try {
    const tracks = db.getTracks();
    const students = getAllEnrichedStudents();
    const totalStudents = Math.max(1, students.length);

    // Compute progress across tracks
    const tracksWithStats = tracks.map(t => {
      const fullTrack = db.getTrackById(t.id);
      const problems = fullTrack?.problems || [];
      
      let totalSolvedCount = 0;
      problems.forEach(p => {
        let solvedThisProblem = 0;
        for (const s of students) {
          const subs = db.getSubmissions(s.id);
          if (subs.some(sub => 
            (sub.titleSlug && sub.titleSlug.toLowerCase() === p.titleSlug.toLowerCase()) ||
            (sub.title && sub.title.toLowerCase().trim() === p.title.toLowerCase().trim())
          )) {
            solvedThisProblem++;
          }
        }
        totalSolvedCount += solvedThisProblem;
      });

      const maxPossibleSolves = problems.length * totalStudents;
      const deptRate = maxPossibleSolves > 0 ? Math.round((totalSolvedCount / maxPossibleSolves) * 100) : 0;

      return {
        ...t,
        totalProblems: problems.length,
        departmentCompletionRate: deptRate,
      };
    });

    res.json(tracksWithStats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch curated tracks.' });
  }
});

// 17. Curated Tracks - Get Specific Track with Problem List & Per-Problem Solver Stats
app.get('/api/tracks/:id', (req, res) => {
  try {
    const track = db.getTrackById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const { studentId } = req.query;
    const students = getAllEnrichedStudents();
    const selectedStudentSubs = studentId ? db.getSubmissions(String(studentId)) : [];

    const enrichedProblems = track.problems.map(p => {
      let solvedCount = 0;
      for (const s of students) {
        const subs = db.getSubmissions(s.id);
        if (subs.some(sub => 
          (sub.titleSlug && sub.titleSlug.toLowerCase() === p.titleSlug.toLowerCase()) ||
          (sub.title && sub.title.toLowerCase().trim() === p.title.toLowerCase().trim())
        )) {
          solvedCount++;
        }
      }

      const isSolvedBySelectedStudent = selectedStudentSubs.some(sub => 
        (sub.titleSlug && sub.titleSlug.toLowerCase() === p.titleSlug.toLowerCase()) ||
        (sub.title && sub.title.toLowerCase().trim() === p.title.toLowerCase().trim())
      );

      return {
        ...p,
        solvedCount,
        isSolvedBySelectedStudent,
      };
    });

    res.json({
      ...track,
      problems: enrichedProblems,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch track details.' });
  }
});

// 17.1 Create Track
app.post('/api/tracks', requireStaff, (req, res) => {
  try {
    const { title, description, category, icon } = req.body;
    if (!title) return res.status(400).json({ error: 'Track title is required.' });
    const newTrack = db.addTrack({ title, description: description || '', category: category || 'custom', icon: icon || 'Code', totalProblems: 0 });
    res.json({ success: true, track: newTrack });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create track.' });
  }
});

// 17.2 Delete Track
app.delete('/api/tracks/:id', requireStaff, (req, res) => {
  try {
    const ok = db.deleteTrack(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete track.' });
  }
});

// 17.3 Add Problem to Track
app.post('/api/tracks/:id/problems', requireStaff, (req, res) => {
  try {
    const { title, titleSlug, difficulty, topic, leetcodeUrl, orderIndex } = req.body;
    if (!title) return res.status(400).json({ error: 'Problem title is required.' });
    const slug = titleSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const prob = db.addProblemToTrack({
      trackId: req.params.id,
      title: title.trim(),
      titleSlug: slug,
      difficulty: difficulty || 'Medium',
      topic: topic || 'General',
      orderIndex: Number(orderIndex) || 0,
      leetcodeUrl: leetcodeUrl || `https://leetcode.com/problems/${slug}/`,
    });
    res.json({ success: true, problem: prob });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add problem to track.' });
  }
});

// 17.4 Delete Problem from Track
app.delete('/api/tracks/problems/:problemId', requireStaff, (req, res) => {
  try {
    const ok = db.deleteProblemFromTrack(req.params.problemId);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete problem.' });
  }
});

// ================= SCHEDULER CONTROLS =================

// 18. Scheduler - Get Status
app.get('/api/scheduler/status', (req, res) => {
  const settings = db.getSettings();
  res.json({
    isEnabled: Boolean(settings.auto_sync_enabled),
    intervalHours: settings.auto_sync_interval_hours || 12,
    lastRunAt: schedulerState.lastRunAt,
    nextRunAt: schedulerState.nextRunAt,
    isRunning: batchProgress.is_running,
  });
});

// 19. Scheduler - Update Config
app.post('/api/scheduler/config', requireStaff, (req, res) => {
  try {
    const { enabled, intervalHours } = req.body;
    const updated = db.updateSettings({
      auto_sync_enabled: Boolean(enabled),
      auto_sync_interval_hours: Number(intervalHours) || 12,
    });

    if (updated.auto_sync_enabled) {
      schedulerState.nextRunAt = calculateNextRunTime(updated.auto_sync_interval_hours || 12);
      db.addLog('INFO', `Scheduled auto-sync configured: Every ${updated.auto_sync_interval_hours} hours. Next sync: ${schedulerState.nextRunAt}`);
    } else {
      schedulerState.nextRunAt = null;
      db.addLog('INFO', 'Scheduled background auto-sync disabled.');
    }

    res.json({
      success: true,
      scheduler: {
        isEnabled: updated.auto_sync_enabled,
        intervalHours: updated.auto_sync_interval_hours,
        lastRunAt: schedulerState.lastRunAt,
        nextRunAt: schedulerState.nextRunAt,
        isRunning: batchProgress.is_running,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update scheduler configuration.' });
  }
});

// 14. Leaderboard with configurable ranking
app.get('/api/leaderboard', (req, res) => {
  try {
    let students = getAllEnrichedStudents();
    const { sort_by = 'engagement_score', section, year, batch } = req.query;

    if (section && typeof section === 'string' && section !== 'ALL') {
      students = students.filter(s => s.section === section);
    }
    if (year && typeof year === 'string' && year !== 'ALL') {
      students = students.filter(s => s.year === year);
    }
    if (batch && typeof batch === 'string' && batch !== 'ALL') {
      students = students.filter(s => s.batch === batch);
    }

    students.sort((a, b) => {
      const snapA = a.latest_snapshot;
      const snapB = b.latest_snapshot;

      if (sort_by === 'total_solved') {
        return (snapB?.total_solved || 0) - (snapA?.total_solved || 0);
      }
      if (sort_by === 'medium') {
        return (snapB?.medium || 0) - (snapA?.medium || 0);
      }
      if (sort_by === 'hard') {
        return (snapB?.hard || 0) - (snapA?.hard || 0);
      }
      if (sort_by === 'contest_rating') {
        return (snapB?.contest_rating || 0) - (snapA?.contest_rating || 0);
      }
      if (sort_by === 'improvement') {
        return (b.problems_added_month || 0) - (a.problems_added_month || 0);
      }
      if (sort_by === 'streak') {
        return (snapB?.streak || 0) - (snapA?.streak || 0);
      }
      // default: engagement_score
      return (snapB?.engagement_score || 0) - (snapA?.engagement_score || 0);
    });

    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate leaderboard.' });
  }
});

// 15. Sections & Batch Comparisons
app.get('/api/sections', (req, res) => {
  try {
    const students = getAllEnrichedStudents();
    const settings = db.getSettings();
    const sectionStats = computeSectionStats(students, settings);
    const batchStats = computeBatchStats(students, settings);
    res.json({ sectionStats, batchStats });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute section statistics.' });
  }
});

// 16. Inactive Student Detection & Intervention Queue
app.get('/api/intervention', (req, res) => {
  try {
    const students = getAllEnrichedStudents();
    const settings = db.getSettings();
    const threshold = settings.inactivity_threshold_days;

    const inactiveStudents = students
      .filter(s => (s.days_inactive ?? 999) > threshold)
      .sort((a, b) => (b.days_inactive || 0) - (a.days_inactive || 0));

    res.json({
      threshold_days: threshold,
      count: inactiveStudents.length,
      students: inactiveStudents,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve intervention list.' });
  }
});

// 17. Reports - Excel 9-Sheet Export
app.get('/api/reports/excel', (req, res) => {
  try {
    const students = getAllEnrichedStudents();
    const allSnaps = db.getSnapshots();
    const settings = db.getSettings();
    const summary = computeDashboardSummary(students, settings);
    const sectionStats = computeSectionStats(students, settings);
    const logs = db.getLogs();

    const buffer = generateExcelReport(students, allSnaps, summary, sectionStats, settings, logs);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="CSBS_LeetCode_Report_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate Excel report.' });
  }
});

// 18. Reports - CSV Export
app.get('/api/reports/csv', (req, res) => {
  try {
    let students = getAllEnrichedStudents();
    const { section, year } = req.query;
    if (section && section !== 'ALL') {
      students = students.filter(s => s.section === section);
    }
    if (year && year !== 'ALL') {
      students = students.filter(s => s.year === year);
    }

    const csv = generateStudentsCSV(students);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="CSBS_Students_Data_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate CSV export.' });
  }
});

// 19. Settings - Get & Update
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', requireStaff, (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    db.addLog('INFO', 'Updated department tracker configuration & weight parameters.');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update settings.' });
  }
});

// 20. Reset to Demo Data
app.post('/api/settings/reset-demo', requireStaff, (req, res) => {
  try {
    db.resetToDemo();
    db.addLog('INFO', 'Reset system database to default KGiSL CSBS student dataset.');
    res.json({ success: true, message: 'Database reset to demo dataset successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset demo dataset.' });
  }
});

// 21. Clear Historical Snapshots
app.post('/api/settings/clear-history', requireStaff, (req, res) => {
  try {
    const { studentId } = req.body || {};
    db.deleteSnapshots(studentId);
    db.addLog('WARN', studentId ? `Cleared history for student ${studentId}` : 'Cleared all historical snapshots.');
    res.json({ success: true, message: 'Snapshots cleared successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear snapshots.' });
  }
});

// 22. Client LocalStorage Cache Re-seeding (Vercel Serverless Persistence Fallback)
app.post('/api/cache/sync', (req, res) => {
  try {
    const { students } = req.body || {};
    if (Array.isArray(students) && students.length > 0) {
      const currentStudents = db.getStudents();
      if (currentStudents.length < students.length) {
        const existingRegs = new Set(currentStudents.map(s => s.register_no.toLowerCase()));
        students.forEach((s: any) => {
          if (s.register_no && !existingRegs.has(s.register_no.toLowerCase())) {
            const added = db.addStudent({
              register_no: s.register_no,
              student_name: s.student_name,
              section: s.section || 'A',
              year: s.year || 'II',
              batch: s.batch || '2024-2028',
              username: s.username,
              email: s.email,
              mentor: s.mentor,
              academic_year: s.academic_year || '2024-2025',
              notes: s.notes,
              active: true,
            });

            if (s.latestSnapshot && s.latestSnapshot.total_solved !== undefined) {
              db.addSnapshot({
                student_id: added.id,
                captured_at: s.latestSnapshot.captured_at || new Date().toISOString(),
                total_solved: s.latestSnapshot.total_solved || 0,
                easy: s.latestSnapshot.easy || 0,
                medium: s.latestSnapshot.medium || 0,
                hard: s.latestSnapshot.hard || 0,
                acceptance_rate: s.latestSnapshot.acceptance_rate || 0,
                ranking: s.latestSnapshot.ranking || 0,
                reputation: s.latestSnapshot.reputation || 0,
                contest_rating: s.latestSnapshot.contest_rating || 0,
                contest_rank: s.latestSnapshot.contest_rank || 0,
                contests_attended: s.latestSnapshot.contests_attended || 0,
                top_percentage: s.latestSnapshot.top_percentage || 0,
                streak: s.latestSnapshot.streak || 0,
                active_days: s.latestSnapshot.active_days || 0,
                last_active: s.latestSnapshot.last_active,
                languages: s.latestSnapshot.languages || [],
                skills: s.latestSnapshot.skills || [],
                badges: s.latestSnapshot.badges || [],
                submission_calendar: s.latestSnapshot.submission_calendar || {},
                engagement_score: s.latestSnapshot.engagement_score || 0,
                performance_tier: s.latestSnapshot.performance_tier || 'Beginner',
                activity_status: s.latestSnapshot.activity_status || 'No Data',
                status: 'SUCCESS',
              });
            }
          }
        });
        db.addLog('INFO', `[Vercel Sync] Re-seeded ${students.length} student profiles from client cache.`);
      }
    }
    res.json({ success: true, count: db.getStudents().length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Cache sync failed' });
  }
});

// ================= Vite / Static Serving =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CSBS LeetCode Tracker server running at:`);
    console.log(`  > Local:   http://localhost:${PORT}`);
    console.log(`  > Network: http://127.0.0.1:${PORT}`);
  });
}

if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  startServer();
}

export { app };
