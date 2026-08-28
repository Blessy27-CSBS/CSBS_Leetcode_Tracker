import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
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
import { BatchFetchProgress, StudentWithLatest } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// State for asynchronous batch fetching
let batchProgress: BatchFetchProgress = {
  is_running: false,
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  logs: [],
};

// Helper to get enriched student records
function getAllEnrichedStudents(): StudentWithLatest[] {
  const students = db.getStudents();
  const snapshots = db.getSnapshots();
  const settings = db.getSettings();
  return students.map(s => enrichStudentWithSnapshots(s, snapshots, settings));
}

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
app.post('/api/students', (req, res) => {
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

    res.status(201).json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create student.' });
  }
});

// 6. Student - Update
app.put('/api/students/:id', (req, res) => {
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
app.delete('/api/students/:id', (req, res) => {
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
app.post('/api/students/import', (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No student data rows provided.' });
    }

    const inserted: any[] = [];
    const errors: { row: number; identifier: string; error: string }[] = [];
    const existingUsers = new Set(db.getStudents().map(s => s.username.toLowerCase()));
    const existingRegs = new Set(db.getStudents().map(s => s.register_no.toLowerCase()));

    rows.forEach((r, idx) => {
      const regNo = (r.register_no || r['Register Number'] || r['Register No'] || r.reg_no || '').toString().trim().toUpperCase();
      const name = (r.student_name || r['Student Name'] || r.name || '').toString().trim();
      const section = (r.section || r['Section'] || 'A').toString().trim().toUpperCase();
      const year = (r.year || r['Year'] || 'II').toString().trim();
      const batch = (r.batch || r['Batch'] || '2023-2027').toString().trim();
      const username = (r.username || r['LeetCode Username'] || r['Username'] || '').toString().trim();
      const email = (r.email || r['Email'] || '').toString().trim();
      const mentor = (r.mentor || r['Mentor'] || '').toString().trim();

      if (!regNo || !name || !username) {
        errors.push({ row: idx + 1, identifier: regNo || name || `Row ${idx + 1}`, error: 'Missing mandatory field (Register No, Name, or Username).' });
        return;
      }

      if (existingUsers.has(username.toLowerCase())) {
        errors.push({ row: idx + 1, identifier: username, error: `Duplicate username '${username}' already exists in database.` });
        return;
      }

      if (existingRegs.has(regNo.toLowerCase())) {
        errors.push({ row: idx + 1, identifier: regNo, error: `Duplicate Register No '${regNo}' already exists in database.` });
        return;
      }

      const newStudent = db.addStudent({
        register_no: regNo,
        student_name: name,
        section,
        year,
        batch,
        username,
        email: email || undefined,
        mentor: mentor || undefined,
        academic_year: db.getSettings().academic_year,
        active: true,
      });

      existingUsers.add(username.toLowerCase());
      existingRegs.add(regNo.toLowerCase());
      inserted.push(newStudent);
    });

    db.addLog('INFO', `Imported ${inserted.length} students. Encountered ${errors.length} validation errors.`);

    res.json({
      success: true,
      insertedCount: inserted.length,
      errorsCount: errors.length,
      errors,
      inserted,
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
          language: s.lang || 'Unknown',
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
app.post('/api/fetch/all', async (req, res) => {
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
        message: `Started batch synchronization for ${studentsToFetch.length} students with ${settings.fetch_delay_ms}ms delay.`,
        type: 'info',
      }
    ],
  };

  // Immediate response to acknowledge task start
  res.json({
    message: 'Batch synchronization started in background.',
    total: studentsToFetch.length,
  });

  // Execute asynchronously
  (async () => {
    for (const student of studentsToFetch) {
      if (!batchProgress.is_running) break; // Allow cancel

      batchProgress.current_student = `${student.student_name} (${student.username})`;
      try {
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
              language: s.lang || 'Unknown',
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
      }

      batchProgress.processed++;
      // Delay between requests to avoid rate limits
      await new Promise(r => setTimeout(r, settings.fetch_delay_ms));
    }

    batchProgress.is_running = false;
    batchProgress.completed_at = new Date().toISOString();
    batchProgress.current_student = undefined;
    batchProgress.logs.push({
      timestamp: new Date().toISOString(),
      message: `Batch sync completed: ${batchProgress.successful} successful, ${batchProgress.failed} errors.`,
      type: 'info',
    });
    db.addLog('INFO', `Batch sync completed. ${batchProgress.successful}/${batchProgress.total} profiles updated.`);
  })();
});

// 12. Batch Fetch Progress
app.get('/api/fetch/progress', (req, res) => {
  res.json(batchProgress);
});

// 13. Cancel Batch Fetch
app.post('/api/fetch/cancel', (req, res) => {
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

app.put('/api/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    db.addLog('INFO', 'Updated department tracker configuration & weight parameters.');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update settings.' });
  }
});

// 20. Reset to Demo Data
app.post('/api/settings/reset-demo', (req, res) => {
  try {
    db.resetToDemo();
    db.addLog('INFO', 'Reset system database to default KGiSL CSBS student dataset.');
    res.json({ success: true, message: 'Database reset to demo dataset successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset demo dataset.' });
  }
});

// 21. Clear Historical Snapshots
app.post('/api/settings/clear-history', (req, res) => {
  try {
    const { studentId } = req.body || {};
    db.deleteSnapshots(studentId);
    db.addLog('WARN', studentId ? `Cleared history for student ${studentId}` : 'Cleared all historical snapshots.');
    res.json({ success: true, message: 'Snapshots cleared successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear snapshots.' });
  }
});

// ================= Vite / Static Serving =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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

startServer();
