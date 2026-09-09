import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { 
  Student, 
  Snapshot, 
  RecentSubmission, 
  SystemSettings,
  POTDItem,
  CuratedTrack,
  CuratedProblem,
  ContestItem,
  AuthUser,
  UserRole
} from '../src/types.js';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'csbs_tracker.db');
const JSON_BACKUP_FILE = path.join(process.cwd(), 'data', 'tracker_database.json');

export interface DBUser {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  student_id?: string;
  name: string;
  email?: string;
  created_at: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  inactivity_threshold_days: 14,
  academic_year: '2024-2025',
  fetch_delay_ms: 1500,
  api_timeout_seconds: 25,
  tier_beginner_max: 49,
  tier_developing_max: 99,
  tier_proficient_max: 199,
  auto_sync_enabled: false,
  auto_sync_interval_hours: 12,
  weights: {
    total_solved: 25,
    medium_solved: 20,
    hard_solved: 15,
    recent_activity: 15,
    streak: 10,
    contest_participation: 10,
    improvement_rate: 5,
  },
};

interface MemoryStore {
  students: Student[];
  snapshots: Snapshot[];
  recent_submissions: RecentSubmission[];
  settings: SystemSettings;
  logs: { timestamp: string; level: string; message: string }[];
  potd_items: POTDItem[];
  curated_tracks: CuratedTrack[];
  curated_problems: CuratedProblem[];
  contests: ContestItem[];
  users: DBUser[];
}

export class DatabaseService {
  private sqliteDb: any = null;
  private memStore: MemoryStore = {
    students: [],
    snapshots: [],
    recent_submissions: [],
    settings: DEFAULT_SETTINGS,
    logs: [],
    potd_items: [],
    curated_tracks: [],
    curated_problems: [],
    contests: [],
    users: []
  };

  private isFallbackMode = false;

  constructor() {
    this.loadMemoryStore();
    this.ensureDataDir();
    this.initDatabase();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      // Ignore if read-only filesystem
    }
  }

  private initDatabase() {
    try {
      // Initialize better-sqlite3 with WAL mode
      this.sqliteDb = new Database(DB_FILE);
      this.sqliteDb.pragma('journal_mode = WAL');
      this.sqliteDb.pragma('foreign_keys = ON');

      this.sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          register_no TEXT UNIQUE NOT NULL,
          student_name TEXT NOT NULL,
          section TEXT NOT NULL DEFAULT 'A',
          year TEXT NOT NULL DEFAULT 'II',
          batch TEXT NOT NULL DEFAULT '2023-2027',
          username TEXT UNIQUE NOT NULL,
          email TEXT,
          mentor TEXT,
          academic_year TEXT NOT NULL DEFAULT '2024-2025',
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          notes TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_students_regno ON students(register_no);
        CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);

        CREATE TABLE IF NOT EXISTS snapshots (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          captured_at TEXT NOT NULL,
          total_solved INTEGER NOT NULL DEFAULT 0,
          easy INTEGER NOT NULL DEFAULT 0,
          medium INTEGER NOT NULL DEFAULT 0,
          hard INTEGER NOT NULL DEFAULT 0,
          acceptance_rate REAL NOT NULL DEFAULT 0,
          ranking INTEGER NOT NULL DEFAULT 0,
          reputation INTEGER NOT NULL DEFAULT 0,
          contest_rating INTEGER NOT NULL DEFAULT 0,
          contest_rank INTEGER NOT NULL DEFAULT 0,
          contests_attended INTEGER NOT NULL DEFAULT 0,
          top_percentage REAL NOT NULL DEFAULT 0,
          streak INTEGER NOT NULL DEFAULT 0,
          active_days INTEGER NOT NULL DEFAULT 0,
          last_active TEXT,
          languages TEXT,
          skills TEXT,
          badges TEXT,
          submission_calendar TEXT,
          engagement_score INTEGER NOT NULL DEFAULT 0,
          performance_tier TEXT NOT NULL DEFAULT 'Beginner',
          activity_status TEXT NOT NULL DEFAULT 'No Data',
          status TEXT NOT NULL DEFAULT 'SUCCESS',
          error TEXT,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_snapshots_student_id ON snapshots(student_id);

        CREATE TABLE IF NOT EXISTS recent_submissions (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          title TEXT NOT NULL,
          titleSlug TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          language TEXT NOT NULL,
          statusDisplay TEXT NOT NULL,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          inactivity_threshold_days INTEGER NOT NULL DEFAULT 14,
          academic_year TEXT NOT NULL DEFAULT '2024-2025',
          fetch_delay_ms INTEGER NOT NULL DEFAULT 1500,
          api_timeout_seconds INTEGER NOT NULL DEFAULT 25,
          tier_beginner_max INTEGER NOT NULL DEFAULT 49,
          tier_developing_max INTEGER NOT NULL DEFAULT 99,
          tier_proficient_max INTEGER NOT NULL DEFAULT 199,
          auto_sync_enabled INTEGER NOT NULL DEFAULT 0,
          auto_sync_interval_hours INTEGER NOT NULL DEFAULT 12,
          weights TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS potd_items (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          titleSlug TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          topic TEXT NOT NULL,
          acceptanceRate REAL,
          leetcodeUrl TEXT NOT NULL,
          hint TEXT,
          orderIndex INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_potd_date ON potd_items(date);

        CREATE TABLE IF NOT EXISTS curated_tracks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          icon TEXT,
          totalProblems INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS curated_problems (
          id TEXT PRIMARY KEY,
          trackId TEXT NOT NULL,
          title TEXT NOT NULL,
          titleSlug TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          topic TEXT NOT NULL,
          orderIndex INTEGER NOT NULL,
          leetcodeUrl TEXT NOT NULL,
          FOREIGN KEY (trackId) REFERENCES curated_tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS contests (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          titleSlug TEXT NOT NULL,
          type TEXT NOT NULL,
          contestUrl TEXT NOT NULL,
          startTime TEXT NOT NULL,
          durationMinutes INTEGER NOT NULL DEFAULT 90,
          description TEXT,
          problems TEXT,
          status TEXT NOT NULL DEFAULT 'UPCOMING',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          level TEXT NOT NULL,
          message TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          student_id TEXT,
          name TEXT NOT NULL,
          email TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
      `);

      // Migrations for existing settings table
      try {
        this.sqliteDb.exec('ALTER TABLE settings ADD COLUMN auto_sync_enabled INTEGER NOT NULL DEFAULT 0;');
      } catch (e) {}
      try {
        this.sqliteDb.exec('ALTER TABLE settings ADD COLUMN auto_sync_interval_hours INTEGER NOT NULL DEFAULT 12;');
      } catch (e) {}
      try {
        this.sqliteDb.exec('ALTER TABLE potd_items ADD COLUMN orderIndex INTEGER NOT NULL DEFAULT 0;');
      } catch (e) {}
      try {
        this.sqliteDb.exec('ALTER TABLE potd_items ADD COLUMN created_at TEXT;');
      } catch (e) {}

      // Purge any legacy predefined seed tracks so only faculty-created tracks appear
      try {
        this.sqliteDb.exec(`
          DELETE FROM curated_tracks WHERE id IN ('blind75', 'top150', 'csbs_core') OR category IN ('blind75', 'top150', 'csbs_core');
          DELETE FROM curated_problems WHERE trackId IN ('blind75', 'top150', 'csbs_core');
        `);
      } catch (e) {}

      const settingsRow = this.sqliteDb.prepare('SELECT id FROM settings WHERE id = 1').get();
      if (!settingsRow) {
        this.sqliteDb.prepare(`
          INSERT INTO settings (
            id, inactivity_threshold_days, academic_year, fetch_delay_ms, api_timeout_seconds,
            tier_beginner_max, tier_developing_max, tier_proficient_max, auto_sync_enabled, auto_sync_interval_hours, weights
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          DEFAULT_SETTINGS.inactivity_threshold_days,
          DEFAULT_SETTINGS.academic_year,
          DEFAULT_SETTINGS.fetch_delay_ms,
          DEFAULT_SETTINGS.api_timeout_seconds,
          DEFAULT_SETTINGS.tier_beginner_max,
          DEFAULT_SETTINGS.tier_developing_max,
          DEFAULT_SETTINGS.tier_proficient_max,
          DEFAULT_SETTINGS.auto_sync_enabled ? 1 : 0,
          DEFAULT_SETTINGS.auto_sync_interval_hours || 12,
          JSON.stringify(DEFAULT_SETTINGS.weights)
        );
      }

      this.migrateFromLegacyJSON();

      // Seed initial staff and student auth users
      this.seedInitialUsers();
    } catch (err) {
      console.warn('SQLite native initialization failed or unavailable, running in JSON fallback mode:', err);
      this.isFallbackMode = true;
      this.loadMemoryStore();
      this.seedInitialUsers();
    }

    if (isSupabaseConfigured) {
      this.loadFromSupabase().catch(e => console.error('[Supabase] Initial load error:', e));
    }
  }

  private loadMemoryStore() {
    if (fs.existsSync(JSON_BACKUP_FILE)) {
      try {
        const raw = fs.readFileSync(JSON_BACKUP_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memStore = {
          students: parsed.students || [],
          snapshots: parsed.snapshots || [],
          recent_submissions: parsed.recent_submissions || [],
          settings: parsed.settings || DEFAULT_SETTINGS,
          logs: parsed.logs || [],
          potd_items: parsed.potd_items || [],
          curated_tracks: (parsed.curated_tracks || []).filter((t: any) => t.category !== 'blind75' && t.category !== 'top150' && t.category !== 'csbs_core' && t.id !== 'blind75' && t.id !== 'top150' && t.id !== 'csbs_core'),
          curated_problems: (parsed.curated_problems || []).filter((p: any) => p.trackId !== 'blind75' && p.trackId !== 'top150' && p.trackId !== 'csbs_core'),
          contests: parsed.contests || [],
          users: parsed.users || []
        };
      } catch (e) {
        console.error('Failed to load JSON backup file:', e);
      }
    }
  }

  public async loadFromSupabase() {
    if (this.memStore.students.length === 0) {
      this.getStudents();
    }
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // 1. Students
      const { data: studentsData, error: studentErr } = await supabase.from('students').select('*').order('student_name', { ascending: true });
      if (!studentErr && studentsData && studentsData.length > 0) {
        this.memStore.students = studentsData.map((s: any) => ({
          id: s.id,
          register_no: s.register_no,
          student_name: s.student_name,
          section: s.section,
          year: s.year,
          batch: s.batch,
          username: s.username,
          email: s.email || undefined,
          mentor: s.mentor || undefined,
          academic_year: s.academic_year,
          active: Boolean(s.active),
          created_at: s.created_at,
          notes: s.notes || undefined,
        }));
        console.log(`[Supabase] Loaded ${studentsData.length} students from cloud database.`);
      } else {
        // Fallback: Populate memory store from local database if Supabase query is empty or errored
        const localStudents = this.getStudents();
        console.log(`[Database] Using ${localStudents.length} local students dataset.`);
        if (!studentErr && localStudents.length > 0) {
          console.log(`[Supabase] Initial cloud database empty. Seeding ${localStudents.length} students to Supabase Cloud...`);
          this.syncAllToSupabase().catch(e => console.error('[Supabase] Initial seed error:', e));
        }
      }

      // 2. Snapshots
      const { data: snapData } = await supabase.from('snapshots').select('*').order('captured_at', { ascending: true });
      if (snapData && snapData.length > 0) {
        this.memStore.snapshots = snapData.map((r: any) => ({
          id: r.id,
          student_id: r.student_id,
          captured_at: r.captured_at,
          total_solved: r.total_solved || 0,
          easy: r.easy || 0,
          medium: r.medium || 0,
          hard: r.hard || 0,
          acceptance_rate: Number(r.acceptance_rate) || 0,
          ranking: r.ranking || 0,
          reputation: r.reputation || 0,
          contest_rating: r.contest_rating || 0,
          contest_rank: r.contest_rank || 0,
          contests_attended: r.contests_attended || 0,
          top_percentage: Number(r.top_percentage) || 0,
          streak: r.streak || 0,
          active_days: r.active_days || 0,
          last_active: r.last_active || undefined,
          languages: typeof r.languages === 'string' ? JSON.parse(r.languages) : (r.languages || []),
          skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : (r.skills || []),
          badges: typeof r.badges === 'string' ? JSON.parse(r.badges) : (r.badges || []),
          submission_calendar: typeof r.submission_calendar === 'string' ? JSON.parse(r.submission_calendar) : (r.submission_calendar || {}),
          engagement_score: r.engagement_score || 0,
          performance_tier: r.performance_tier || 'Beginner',
          activity_status: r.activity_status || 'No Data',
          status: r.status || 'SUCCESS',
          error: r.error || undefined,
        }));
        console.log(`[Supabase] Loaded ${snapData.length} snapshots from cloud database.`);
      }

      // 3. Recent Submissions
      const { data: subData } = await supabase.from('recent_submissions').select('*');
      if (subData && subData.length > 0) {
        this.memStore.recent_submissions = subData.map((s: any) => ({
          id: s.id,
          student_id: s.student_id,
          title: s.title,
          titleSlug: s.titleSlug,
          timestamp: s.timestamp,
          language: s.language,
          statusDisplay: s.statusDisplay,
        }));
        console.log(`[Supabase] Loaded ${subData.length} recent submissions from cloud database.`);
      }

      // 4. Settings
      const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
      if (settingsData) {
        this.memStore.settings = {
          inactivity_threshold_days: settingsData.inactivity_threshold_days ?? 14,
          academic_year: settingsData.academic_year || '2024-2025',
          fetch_delay_ms: settingsData.fetch_delay_ms ?? 1500,
          api_timeout_seconds: settingsData.api_timeout_seconds ?? 25,
          tier_beginner_max: settingsData.tier_beginner_max ?? 49,
          tier_developing_max: settingsData.tier_developing_max ?? 99,
          tier_proficient_max: settingsData.tier_proficient_max ?? 199,
          auto_sync_enabled: Boolean(settingsData.auto_sync_enabled),
          auto_sync_interval_hours: settingsData.auto_sync_interval_hours ?? 12,
          weights: typeof settingsData.weights === 'string' ? JSON.parse(settingsData.weights) : (settingsData.weights || DEFAULT_SETTINGS.weights),
        };
      }

      // 5. POTD Items
      const { data: potdData } = await supabase.from('potd_items').select('*').order('date', { ascending: false });
      if (potdData && potdData.length > 0) {
        this.memStore.potd_items = potdData.map((p: any) => ({
          id: p.id,
          date: p.date,
          title: p.title,
          titleSlug: p.titleSlug,
          difficulty: p.difficulty,
          topic: p.topic,
          acceptanceRate: p.acceptanceRate ? Number(p.acceptanceRate) : undefined,
          leetcodeUrl: p.leetcodeUrl,
          hint: p.hint || undefined,
          orderIndex: p.orderIndex || 0,
          created_at: p.created_at,
        }));
      }

      // 6. Curated Tracks
      const { data: tracksData } = await supabase.from('curated_tracks').select('*');
      if (tracksData && tracksData.length > 0) {
        this.memStore.curated_tracks = tracksData.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          icon: t.icon || undefined,
          totalProblems: t.totalProblems || 0,
        }));
      }

      // 7. Curated Problems
      const { data: probsData } = await supabase.from('curated_problems').select('*').order('orderIndex', { ascending: true });
      if (probsData && probsData.length > 0) {
        this.memStore.curated_problems = probsData.map((p: any) => ({
          id: p.id,
          trackId: p.trackId,
          title: p.title,
          titleSlug: p.titleSlug,
          difficulty: p.difficulty,
          topic: p.topic,
          orderIndex: p.orderIndex,
          leetcodeUrl: p.leetcodeUrl,
        }));
      }

      // 8. Contests
      const { data: contestData } = await supabase.from('contests').select('*').order('startTime', { ascending: true });
      if (contestData && contestData.length > 0) {
        this.memStore.contests = contestData.map((c: any) => ({
          id: c.id,
          title: c.title,
          titleSlug: c.titleSlug,
          type: c.type,
          contestUrl: c.contestUrl,
          startTime: c.startTime,
          durationMinutes: c.durationMinutes || 90,
          description: c.description || undefined,
          problems: typeof c.problems === 'string' ? (c.problems.startsWith('[') ? JSON.parse(c.problems) : []) : (c.problems || []),
          status: c.status || 'UPCOMING',
          created_at: c.created_at,
        }));
        if (this.sqliteDb) {
          try {
            const ins = this.sqliteDb.prepare(`
              INSERT OR REPLACE INTO contests (id, title, titleSlug, type, contestUrl, startTime, durationMinutes, description, problems, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const c of this.memStore.contests) {
              ins.run(
                c.id, c.title, c.titleSlug, c.type, c.contestUrl, c.startTime,
                c.durationMinutes, c.description || '', JSON.stringify(c.problems || []),
                c.status, c.created_at || new Date().toISOString()
              );
            }
          } catch (e) {
            console.error('Error syncing contests to SQLite:', e);
          }
        }
      }

      // 9. Users
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData && usersData.length > 0) {
        this.memStore.users = usersData.map((u: any) => ({
          id: u.id,
          username: u.username,
          password_hash: u.password_hash,
          role: u.role,
          student_id: u.student_id || undefined,
          name: u.name,
          email: u.email || undefined,
          created_at: u.created_at,
        }));
      }

      // Ensure faculty initial seed user exists in memory store if users was empty
      this.seedInitialUsers();

    } catch (err) {
      console.error('[Supabase] Initial load error:', err);
    }
  }

  public async syncAllToSupabase() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const students = this.getStudents();
      if (students.length > 0) {
        const studentPayloads = students.map(s => ({
          id: s.id,
          register_no: s.register_no,
          student_name: s.student_name,
          section: s.section,
          year: s.year,
          batch: s.batch,
          username: s.username,
          email: s.email || null,
          mentor: s.mentor || null,
          academic_year: s.academic_year,
          active: s.active,
          created_at: s.created_at || new Date().toISOString(),
          notes: s.notes || null,
        }));
        const { error: studentErr } = await supabase.from('students').upsert(studentPayloads);
        if (studentErr) {
          console.error('[Supabase] Error syncing students to cloud:', studentErr.message);
        } else {
          console.log(`⚡ [Supabase] Successfully synced ${students.length} students to cloud database.`);
        }
      }

      const snapshots = this.getSnapshots();
      if (snapshots.length > 0) {
        const snapshotPayloads = snapshots.map(s => ({
          id: s.id,
          student_id: s.student_id,
          captured_at: s.captured_at,
          total_solved: s.total_solved || 0,
          easy: s.easy || 0,
          medium: s.medium || 0,
          hard: s.hard || 0,
          acceptance_rate: s.acceptance_rate || 0,
          ranking: s.ranking || 0,
          reputation: s.reputation || 0,
          contest_rating: s.contest_rating || 0,
          contest_rank: s.contest_rank || 0,
          contests_attended: s.contests_attended || 0,
          top_percentage: s.top_percentage || 0,
          streak: s.streak || 0,
          active_days: s.active_days || 0,
          last_active: s.last_active || null,
          languages: s.languages || [],
          skills: s.skills || [],
          badges: s.badges || [],
          submission_calendar: s.submission_calendar || {},
          engagement_score: s.engagement_score || 0,
          performance_tier: s.performance_tier || 'Beginner',
          activity_status: s.activity_status || 'No Data',
          status: s.status || 'SUCCESS',
          error: s.error || null,
        }));
        const { error: snapErr } = await supabase.from('snapshots').upsert(snapshotPayloads);
        if (snapErr) {
          console.error('[Supabase] Error syncing snapshots to cloud:', snapErr.message);
        }
      }
    } catch (e: any) {
      console.error('[Supabase] syncAllToSupabase error:', e.message || e);
    }
  }

  private persistMemoryStore() {
    try {
      if (process.env.VERCEL) {
        const tmpJson = '/tmp/tracker_database.json';
        fs.writeFileSync(tmpJson, JSON.stringify(this.memStore, null, 2), 'utf-8');
      } else if (fs.existsSync(path.dirname(JSON_BACKUP_FILE))) {
        fs.writeFileSync(JSON_BACKUP_FILE, JSON.stringify(this.memStore, null, 2), 'utf-8');
      }
    } catch (e) {
      // ignore
    }
  }

  private migrateFromLegacyJSON() {
    if (this.isFallbackMode || !this.sqliteDb) return;
    const studentCount = (this.sqliteDb.prepare('SELECT COUNT(*) as c FROM students').get() as { c: number }).c;
    if (studentCount === 0 && fs.existsSync(JSON_BACKUP_FILE)) {
      try {
        const raw = fs.readFileSync(JSON_BACKUP_FILE, 'utf-8');
        const legacy = JSON.parse(raw);
        if (legacy && Array.isArray(legacy.students) && legacy.students.length > 0) {
          const insertStudent = this.sqliteDb.prepare(`
            INSERT OR REPLACE INTO students (
              id, register_no, student_name, section, year, batch, username, email, mentor, academic_year, active, created_at, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const insertSnapshot = this.sqliteDb.prepare(`
            INSERT OR REPLACE INTO snapshots (
              id, student_id, captured_at, total_solved, easy, medium, hard, acceptance_rate,
              ranking, reputation, contest_rating, contest_rank, contests_attended, top_percentage,
              streak, active_days, last_active, languages, skills, badges, submission_calendar,
              engagement_score, performance_tier, activity_status, status, error
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const insertSub = this.sqliteDb.prepare(`
            INSERT OR REPLACE INTO recent_submissions (
              id, student_id, title, titleSlug, timestamp, language, statusDisplay
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          const migrateTx = this.sqliteDb.transaction(() => {
            for (const s of legacy.students) {
              insertStudent.run(
                s.id,
                s.register_no,
                s.student_name,
                s.section || 'A',
                s.year || 'II',
                s.batch || '2023-2027',
                s.username,
                s.email || null,
                s.mentor || null,
                s.academic_year || DEFAULT_SETTINGS.academic_year,
                s.active ? 1 : 0,
                s.created_at || new Date().toISOString(),
                s.notes || null
              );
            }

            if (Array.isArray(legacy.snapshots)) {
              for (const snap of legacy.snapshots) {
                insertSnapshot.run(
                  snap.id,
                  snap.student_id,
                  snap.captured_at,
                  snap.total_solved || 0,
                  snap.easy || 0,
                  snap.medium || 0,
                  snap.hard || 0,
                  snap.acceptance_rate || 0,
                  snap.ranking || 0,
                  snap.reputation || 0,
                  snap.contest_rating || 0,
                  snap.contest_rank || 0,
                  snap.contests_attended || 0,
                  snap.top_percentage || 0,
                  snap.streak || 0,
                  snap.active_days || 0,
                  snap.last_active || null,
                  JSON.stringify(snap.languages || []),
                  JSON.stringify(snap.skills || []),
                  JSON.stringify(snap.badges || []),
                  JSON.stringify(snap.submission_calendar || {}),
                  snap.engagement_score || 0,
                  snap.performance_tier || 'Beginner',
                  snap.activity_status || 'No Data',
                  snap.status || 'SUCCESS',
                  snap.error || null
                );
              }
            }

            if (Array.isArray(legacy.recent_submissions)) {
              for (const sub of legacy.recent_submissions) {
                insertSub.run(
                  sub.id,
                  sub.student_id,
                  sub.title,
                  sub.titleSlug,
                  sub.timestamp,
                  sub.language,
                  sub.statusDisplay
                );
              }
            }

            if (Array.isArray(legacy.contests)) {
              const insertContest = this.sqliteDb.prepare(`
                INSERT OR REPLACE INTO contests (
                  id, title, titleSlug, type, contestUrl, startTime, durationMinutes, description, problems, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);
              for (const c of legacy.contests) {
                insertContest.run(
                  c.id,
                  c.title,
                  c.titleSlug,
                  c.type,
                  c.contestUrl,
                  c.startTime,
                  c.durationMinutes || 90,
                  c.description || '',
                  JSON.stringify(c.problems || []),
                  c.status || 'UPCOMING',
                  c.created_at || new Date().toISOString()
                );
              }
            }
          });

          migrateTx();
        }
      } catch (err) {
        console.error('Failed to migrate legacy JSON to SQLite:', err);
      }
    }
  }

  // Students CRUD
  public getStudents(): Student[] {
    if (this.memStore.students.length > 0) {
      return this.memStore.students;
    }
    if (this.sqliteDb) {
      try {
        const rows = this.sqliteDb.prepare('SELECT * FROM students ORDER BY student_name ASC').all() as any[];
        if (rows.length > 0) {
          const loaded = rows.map(r => ({
            id: r.id,
            register_no: r.register_no,
            student_name: r.student_name,
            section: r.section,
            year: r.year,
            batch: r.batch,
            username: r.username,
            email: r.email || undefined,
            mentor: r.mentor || undefined,
            academic_year: r.academic_year,
            active: Boolean(r.active),
            created_at: r.created_at,
            notes: r.notes || undefined,
          }));
          this.memStore.students = loaded;
          return loaded;
        }
      } catch (e) {}
    }
    return this.memStore.students;
  }

  public getStudentById(id: string): Student | undefined {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.students.find(s => s.id === id);
    }
    const r = this.sqliteDb.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
    if (!r) return undefined;
    return {
      id: r.id,
      register_no: r.register_no,
      student_name: r.student_name,
      section: r.section,
      year: r.year,
      batch: r.batch,
      username: r.username,
      email: r.email || undefined,
      mentor: r.mentor || undefined,
      academic_year: r.academic_year,
      active: Boolean(r.active),
      created_at: r.created_at,
      notes: r.notes || undefined,
    };
  }

  public getStudentByUsername(username: string): Student | undefined {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.students.find(s => s.username.toLowerCase() === username.toLowerCase());
    }
    const r = this.sqliteDb.prepare('SELECT * FROM students WHERE LOWER(username) = LOWER(?)').get(username) as any;
    if (!r) return undefined;
    return {
      id: r.id,
      register_no: r.register_no,
      student_name: r.student_name,
      section: r.section,
      year: r.year,
      batch: r.batch,
      username: r.username,
      email: r.email || undefined,
      mentor: r.mentor || undefined,
      academic_year: r.academic_year,
      active: Boolean(r.active),
      created_at: r.created_at,
      notes: r.notes || undefined,
    };
  }

  public getStudentByRegisterNo(regNo: string): Student | undefined {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.students.find(s => s.register_no.toLowerCase() === regNo.toLowerCase());
    }
    const r = this.sqliteDb.prepare('SELECT * FROM students WHERE LOWER(register_no) = LOWER(?)').get(regNo) as any;
    if (!r) return undefined;
    return {
      id: r.id,
      register_no: r.register_no,
      student_name: r.student_name,
      section: r.section,
      year: r.year,
      batch: r.batch,
      username: r.username,
      email: r.email || undefined,
      mentor: r.mentor || undefined,
      academic_year: r.academic_year,
      active: Boolean(r.active),
      created_at: r.created_at,
      notes: r.notes || undefined,
    };
  }

  public addStudent(student: Omit<Student, 'id' | 'created_at'>): Student {
    const id = `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const created_at = new Date().toISOString();
    const active = student.active ?? true;

    const newStudent: Student = {
      ...student,
      id,
      created_at,
      active,
    };

    this.memStore.students = this.memStore.students.filter(s => s.id !== newStudent.id);
    this.memStore.students.push(newStudent);

    if (isSupabaseConfigured && supabase) {
      supabase.from('students').upsert({
        id: newStudent.id,
        register_no: newStudent.register_no,
        student_name: newStudent.student_name,
        section: newStudent.section,
        year: newStudent.year,
        batch: newStudent.batch,
        username: newStudent.username,
        email: newStudent.email || null,
        mentor: newStudent.mentor || null,
        academic_year: newStudent.academic_year,
        active: newStudent.active,
        created_at: newStudent.created_at,
        notes: newStudent.notes || null,
      }).then(({ error }) => {
        if (error) console.error('[Supabase] addStudent sync error:', error.message);
      });
    }

    if (this.isFallbackMode || !this.sqliteDb) {
      this.ensureStudentUser(newStudent);
      this.persistMemoryStore();
      return newStudent;
    }

    try {
      this.sqliteDb.prepare(`
        INSERT OR REPLACE INTO students (
          id, register_no, student_name, section, year, batch, username, email, mentor, academic_year, active, created_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        student.register_no.trim().toUpperCase(),
        student.student_name.trim(),
        (student.section || 'A').trim().toUpperCase(),
        (student.year || 'II').trim(),
        (student.batch || '2023-2027').trim(),
        student.username.trim(),
        student.email ? student.email.trim() : null,
        student.mentor ? student.mentor.trim() : null,
        student.academic_year || DEFAULT_SETTINGS.academic_year,
        active ? 1 : 0,
        created_at,
        student.notes ? student.notes.trim() : null
      );
    } catch (e) {
      console.error('Error inserting student into SQLite:', e);
    }

    this.ensureStudentUser(newStudent);
    this.persistMemoryStore();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    const memIdx = this.memStore.students.findIndex(s => s.id === id);

    if (this.isFallbackMode || !this.sqliteDb) {
      if (memIdx === -1) return null;
      this.memStore.students[memIdx] = { ...this.memStore.students[memIdx], ...updates };
      const s = this.memStore.students[memIdx];
      this.ensureStudentUser(s);
      this.persistMemoryStore();

      if (isSupabaseConfigured && supabase) {
        supabase.from('students').upsert({
          id: s.id,
          register_no: s.register_no,
          student_name: s.student_name,
          section: s.section,
          year: s.year,
          batch: s.batch,
          username: s.username,
          email: s.email || null,
          mentor: s.mentor || null,
          academic_year: s.academic_year,
          active: s.active,
          created_at: s.created_at,
          notes: s.notes || null,
        }).then(({ error }) => {
          if (error) console.error('[Supabase] Student update error:', error);
        });
      }
      return s;
    }

    const existing = this.getStudentById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };

    if (memIdx >= 0) {
      this.memStore.students[memIdx] = merged;
    } else {
      this.memStore.students.push(merged);
    }

    try {
      this.sqliteDb.prepare(`
        UPDATE students SET
          register_no = ?,
          student_name = ?,
          section = ?,
          year = ?,
          batch = ?,
          username = ?,
          email = ?,
          mentor = ?,
          academic_year = ?,
          active = ?,
          notes = ?
        WHERE id = ?
      `).run(
        merged.register_no,
        merged.student_name,
        merged.section,
        merged.year,
        merged.batch,
        merged.username,
        merged.email || null,
        merged.mentor || null,
        merged.academic_year,
        merged.active ? 1 : 0,
        merged.notes || null,
        id
      );
    } catch (e) {
      console.error('Error updating student in SQLite:', e);
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('students').upsert({
        id: merged.id,
        register_no: merged.register_no,
        student_name: merged.student_name,
        section: merged.section,
        year: merged.year,
        batch: merged.batch,
        username: merged.username,
        email: merged.email || null,
        mentor: merged.mentor || null,
        academic_year: merged.academic_year,
        active: merged.active,
        created_at: merged.created_at,
        notes: merged.notes || null,
      }).then(({ error }) => {
        if (error) console.error('[Supabase] Student update error:', error);
      });
    }

    this.ensureStudentUser(merged);
    this.persistMemoryStore();
    return merged;
  }

  public deleteStudent(id: string): boolean {
    if (isSupabaseConfigured && supabase) {
      supabase.from('students').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('[Supabase] Student delete error:', error.message);
      });
    }

    const initLen = this.memStore.students.length;
    this.memStore.students = this.memStore.students.filter(s => s.id !== id);
    this.memStore.snapshots = this.memStore.snapshots.filter(s => s.student_id !== id);
    this.memStore.recent_submissions = this.memStore.recent_submissions.filter(s => s.student_id !== id);
    this.persistMemoryStore();

    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.students.length < initLen;
    }

    try {
      const res = this.sqliteDb.prepare('DELETE FROM students WHERE id = ?').run(id);
      return res.changes > 0;
    } catch (e) {
      return true;
    }
  }

  // Snapshots
  // Snapshots
  public getSnapshots(studentId?: string): Snapshot[] {
    let snaps = this.memStore.snapshots;

    if (snaps.length === 0 && this.sqliteDb) {
      try {
        let rows: any[];
        if (studentId) {
          rows = this.sqliteDb.prepare('SELECT * FROM snapshots WHERE student_id = ? ORDER BY datetime(captured_at) ASC').all(studentId);
        } else {
          rows = this.sqliteDb.prepare('SELECT * FROM snapshots ORDER BY datetime(captured_at) ASC').all();
        }
        snaps = rows.map(r => ({
          id: r.id,
          student_id: r.student_id,
          captured_at: r.captured_at,
          total_solved: r.total_solved || 0,
          easy: r.easy || 0,
          medium: r.medium || 0,
          hard: r.hard || 0,
          acceptance_rate: r.acceptance_rate || 0,
          ranking: r.ranking || 0,
          reputation: r.reputation || 0,
          contest_rating: r.contest_rating || 0,
          contest_rank: r.contest_rank || 0,
          contests_attended: r.contests_attended || 0,
          top_percentage: r.top_percentage || 0,
          streak: r.streak || 0,
          active_days: r.active_days || 0,
          last_active: r.last_active || undefined,
          languages: r.languages ? (typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages) : [],
          skills: r.skills ? (typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills) : [],
          badges: r.badges ? (typeof r.badges === 'string' ? JSON.parse(r.badges) : r.badges) : [],
          submission_calendar: r.submission_calendar ? (typeof r.submission_calendar === 'string' ? JSON.parse(r.submission_calendar) : r.submission_calendar) : {},
          engagement_score: r.engagement_score || 0,
          performance_tier: r.performance_tier || 'Beginner',
          activity_status: r.activity_status || 'No Data',
          status: r.status || 'SUCCESS',
          error: r.error || undefined,
        }));
      } catch (e) {}
    }

    if (studentId) {
      const student = this.getStudentById(studentId);
      const regNo = student?.register_no?.toLowerCase().trim();
      const uname = student?.username?.toLowerCase().trim();

      return snaps
        .filter(s => {
          const sId = (s.student_id || '').toLowerCase().trim();
          return sId === studentId.toLowerCase() || (regNo && sId === regNo) || (uname && sId === uname);
        })
        .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
    }

    return snaps;
  }

  public getLatestSnapshot(studentId: string): Snapshot | undefined {
    const list = this.getSnapshots(studentId);
    return list.length > 0 ? list[list.length - 1] : undefined;
  }

  public getPreviousSnapshot(studentId: string): Snapshot | undefined {
    const list = this.getSnapshots(studentId);
    return list.length > 1 ? list[list.length - 2] : undefined;
  }

  public addSnapshot(snapshot: Omit<Snapshot, 'id'>): Snapshot {
    const id = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSnap: Snapshot = {
      ...snapshot,
      id,
    };

    if (isSupabaseConfigured && supabase) {
      supabase.from('snapshots').insert({
        id: newSnap.id,
        student_id: newSnap.student_id,
        captured_at: newSnap.captured_at,
        total_solved: newSnap.total_solved || 0,
        easy: newSnap.easy || 0,
        medium: newSnap.medium || 0,
        hard: newSnap.hard || 0,
        acceptance_rate: newSnap.acceptance_rate || 0,
        ranking: newSnap.ranking || 0,
        reputation: newSnap.reputation || 0,
        contest_rating: newSnap.contest_rating || 0,
        contest_rank: newSnap.contest_rank || 0,
        contests_attended: newSnap.contests_attended || 0,
        top_percentage: newSnap.top_percentage || 0,
        streak: newSnap.streak || 0,
        active_days: newSnap.active_days || 0,
        last_active: newSnap.last_active || null,
        languages: newSnap.languages || [],
        skills: newSnap.skills || [],
        badges: newSnap.badges || [],
        submission_calendar: newSnap.submission_calendar || {},
        engagement_score: newSnap.engagement_score || 0,
        performance_tier: newSnap.performance_tier || 'Beginner',
        activity_status: newSnap.activity_status || 'No Data',
        status: newSnap.status || 'SUCCESS',
        error: newSnap.error || null,
      }).then(({ error }) => {
        if (error) console.error('[Supabase] addSnapshot sync error:', error.message);
      });
    }

    this.memStore.snapshots = this.memStore.snapshots.filter(s => s.id !== newSnap.id);
    this.memStore.snapshots.push(newSnap);

    if (this.sqliteDb) {
      try {
        const studentInDb = this.sqliteDb.prepare('SELECT id FROM students WHERE id = ?').get(snapshot.student_id);
        if (!studentInDb) {
          const studentObj = this.getStudentById(snapshot.student_id);
          if (studentObj) {
            this.sqliteDb.prepare(`
              INSERT OR REPLACE INTO students (
                id, register_no, student_name, section, year, batch, username, email, mentor, academic_year, active, created_at, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              studentObj.id,
              studentObj.register_no,
              studentObj.student_name,
              studentObj.section || 'A',
              studentObj.year || 'II',
              studentObj.batch || '2023-2027',
              studentObj.username,
              studentObj.email || null,
              studentObj.mentor || null,
              studentObj.academic_year || DEFAULT_SETTINGS.academic_year,
              studentObj.active ? 1 : 0,
              studentObj.created_at || new Date().toISOString(),
              studentObj.notes || null
            );
          }
        }

        this.sqliteDb.prepare(`
          INSERT INTO snapshots (
            id, student_id, captured_at, total_solved, easy, medium, hard, acceptance_rate,
            ranking, reputation, contest_rating, contest_rank, contests_attended, top_percentage,
            streak, active_days, last_active, languages, skills, badges, submission_calendar,
            engagement_score, performance_tier, activity_status, status, error
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          snapshot.student_id,
          snapshot.captured_at,
          snapshot.total_solved || 0,
          snapshot.easy || 0,
          snapshot.medium || 0,
          snapshot.hard || 0,
          snapshot.acceptance_rate || 0,
          snapshot.ranking || 0,
          snapshot.reputation || 0,
          snapshot.contest_rating || 0,
          snapshot.contest_rank || 0,
          snapshot.contests_attended || 0,
          snapshot.top_percentage || 0,
          snapshot.streak || 0,
          snapshot.active_days || 0,
          snapshot.last_active || null,
          JSON.stringify(snapshot.languages || []),
          JSON.stringify(snapshot.skills || []),
          JSON.stringify(snapshot.badges || []),
          JSON.stringify(snapshot.submission_calendar || {}),
          snapshot.engagement_score || 0,
          snapshot.performance_tier || 'Beginner',
          snapshot.activity_status || 'No Data',
          snapshot.status || 'SUCCESS',
          snapshot.error || null
        );
      } catch (e) {}
    }

    return newSnap;
  }

  public deleteSnapshots(studentId?: string): void {
    if (studentId) {
      this.memStore.snapshots = this.memStore.snapshots.filter(s => s.student_id !== studentId);
    } else {
      this.memStore.snapshots = [];
    }
    this.persistMemoryStore();

    if (this.sqliteDb) {
      try {
        if (studentId) {
          this.sqliteDb.prepare('DELETE FROM snapshots WHERE student_id = ?').run(studentId);
        } else {
          this.sqliteDb.prepare('DELETE FROM snapshots').run();
        }
      } catch (e) {}
    }
  }

  // Recent Submissions
  public getSubmissions(studentId: string): RecentSubmission[] {
    let list = this.memStore.recent_submissions;

    if (list.length === 0 && this.sqliteDb) {
      try {
        const rows = this.sqliteDb.prepare('SELECT * FROM recent_submissions WHERE student_id = ? ORDER BY id DESC').all(studentId) as any[];
        list = rows.map(r => ({
          id: r.id,
          student_id: r.student_id,
          title: r.title,
          titleSlug: r.titleSlug,
          timestamp: r.timestamp,
          language: r.language,
          statusDisplay: r.statusDisplay,
        }));
      } catch (e) {}
    }

    const student = this.getStudentById(studentId);
    const regNo = student?.register_no?.toLowerCase().trim();
    const uname = student?.username?.toLowerCase().trim();

    return list.filter(r => {
      const sId = (r.student_id || '').toLowerCase().trim();
      return sId === studentId.toLowerCase() || (regNo && sId === regNo) || (uname && sId === uname);
    });
  }

  public setSubmissions(studentId: string, subs: RecentSubmission[]): void {
    this.memStore.recent_submissions = this.memStore.recent_submissions.filter(r => r.student_id !== studentId);
    this.memStore.recent_submissions.push(...subs);

    if (this.isFallbackMode || !this.sqliteDb) {
      this.persistMemoryStore();
      return;
    }

    const studentInDb = this.sqliteDb.prepare('SELECT id FROM students WHERE id = ?').get(studentId);
    if (!studentInDb) {
      const studentObj = this.getStudentById(studentId);
      if (studentObj) {
        try {
          this.sqliteDb.prepare(`
            INSERT OR REPLACE INTO students (
              id, register_no, student_name, section, year, batch, username, email, mentor, academic_year, active, created_at, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            studentObj.id,
            studentObj.register_no,
            studentObj.student_name,
            studentObj.section || 'A',
            studentObj.year || 'II',
            studentObj.batch || '2023-2027',
            studentObj.username,
            studentObj.email || null,
            studentObj.mentor || null,
            studentObj.academic_year || DEFAULT_SETTINGS.academic_year,
            studentObj.active ? 1 : 0,
            studentObj.created_at || new Date().toISOString(),
            studentObj.notes || null
          );
        } catch (e) {}
      }
    }

    const insertSub = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO recent_submissions (
        id, student_id, title, titleSlug, timestamp, language, statusDisplay
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = this.sqliteDb.transaction(() => {
      this.sqliteDb.prepare('DELETE FROM recent_submissions WHERE student_id = ?').run(studentId);
      for (const sub of subs) {
        insertSub.run(
          sub.id,
          studentId,
          sub.title,
          sub.titleSlug,
          sub.timestamp,
          sub.language,
          sub.statusDisplay
        );
      }
    });

    tx();
  }

  // Settings
  public getSettings(): SystemSettings {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.settings || DEFAULT_SETTINGS;
    }
    const r = this.sqliteDb.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    if (!r) return DEFAULT_SETTINGS;
    return {
      inactivity_threshold_days: r.inactivity_threshold_days,
      academic_year: r.academic_year,
      fetch_delay_ms: r.fetch_delay_ms,
      api_timeout_seconds: r.api_timeout_seconds,
      tier_beginner_max: r.tier_beginner_max,
      tier_developing_max: r.tier_developing_max,
      tier_proficient_max: r.tier_proficient_max,
      auto_sync_enabled: Boolean(r.auto_sync_enabled),
      auto_sync_interval_hours: r.auto_sync_interval_hours || 12,
      weights: r.weights ? JSON.parse(r.weights) : DEFAULT_SETTINGS.weights,
    };
  }

  public updateSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };

    if (this.isFallbackMode || !this.sqliteDb) {
      this.memStore.settings = updated;
      this.persistMemoryStore();
      return updated;
    }

    this.sqliteDb.prepare(`
      UPDATE settings SET
        inactivity_threshold_days = ?,
        academic_year = ?,
        fetch_delay_ms = ?,
        api_timeout_seconds = ?,
        tier_beginner_max = ?,
        tier_developing_max = ?,
        tier_proficient_max = ?,
        auto_sync_enabled = ?,
        auto_sync_interval_hours = ?,
        weights = ?
      WHERE id = 1
    `).run(
      updated.inactivity_threshold_days,
      updated.academic_year,
      updated.fetch_delay_ms,
      updated.api_timeout_seconds,
      updated.tier_beginner_max,
      updated.tier_developing_max,
      updated.tier_proficient_max,
      updated.auto_sync_enabled ? 1 : 0,
      updated.auto_sync_interval_hours || 12,
      JSON.stringify(updated.weights)
    );

    return updated;
  }

  // ================= POTD (PROBLEM OF THE DAY) =================
  public getTodayPOTDList(targetDate?: string): POTDItem[] {
    const today = targetDate || new Date().toISOString().split('T')[0];

    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.potd_items
        .filter(p => p.date === today)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }

    try {
      const rows = this.sqliteDb.prepare(`
        SELECT * FROM potd_items WHERE date = ? ORDER BY orderIndex ASC, created_at ASC
      `).all(today) as any[];

      return rows.map(r => ({
        id: r.id,
        date: r.date,
        title: r.title,
        titleSlug: r.titleSlug,
        difficulty: r.difficulty,
        topic: r.topic,
        acceptanceRate: r.acceptanceRate,
        leetcodeUrl: r.leetcodeUrl,
        hint: r.hint,
        orderIndex: r.orderIndex || 0,
        created_at: r.created_at,
      }));
    } catch (e) {
      console.error('Error fetching POTD list:', e);
      return [];
    }
  }

  public getTodayPOTD(targetDate?: string): POTDItem | null {
    const list = this.getTodayPOTDList(targetDate);
    return list.length > 0 ? list[0] : null;
  }

  public addPOTDItem(item: Omit<POTDItem, 'id' | 'created_at'>): POTDItem {
    const id = `potd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const created_at = new Date().toISOString();
    const date = item.date || created_at.split('T')[0];

    const newItem: POTDItem = {
      id,
      date,
      title: item.title,
      titleSlug: item.titleSlug,
      difficulty: item.difficulty || 'Medium',
      topic: item.topic || 'DSA',
      acceptanceRate: item.acceptanceRate || 50,
      leetcodeUrl: item.leetcodeUrl || `https://leetcode.com/problems/${item.titleSlug}/`,
      hint: item.hint || '',
      orderIndex: item.orderIndex || 0,
      created_at,
    };

    // Sync with memory store & JSON backup
    const memIdx = this.memStore.potd_items.findIndex(p => p.id === newItem.id);
    if (memIdx >= 0) {
      this.memStore.potd_items[memIdx] = newItem;
    } else {
      this.memStore.potd_items.push(newItem);
    }

    if (this.isFallbackMode || !this.sqliteDb) {
      this.persistMemoryStore();
      return newItem;
    }

    try {
      this.sqliteDb.prepare(`
        INSERT INTO potd_items (id, date, title, titleSlug, difficulty, topic, acceptanceRate, leetcodeUrl, hint, orderIndex, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newItem.id,
        newItem.date,
        newItem.title,
        newItem.titleSlug,
        newItem.difficulty,
        newItem.topic,
        newItem.acceptanceRate || 50,
        newItem.leetcodeUrl,
        newItem.hint || '',
        newItem.orderIndex || 0,
        newItem.created_at
      );
    } catch (e) {
      console.error('Error inserting POTD item:', e);
    }

    this.persistMemoryStore();
    return newItem;
  }

  public updatePOTDItem(id: string, item: Partial<POTDItem>): POTDItem | null {
    const memIdx = this.memStore.potd_items.findIndex(p => p.id === id);
    if (memIdx >= 0) {
      this.memStore.potd_items[memIdx] = { ...this.memStore.potd_items[memIdx], ...item };
    }

    if (this.isFallbackMode || !this.sqliteDb) {
      if (memIdx === -1) return null;
      this.persistMemoryStore();
      return this.memStore.potd_items[memIdx];
    }

    const current = this.sqliteDb.prepare('SELECT * FROM potd_items WHERE id = ?').get(id) as any;
    if (!current) return null;

    const updated = { ...current, ...item };
    this.sqliteDb.prepare(`
      UPDATE potd_items SET
        date = ?, title = ?, titleSlug = ?, difficulty = ?, topic = ?, acceptanceRate = ?, leetcodeUrl = ?, hint = ?, orderIndex = ?
      WHERE id = ?
    `).run(
      updated.date, updated.title, updated.titleSlug, updated.difficulty, updated.topic,
      updated.acceptanceRate, updated.leetcodeUrl, updated.hint, updated.orderIndex || 0, id
    );

    this.persistMemoryStore();
    return updated;
  }

  public deletePOTDItem(id: string): boolean {
    const initialLen = this.memStore.potd_items.length;
    this.memStore.potd_items = this.memStore.potd_items.filter(p => p.id !== id);
    this.persistMemoryStore();

    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.potd_items.length < initialLen;
    }

    const res = this.sqliteDb.prepare('DELETE FROM potd_items WHERE id = ?').run(id);
    return res.changes > 0;
  }

  public setPOTD(item: POTDItem): void {
    if (item.id) {
      this.updatePOTDItem(item.id, item);
    } else {
      this.addPOTDItem(item);
    }
  }

  public getPOTDHistory(limit: number = 50): POTDItem[] {
    if (this.isFallbackMode || !this.sqliteDb) {
      return [...this.memStore.potd_items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
    }
    try {
      const rows = this.sqliteDb.prepare('SELECT * FROM potd_items ORDER BY date DESC, orderIndex ASC LIMIT ?').all(limit) as any[];
      return rows.map(r => ({
        id: r.id,
        date: r.date,
        title: r.title,
        titleSlug: r.titleSlug,
        difficulty: r.difficulty,
        topic: r.topic,
        acceptanceRate: r.acceptanceRate,
        leetcodeUrl: r.leetcodeUrl,
        hint: r.hint,
        orderIndex: r.orderIndex || 0,
        created_at: r.created_at,
      }));
    } catch (e) {
      return [];
    }
  }

  // ================= CONTESTS MODULE =================
  public getContests(): ContestItem[] {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.contests || [];
    }

    try {
      const rows = this.sqliteDb.prepare('SELECT * FROM contests ORDER BY startTime DESC').all() as any[];
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          id: r.id,
          title: r.title,
          titleSlug: r.titleSlug,
          type: r.type,
          contestUrl: r.contestUrl,
          startTime: r.startTime,
          durationMinutes: r.durationMinutes || 90,
          description: r.description,
          problems: r.problems ? (typeof r.problems === 'string' ? JSON.parse(r.problems) : r.problems) : [],
          status: r.status || 'UPCOMING',
          created_at: r.created_at,
        }));
      }
      return this.memStore.contests || [];
    } catch (e) {
      console.error('Error fetching contests:', e);
      return this.memStore.contests || [];
    }
  }

  public getContestById(id: string): ContestItem | null {
    if (this.isFallbackMode || !this.sqliteDb) {
      return (this.memStore.contests || []).find(c => c.id === id) || null;
    }

    const r = this.sqliteDb.prepare('SELECT * FROM contests WHERE id = ?').get(id) as any;
    if (!r) {
      return (this.memStore.contests || []).find(c => c.id === id) || null;
    }
    return {
      id: r.id,
      title: r.title,
      titleSlug: r.titleSlug,
      type: r.type,
      contestUrl: r.contestUrl,
      startTime: r.startTime,
      durationMinutes: r.durationMinutes || 90,
      description: r.description,
      problems: r.problems ? (typeof r.problems === 'string' ? JSON.parse(r.problems) : r.problems) : [],
      status: r.status || 'UPCOMING',
      created_at: r.created_at,
    };
  }

  public addContest(item: Omit<ContestItem, 'id' | 'created_at'>): ContestItem {
    const id = `contest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const created_at = new Date().toISOString();

    const newContest: ContestItem = {
      id,
      title: item.title,
      titleSlug: item.titleSlug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: item.type || 'Weekly Contest',
      contestUrl: item.contestUrl || `https://leetcode.com/contest/${item.titleSlug || 'contest'}`,
      startTime: item.startTime || new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: item.durationMinutes || 90,
      description: item.description || '',
      problems: item.problems || [],
      status: item.status || 'UPCOMING',
      created_at,
    };

    if (!this.memStore.contests) this.memStore.contests = [];
    const memIdx = this.memStore.contests.findIndex(c => c.id === newContest.id);
    if (memIdx >= 0) {
      this.memStore.contests[memIdx] = newContest;
    } else {
      this.memStore.contests.push(newContest);
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('contests').upsert({
        id: newContest.id,
        title: newContest.title,
        titleSlug: newContest.titleSlug,
        type: newContest.type,
        contestUrl: newContest.contestUrl,
        startTime: newContest.startTime,
        durationMinutes: newContest.durationMinutes,
        description: newContest.description || '',
        problems: JSON.stringify(newContest.problems || []),
        status: newContest.status,
        created_at: newContest.created_at,
      }).then(({ error }) => {
        if (error) console.error('[Supabase] Contest insert error:', error);
      });
    }

    if (this.isFallbackMode || !this.sqliteDb) {
      this.persistMemoryStore();
      return newContest;
    }

    try {
      this.sqliteDb.prepare(`
        INSERT INTO contests (id, title, titleSlug, type, contestUrl, startTime, durationMinutes, description, problems, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newContest.id,
        newContest.title,
        newContest.titleSlug,
        newContest.type,
        newContest.contestUrl,
        newContest.startTime,
        newContest.durationMinutes,
        newContest.description || '',
        JSON.stringify(newContest.problems || []),
        newContest.status,
        newContest.created_at
      );
    } catch (e) {
      console.error('Error inserting contest:', e);
    }

    this.persistMemoryStore();
    return newContest;
  }

  public updateContest(id: string, item: Partial<ContestItem>): ContestItem | null {
    if (!this.memStore.contests) this.memStore.contests = [];
    const memIdx = this.memStore.contests.findIndex(c => c.id === id);
    if (memIdx >= 0) {
      this.memStore.contests[memIdx] = { ...this.memStore.contests[memIdx], ...item };
    }

    const current = this.getContestById(id);
    if (!current) return null;

    const updated: ContestItem = { ...current, ...item };

    if (isSupabaseConfigured && supabase) {
      supabase.from('contests').upsert({
        id: updated.id,
        title: updated.title,
        titleSlug: updated.titleSlug,
        type: updated.type,
        contestUrl: updated.contestUrl,
        startTime: updated.startTime,
        durationMinutes: updated.durationMinutes,
        description: updated.description || '',
        problems: JSON.stringify(updated.problems || []),
        status: updated.status,
      }).then(({ error }) => {
        if (error) console.error('[Supabase] Contest update error:', error);
      });
    }

    if (this.isFallbackMode || !this.sqliteDb) {
      this.persistMemoryStore();
      return updated;
    }

    try {
      this.sqliteDb.prepare(`
        UPDATE contests SET
          title = ?, titleSlug = ?, type = ?, contestUrl = ?, startTime = ?, durationMinutes = ?, description = ?, problems = ?, status = ?
        WHERE id = ?
      `).run(
        updated.title,
        updated.titleSlug,
        updated.type,
        updated.contestUrl,
        updated.startTime,
        updated.durationMinutes,
        updated.description || '',
        JSON.stringify(updated.problems || []),
        updated.status,
        id
      );
    } catch (e) {
      console.error('Error updating contest in SQLite:', e);
    }

    this.persistMemoryStore();
    return updated;
  }

  public deleteContest(id: string): boolean {
    if (!this.memStore.contests) this.memStore.contests = [];
    const initial = this.memStore.contests.length;
    this.memStore.contests = this.memStore.contests.filter(c => c.id !== id);

    if (isSupabaseConfigured && supabase) {
      supabase.from('contests').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('[Supabase] Contest delete error:', error);
      });
    }

    this.persistMemoryStore();

    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.contests.length < initial;
    }

    try {
      const res = this.sqliteDb.prepare('DELETE FROM contests WHERE id = ?').run(id);
      return res.changes > 0 || this.memStore.contests.length < initial;
    } catch (e) {
      return this.memStore.contests.length < initial;
    }
  }

  // ================= CURATED TRACKS & PROBLEMS =================
  public getTracks(): CuratedTrack[] {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.curated_tracks || [];
    }
    try {
      const tracks = this.sqliteDb.prepare('SELECT * FROM curated_tracks').all() as any[];
      return tracks.map(t => {
        const probCount = (this.sqliteDb.prepare('SELECT COUNT(*) as c FROM curated_problems WHERE trackId = ?').get(t.id) as { c: number }).c;
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          icon: t.icon,
          totalProblems: probCount || t.totalProblems || 0,
        };
      });
    } catch (e) {
      return [];
    }
  }

  public getTrackById(trackId: string): (CuratedTrack & { problems: CuratedProblem[] }) | null {
    if (this.isFallbackMode || !this.sqliteDb) {
      const track = (this.memStore.curated_tracks || []).find(t => t.id === trackId);
      if (!track) return null;
      const problems = (this.memStore.curated_problems || []).filter(p => p.trackId === trackId);
      return { ...track, problems };
    }

    try {
      const track = this.sqliteDb.prepare('SELECT * FROM curated_tracks WHERE id = ?').get(trackId) as any;
      if (!track) return null;

      const problems = this.sqliteDb.prepare('SELECT * FROM curated_problems WHERE trackId = ? ORDER BY orderIndex ASC').all(trackId) as any[];
      return {
        id: track.id,
        title: track.title,
        description: track.description,
        category: track.category,
        icon: track.icon,
        totalProblems: problems.length,
        problems: problems.map(p => ({
          id: p.id,
          trackId: p.trackId,
          title: p.title,
          titleSlug: p.titleSlug,
          difficulty: p.difficulty,
          topic: p.topic,
          orderIndex: p.orderIndex,
          leetcodeUrl: p.leetcodeUrl,
        }))
      };
    } catch (e) {
      return null;
    }
  }

  public addTrack(track: Omit<CuratedTrack, 'id'>): CuratedTrack {
    const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTrack: CuratedTrack = {
      id,
      title: track.title,
      description: track.description,
      category: track.category || 'custom',
      icon: track.icon || 'Code',
      totalProblems: 0,
    };

    if (this.isFallbackMode || !this.sqliteDb) {
      if (!this.memStore.curated_tracks) this.memStore.curated_tracks = [];
      this.memStore.curated_tracks.push(newTrack);
      this.persistMemoryStore();
      return newTrack;
    }

    this.sqliteDb.prepare(`
      INSERT INTO curated_tracks (id, title, description, category, icon, totalProblems)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(newTrack.id, newTrack.title, newTrack.description, newTrack.category, newTrack.icon);

    return newTrack;
  }

  public deleteTrack(id: string): boolean {
    if (this.isFallbackMode || !this.sqliteDb) {
      this.memStore.curated_tracks = (this.memStore.curated_tracks || []).filter(t => t.id !== id);
      this.memStore.curated_problems = (this.memStore.curated_problems || []).filter(p => p.trackId !== id);
      this.persistMemoryStore();
      return true;
    }

    const res = this.sqliteDb.prepare('DELETE FROM curated_tracks WHERE id = ?').run(id);
    return res.changes > 0;
  }

  public addProblemToTrack(prob: Omit<CuratedProblem, 'id'>): CuratedProblem {
    const id = `prob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProb: CuratedProblem = {
      id,
      trackId: prob.trackId,
      title: prob.title,
      titleSlug: prob.titleSlug,
      difficulty: prob.difficulty,
      topic: prob.topic,
      orderIndex: prob.orderIndex || 0,
      leetcodeUrl: prob.leetcodeUrl || `https://leetcode.com/problems/${prob.titleSlug}/`,
    };

    if (this.isFallbackMode || !this.sqliteDb) {
      if (!this.memStore.curated_problems) this.memStore.curated_problems = [];
      this.memStore.curated_problems.push(newProb);
      this.persistMemoryStore();
      return newProb;
    }

    this.sqliteDb.prepare(`
      INSERT INTO curated_problems (id, trackId, title, titleSlug, difficulty, topic, orderIndex, leetcodeUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newProb.id, newProb.trackId, newProb.title, newProb.titleSlug, newProb.difficulty, newProb.topic, newProb.orderIndex, newProb.leetcodeUrl);

    return newProb;
  }

  public deleteProblemFromTrack(problemId: string): boolean {
    if (this.isFallbackMode || !this.sqliteDb) {
      this.memStore.curated_problems = (this.memStore.curated_problems || []).filter(p => p.id !== problemId);
      this.persistMemoryStore();
      return true;
    }

    const res = this.sqliteDb.prepare('DELETE FROM curated_problems WHERE id = ?').run(problemId);
    return res.changes > 0;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  // Reset
  public resetToDemo(): void {
    if (this.isFallbackMode || !this.sqliteDb) {
      this.memStore = {
        students: [],
        snapshots: [],
        recent_submissions: [],
        settings: DEFAULT_SETTINGS,
        logs: [],
        potd_items: [],
        curated_tracks: [],
        curated_problems: [],
        contests: [],
        users: []
      };
      this.persistMemoryStore();
      return;
    }

    this.sqliteDb.transaction(() => {
      this.sqliteDb.prepare('DELETE FROM snapshots').run();
      this.sqliteDb.prepare('DELETE FROM recent_submissions').run();
      this.sqliteDb.prepare('DELETE FROM students').run();
      this.sqliteDb.prepare('DELETE FROM potd_items').run();
      this.sqliteDb.prepare('DELETE FROM curated_tracks').run();
      this.sqliteDb.prepare('DELETE FROM curated_problems').run();
      this.sqliteDb.prepare('DELETE FROM contests').run();
      this.updateSettings(DEFAULT_SETTINGS);
    })();
  }

  // Logs
  public addLog(level: string, message: string): void {
    if (this.isFallbackMode || !this.sqliteDb) {
      this.memStore.logs.push({ timestamp: new Date().toISOString(), level, message });
      if (this.memStore.logs.length > 500) this.memStore.logs = this.memStore.logs.slice(-500);
      return;
    }

    this.sqliteDb.prepare(`
      INSERT INTO logs (timestamp, level, message) VALUES (?, ?, ?)
    `).run(new Date().toISOString(), level, message);

    this.sqliteDb.prepare(`
      DELETE FROM logs WHERE id NOT IN (
        SELECT id FROM logs ORDER BY id DESC LIMIT 1000
      )
    `).run();
  }

  public getLogs(): { timestamp: string; level: string; message: string }[] {
    if (this.isFallbackMode || !this.sqliteDb) {
      return [...this.memStore.logs].reverse();
    }
    const rows = this.sqliteDb.prepare('SELECT timestamp, level, message FROM logs ORDER BY id DESC LIMIT 500').all() as any[];
    return rows.reverse();
  }

  // ================= AUTH & USER MANAGEMENT =================

  public hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password.trim()).digest('hex');
  }

  public seedInitialUsers(): void {
    try {
      // 1. Seed Faculty account: Faculty_CSBS / Kite@123
      const facultyPasswordHash = this.hashPassword('Kite@123');

      if (this.isFallbackMode || !this.sqliteDb) {
        this.memStore.users = this.memStore.users.filter(u => u.role !== 'staff');
        this.memStore.users.push({
          id: 'u_faculty_csbs',
          username: 'Faculty_CSBS',
          password_hash: facultyPasswordHash,
          role: 'staff',
          name: 'Faculty Coordinator (CSBS)',
          email: 'faculty.csbs@kgkite.ac.in',
          created_at: new Date().toISOString()
        });
      } else {
        // Clear old staff accounts to ensure Faculty_CSBS is the unified staff account
        this.sqliteDb.prepare("DELETE FROM users WHERE role = 'staff'").run();

        const insertUser = this.sqliteDb.prepare(`
          INSERT OR REPLACE INTO users (id, username, password_hash, role, student_id, name, email, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertUser.run(
          'u_faculty_csbs',
          'Faculty_CSBS',
          facultyPasswordHash,
          'staff',
          null,
          'Faculty Coordinator (CSBS)',
          'faculty.csbs@kgkite.ac.in',
          new Date().toISOString()
        );
      }

      // 2. Sync all student users
      const allStudents = this.getStudents();
      for (const student of allStudents) {
        this.ensureStudentUser(student);
      }
    } catch (e) {
      console.error('Failed to seed initial users:', e);
    }
  }

  public ensureStudentInSqlite(student: Student): void {
    if (!this.sqliteDb) return;
    try {
      this.sqliteDb.prepare(`
        INSERT OR REPLACE INTO students (
          id, register_no, student_name, section, year, batch, username, email, mentor, academic_year, active, created_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        student.id,
        student.register_no,
        student.student_name,
        student.section || 'A',
        student.year || 'II',
        student.batch || '2023-2027',
        student.username,
        student.email || null,
        student.mentor || null,
        student.academic_year || DEFAULT_SETTINGS.academic_year,
        student.active ? 1 : 0,
        student.created_at || new Date().toISOString(),
        student.notes || null
      );
    } catch (e) {}
  }

  public ensureStudentUser(student: Student): DBUser {
    this.ensureStudentInSqlite(student);

    const studentEmail = (student.email && student.email.trim()) 
      ? student.email.trim().toLowerCase() 
      : `${student.register_no.toLowerCase()}@kgkite.ac.in`;
    
    const defaultPasswordHash = this.hashPassword(student.register_no.trim());
    const userId = `usr_${student.id}`;

    // 1. Check if user already exists in memStore
    let existingMem = this.memStore.users.find(u => u.id === userId || u.student_id === student.id || u.username.toLowerCase() === studentEmail);
    if (existingMem) {
      existingMem.student_id = student.id;
      existingMem.name = student.student_name;
      existingMem.email = studentEmail;
      existingMem.username = studentEmail;
      return existingMem;
    }

    // 2. Check if user exists in SQLite
    if (this.sqliteDb) {
      const existingDb = this.sqliteDb.prepare(`
        SELECT * FROM users WHERE id = ? OR student_id = ? OR LOWER(username) = LOWER(?)
      `).get(userId, student.id, studentEmail) as DBUser | undefined;

      if (existingDb) {
        const updatedUser: DBUser = {
          ...existingDb,
          student_id: student.id,
          name: student.student_name,
          email: studentEmail,
          username: studentEmail,
        };
        const idx = this.memStore.users.findIndex(x => x.id === updatedUser.id);
        if (idx >= 0) {
          this.memStore.users[idx] = updatedUser;
        } else {
          this.memStore.users.push(updatedUser);
        }
        return updatedUser;
      }
    }

    // 3. Otherwise create new student user with default password
    const newUser: DBUser = {
      id: userId,
      username: studentEmail,
      password_hash: defaultPasswordHash,
      role: 'student',
      student_id: student.id,
      name: student.student_name,
      email: studentEmail,
      created_at: new Date().toISOString()
    };

    const idx = this.memStore.users.findIndex(x => x.id === newUser.id);
    if (idx >= 0) {
      this.memStore.users[idx] = newUser;
    } else {
      this.memStore.users.push(newUser);
    }

    if (this.sqliteDb) {
      try {
        this.sqliteDb.prepare(`
          INSERT OR REPLACE INTO users (id, username, password_hash, role, student_id, name, email, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(newUser.id, newUser.username, newUser.password_hash, newUser.role, newUser.student_id, newUser.name, newUser.email, newUser.created_at);
      } catch (e) {}
    }

    this.persistMemoryStore();
    return newUser;
  }

  public authenticateUser(identifier: string, plainPassword: string, role?: UserRole): { user: DBUser; student?: Student } | null {
    if (!identifier || !plainPassword) return null;

    const cleanId = identifier.trim();
    const cleanPwd = plainPassword.trim();
    const hashedPwd = this.hashPassword(cleanPwd);

    // If Staff Role Requested or matching Faculty_CSBS / staff / admin
    if (
      role === 'staff' || 
      cleanId.toLowerCase() === 'faculty_csbs' || 
      cleanId.toLowerCase() === 'staff' || 
      cleanId.toLowerCase() === 'admin'
    ) {
      let staffUser: DBUser | undefined;

      if (this.isFallbackMode || !this.sqliteDb) {
        staffUser = this.memStore.users.find(u => 
          u.role === 'staff' && (
            u.username.toLowerCase() === cleanId.toLowerCase() ||
            (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) ||
            cleanId.toLowerCase() === 'faculty_csbs'
          )
        );
      } else {
        staffUser = this.sqliteDb.prepare(`
          SELECT * FROM users 
          WHERE role = 'staff' AND (
            LOWER(username) = LOWER(?) OR 
            LOWER(email) = LOWER(?) OR 
            LOWER(username) = 'faculty_csbs'
          )
        `).get(cleanId, cleanId) as DBUser | undefined;
      }

      if (!staffUser) {
        // Create on demand if missing
        staffUser = {
          id: 'u_faculty_csbs',
          username: 'Faculty_CSBS',
          password_hash: this.hashPassword('Kite@123'),
          role: 'staff',
          name: 'Faculty Coordinator (CSBS)',
          email: 'faculty.csbs@kgkite.ac.in',
          created_at: new Date().toISOString()
        };
      }

      // Default password ('Kite@123') ONLY works if the faculty has NOT updated their password yet
      const defaultStaffHash = this.hashPassword('Kite@123');
      const isDefaultStaffPassword = staffUser.password_hash === defaultStaffHash;
      
      const isExactMatch = staffUser.password_hash === hashedPwd;
      const isDefaultMatch = isDefaultStaffPassword && cleanPwd === 'Kite@123';

      if (isExactMatch || isDefaultMatch) {
        return { user: staffUser };
      }
      if (role === 'staff') return null;
    }

    // Student Authentication
    // Username credential: student's email id, register_no, or username
    // Password credential: student's register number (default) OR updated password

    let foundStudent: Student | undefined;
    const allStudents = this.getStudents();
    const cleanIdPrefix = cleanId.includes('@') ? cleanId.split('@')[0].trim().toLowerCase() : cleanId.toLowerCase();

    foundStudent = allStudents.find(s => {
      const regNo = (s.register_no || '').toLowerCase().trim();
      const uname = (s.username || '').toLowerCase().trim();
      const email = (s.email || '').toLowerCase().trim();
      const targetId = cleanId.toLowerCase();

      return (
        (email && email === targetId) ||
        regNo === targetId ||
        uname === targetId ||
        regNo === cleanIdPrefix ||
        uname === cleanIdPrefix ||
        `${regNo}@kgkite.ac.in` === targetId ||
        `${uname}@kgkite.ac.in` === targetId ||
        targetId.includes(regNo) ||
        targetId.includes(uname)
      );
    });

    if (foundStudent) {
      const studentUser = this.ensureStudentUser(foundStudent);

      // Check if student is still using default register_no password
      const defaultRegNoHash = this.hashPassword(foundStudent.register_no.trim());
      const isDefaultPassword = studentUser.password_hash === defaultRegNoHash;

      // 1. Exact stored password hash match (works for updated password or default password)
      const isExactHashMatch = studentUser.password_hash === hashedPwd;

      // 2. Default password matches (ONLY allowed if student has NOT changed their password yet)
      const regNo = (foundStudent.register_no || '').trim().toLowerCase();
      const uname = (foundStudent.username || '').trim().toLowerCase();
      const pwdLower = cleanPwd.toLowerCase();

      const isRegNoMatch = isDefaultPassword && pwdLower === regNo;
      const isUsernameMatch = isDefaultPassword && pwdLower === uname;
      const isAltHashMatch = isDefaultPassword && (
        studentUser.password_hash === this.hashPassword(cleanPwd.toLowerCase()) || 
        studentUser.password_hash === this.hashPassword(cleanPwd.toUpperCase())
      );

      if (isExactHashMatch || isRegNoMatch || isUsernameMatch || isAltHashMatch) {
        if (cleanId.includes('@') && studentUser.email !== cleanId) {
          studentUser.email = cleanId;
          studentUser.username = cleanId;
        }
        return { user: studentUser, student: foundStudent };
      }
    }

    // Direct search in users table for student
    let userRow: DBUser | undefined;
    if (this.isFallbackMode || !this.sqliteDb) {
      userRow = this.memStore.users.find(u => 
        u.username.toLowerCase() === cleanId.toLowerCase() || 
        (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) ||
        u.username.toLowerCase().startsWith(cleanIdPrefix)
      );
    } else {
      userRow = this.sqliteDb.prepare(`
        SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) OR LOWER(username) LIKE LOWER(?)
      `).get(cleanId, cleanId, `${cleanIdPrefix}%`) as DBUser | undefined;
    }

    if (userRow) {
      const student = userRow.student_id ? this.getStudentById(userRow.student_id) : undefined;
      const defaultHash = student ? this.hashPassword(student.register_no.trim()) : '';
      const isDefaultPassword = student ? userRow.password_hash === defaultHash : false;

      const isExactHashMatch = userRow.password_hash === hashedPwd;
      const isAltHashMatch = isDefaultPassword && (
        userRow.password_hash === this.hashPassword(cleanPwd.toLowerCase()) ||
        userRow.password_hash === this.hashPassword(cleanPwd.toUpperCase())
      );
      const isRegNoMatch = isDefaultPassword && student && cleanPwd.toLowerCase() === (student.register_no || '').trim().toLowerCase();

      if (isExactHashMatch || isAltHashMatch || isRegNoMatch) {
        return { user: userRow, student };
      }
    }

    return null;
  }

  public getUserById(id: string): DBUser | null {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.users.find(u => u.id === id) || null;
    }
    const user = this.sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id) as DBUser | undefined;
    return user || null;
  }

  public getUserByStudentId(studentId: string): DBUser | null {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.users.find(u => u.student_id === studentId) || null;
    }
    const user = this.sqliteDb.prepare('SELECT * FROM users WHERE student_id = ?').get(studentId) as DBUser | undefined;
    return user || null;
  }

  public changeUserPassword(userId: string, newPlainPassword: string): boolean {
    const hash = this.hashPassword(newPlainPassword);
    
    // Always sync with memStore
    const u = this.memStore.users.find(x => x.id === userId);
    if (u) {
      u.password_hash = hash;
    }
    this.persistMemoryStore();

    if (isSupabaseConfigured && supabase) {
      supabase.from('users').upsert({
        id: userId,
        password_hash: hash,
        username: u?.username || 'user',
        role: u?.role || 'student',
        name: u?.name || 'User',
        email: u?.email || null,
        created_at: u?.created_at || new Date().toISOString()
      }, { onConflict: 'id' }).then(({ error }) => {
        if (error) {
          supabase.from('users').update({ password_hash: hash }).eq('id', userId).then(({ error: err2 }) => {
            if (err2) console.error('[Supabase] User password update error:', err2.message);
          });
        }
      });
    }

    if (this.isFallbackMode || !this.sqliteDb) {
      return !!u;
    }

    try {
      const res = this.sqliteDb.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
      return res.changes > 0 || !!u;
    } catch (e) {
      return !!u;
    }
  }
}

export const db = new DatabaseService();


