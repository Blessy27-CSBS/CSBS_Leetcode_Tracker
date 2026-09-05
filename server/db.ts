import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';
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
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.students;
    }
    const rows = this.sqliteDb.prepare('SELECT * FROM students ORDER BY student_name ASC').all() as any[];
    return rows.map(r => ({
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

    if (this.isFallbackMode || !this.sqliteDb) {
      this.memStore.students.push(newStudent);
      this.ensureStudentUser(newStudent);
      this.persistMemoryStore();
      return newStudent;
    }

    this.sqliteDb.prepare(`
      INSERT INTO students (
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

    this.ensureStudentUser(newStudent);
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    if (this.isFallbackMode || !this.sqliteDb) {
      const idx = this.memStore.students.findIndex(s => s.id === id);
      if (idx === -1) return null;
      this.memStore.students[idx] = { ...this.memStore.students[idx], ...updates };
      this.ensureStudentUser(this.memStore.students[idx]);
      this.persistMemoryStore();
      return this.memStore.students[idx];
    }

    const existing = this.getStudentById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };

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

    this.ensureStudentUser(merged);
    return merged;
  }

  public deleteStudent(id: string): boolean {
    if (this.isFallbackMode || !this.sqliteDb) {
      const initLen = this.memStore.students.length;
      this.memStore.students = this.memStore.students.filter(s => s.id !== id);
      this.memStore.snapshots = this.memStore.snapshots.filter(s => s.student_id !== id);
      this.memStore.recent_submissions = this.memStore.recent_submissions.filter(s => s.student_id !== id);
      this.persistMemoryStore();
      return this.memStore.students.length < initLen;
    }

    const res = this.sqliteDb.prepare('DELETE FROM students WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // Snapshots
  public getSnapshots(studentId?: string): Snapshot[] {
    if (this.isFallbackMode || !this.sqliteDb) {
      if (studentId) {
        return this.memStore.snapshots
          .filter(s => s.student_id === studentId)
          .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
      }
      return this.memStore.snapshots;
    }

    let rows: any[];
    if (studentId) {
      rows = this.sqliteDb.prepare('SELECT * FROM snapshots WHERE student_id = ? ORDER BY datetime(captured_at) ASC').all(studentId);
    } else {
      rows = this.sqliteDb.prepare('SELECT * FROM snapshots ORDER BY datetime(captured_at) ASC').all();
    }

    return rows.map(r => ({
      id: r.id,
      student_id: r.student_id,
      captured_at: r.captured_at,
      total_solved: r.total_solved,
      easy: r.easy,
      medium: r.medium,
      hard: r.hard,
      acceptance_rate: r.acceptance_rate,
      ranking: r.ranking,
      reputation: r.reputation,
      contest_rating: r.contest_rating,
      contest_rank: r.contest_rank,
      contests_attended: r.contests_attended,
      top_percentage: r.top_percentage,
      streak: r.streak,
      active_days: r.active_days,
      last_active: r.last_active || undefined,
      languages: r.languages ? JSON.parse(r.languages) : [],
      skills: r.skills ? JSON.parse(r.skills) : [],
      badges: r.badges ? JSON.parse(r.badges) : [],
      submission_calendar: r.submission_calendar ? JSON.parse(r.submission_calendar) : {},
      engagement_score: r.engagement_score,
      performance_tier: r.performance_tier,
      activity_status: r.activity_status,
      status: r.status,
      error: r.error || undefined,
    }));
  }

  public getLatestSnapshot(studentId: string): Snapshot | undefined {
    if (this.isFallbackMode || !this.sqliteDb) {
      const list = this.getSnapshots(studentId);
      return list.length > 0 ? list[list.length - 1] : undefined;
    }

    const r = this.sqliteDb.prepare('SELECT * FROM snapshots WHERE student_id = ? ORDER BY datetime(captured_at) DESC LIMIT 1').get(studentId) as any;
    if (!r) return undefined;
    return {
      id: r.id,
      student_id: r.student_id,
      captured_at: r.captured_at,
      total_solved: r.total_solved,
      easy: r.easy,
      medium: r.medium,
      hard: r.hard,
      acceptance_rate: r.acceptance_rate,
      ranking: r.ranking,
      reputation: r.reputation,
      contest_rating: r.contest_rating,
      contest_rank: r.contest_rank,
      contests_attended: r.contests_attended,
      top_percentage: r.top_percentage,
      streak: r.streak,
      active_days: r.active_days,
      last_active: r.last_active || undefined,
      languages: r.languages ? JSON.parse(r.languages) : [],
      skills: r.skills ? JSON.parse(r.skills) : [],
      badges: r.badges ? JSON.parse(r.badges) : [],
      submission_calendar: r.submission_calendar ? JSON.parse(r.submission_calendar) : {},
      engagement_score: r.engagement_score,
      performance_tier: r.performance_tier,
      activity_status: r.activity_status,
      status: r.status,
      error: r.error || undefined,
    };
  }

  public getPreviousSnapshot(studentId: string): Snapshot | undefined {
    if (this.isFallbackMode || !this.sqliteDb) {
      const list = this.getSnapshots(studentId);
      return list.length > 1 ? list[list.length - 2] : undefined;
    }

    const rows = this.sqliteDb.prepare('SELECT * FROM snapshots WHERE student_id = ? ORDER BY datetime(captured_at) DESC LIMIT 2').all(studentId) as any[];
    if (rows.length < 2) return undefined;
    const r = rows[1];
    return {
      id: r.id,
      student_id: r.student_id,
      captured_at: r.captured_at,
      total_solved: r.total_solved,
      easy: r.easy,
      medium: r.medium,
      hard: r.hard,
      acceptance_rate: r.acceptance_rate,
      ranking: r.ranking,
      reputation: r.reputation,
      contest_rating: r.contest_rating,
      contest_rank: r.contest_rank,
      contests_attended: r.contests_attended,
      top_percentage: r.top_percentage,
      streak: r.streak,
      active_days: r.active_days,
      last_active: r.last_active || undefined,
      languages: r.languages ? JSON.parse(r.languages) : [],
      skills: r.skills ? JSON.parse(r.skills) : [],
      badges: r.badges ? JSON.parse(r.badges) : [],
      submission_calendar: r.submission_calendar ? JSON.parse(r.submission_calendar) : {},
      engagement_score: r.engagement_score,
      performance_tier: r.performance_tier,
      activity_status: r.activity_status,
      status: r.status,
      error: r.error || undefined,
    };
  }

  public addSnapshot(snapshot: Omit<Snapshot, 'id'>): Snapshot {
    const id = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSnap: Snapshot = {
      ...snapshot,
      id,
    };

    if (this.isFallbackMode || !this.sqliteDb) {
      this.memStore.snapshots.push(newSnap);
      this.persistMemoryStore();
      return newSnap;
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

    return newSnap;
  }

  public deleteSnapshots(studentId?: string): void {
    if (this.isFallbackMode || !this.sqliteDb) {
      if (studentId) {
        this.memStore.snapshots = this.memStore.snapshots.filter(s => s.student_id !== studentId);
      } else {
        this.memStore.snapshots = [];
      }
      this.persistMemoryStore();
      return;
    }

    if (studentId) {
      this.sqliteDb.prepare('DELETE FROM snapshots WHERE student_id = ?').run(studentId);
    } else {
      this.sqliteDb.prepare('DELETE FROM snapshots').run();
    }
  }

  // Recent Submissions
  public getSubmissions(studentId: string): RecentSubmission[] {
    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.recent_submissions.filter(r => r.student_id === studentId);
    }
    const rows = this.sqliteDb.prepare('SELECT * FROM recent_submissions WHERE student_id = ? ORDER BY id DESC').all(studentId) as any[];
    return rows.map(r => ({
      id: r.id,
      student_id: r.student_id,
      title: r.title,
      titleSlug: r.titleSlug,
      timestamp: r.timestamp,
      language: r.language,
      statusDisplay: r.statusDisplay,
    }));
  }

  public setSubmissions(studentId: string, subs: RecentSubmission[]): void {
    if (this.isFallbackMode || !this.sqliteDb) {
      this.memStore.recent_submissions = this.memStore.recent_submissions.filter(r => r.student_id !== studentId);
      this.memStore.recent_submissions.push(...subs);
      this.persistMemoryStore();
      return;
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
      return rows.map(r => ({
        id: r.id,
        title: r.title,
        titleSlug: r.titleSlug,
        type: r.type,
        contestUrl: r.contestUrl,
        startTime: r.startTime,
        durationMinutes: r.durationMinutes || 90,
        description: r.description,
        problems: r.problems ? JSON.parse(r.problems) : [],
        status: r.status || 'UPCOMING',
        created_at: r.created_at,
      }));
    } catch (e) {
      console.error('Error fetching contests:', e);
      return [];
    }
  }

  public getContestById(id: string): ContestItem | null {
    if (this.isFallbackMode || !this.sqliteDb) {
      return (this.memStore.contests || []).find(c => c.id === id) || null;
    }

    const r = this.sqliteDb.prepare('SELECT * FROM contests WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      titleSlug: r.titleSlug,
      type: r.type,
      contestUrl: r.contestUrl,
      startTime: r.startTime,
      durationMinutes: r.durationMinutes || 90,
      description: r.description,
      problems: r.problems ? JSON.parse(r.problems) : [],
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

    if (this.isFallbackMode || !this.sqliteDb) {
      if (memIdx === -1) return null;
      this.persistMemoryStore();
      return this.memStore.contests[memIdx];
    }

    const current = this.getContestById(id);
    if (!current) return null;

    const updated: ContestItem = { ...current, ...item };
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

    this.persistMemoryStore();
    return updated;
  }

  public deleteContest(id: string): boolean {
    if (!this.memStore.contests) this.memStore.contests = [];
    const initial = this.memStore.contests.length;
    this.memStore.contests = this.memStore.contests.filter(c => c.id !== id);
    this.persistMemoryStore();

    if (this.isFallbackMode || !this.sqliteDb) {
      return this.memStore.contests.length < initial;
    }

    const res = this.sqliteDb.prepare('DELETE FROM contests WHERE id = ?').run(id);
    return res.changes > 0;
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

  public ensureStudentUser(student: Student): DBUser {
    const studentEmail = (student.email && student.email.trim()) 
      ? student.email.trim().toLowerCase() 
      : `${student.register_no.toLowerCase()}@kgkite.ac.in`;
    
    const defaultPasswordHash = this.hashPassword(student.register_no.trim());
    const userId = `usr_${student.id}`;

    if (this.isFallbackMode || !this.sqliteDb) {
      let existing = this.memStore.users.find(u => u.student_id === student.id || u.username.toLowerCase() === studentEmail);
      if (existing) {
        existing.student_id = student.id;
        existing.name = student.student_name;
        existing.email = studentEmail;
        existing.username = studentEmail;
        return existing;
      }
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
      this.memStore.users.push(newUser);
      this.persistMemoryStore();
      return newUser;
    }

    // Check if user already exists for this student
    const existing = this.sqliteDb.prepare(`
      SELECT * FROM users WHERE student_id = ? OR LOWER(username) = LOWER(?)
    `).get(student.id, studentEmail) as DBUser | undefined;

    if (existing) {
      this.sqliteDb.prepare(`
        UPDATE users SET student_id = ?, name = ?, email = ?, username = ?
        WHERE id = ?
      `).run(student.id, student.student_name, studentEmail, studentEmail, existing.id);
      return {
        ...existing,
        student_id: student.id,
        name: student.student_name,
        email: studentEmail,
        username: studentEmail
      };
    }

    this.sqliteDb.prepare(`
      INSERT INTO users (id, username, password_hash, role, student_id, name, email, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      studentEmail,
      defaultPasswordHash,
      'student',
      student.id,
      student.student_name,
      studentEmail,
      new Date().toISOString()
    );

    return {
      id: userId,
      username: studentEmail,
      password_hash: defaultPasswordHash,
      role: 'student',
      student_id: student.id,
      name: student.student_name,
      email: studentEmail,
      created_at: new Date().toISOString()
    };
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

      // Check if password matches Kite@123 or stored password
      if (staffUser.password_hash === hashedPwd || cleanPwd === 'Kite@123') {
        return { user: staffUser };
      }
      if (role === 'staff') return null;
    }

    // Student Authentication
    // The username credential is the student's mail id (or register_no/username fallback)
    // The password credential is the student's register number (default on creation) or updated password

    let foundStudent: Student | undefined;

    // Search in students by email, register_no, or username
    const allStudents = this.getStudents();
    foundStudent = allStudents.find(s => 
      (s.email && s.email.toLowerCase().trim() === cleanId.toLowerCase()) ||
      s.register_no.toLowerCase().trim() === cleanId.toLowerCase() ||
      s.username.toLowerCase().trim() === cleanId.toLowerCase() ||
      `${s.register_no.toLowerCase()}@kgkite.ac.in` === cleanId.toLowerCase()
    );

    if (foundStudent) {
      const studentUser = this.ensureStudentUser(foundStudent);

      // Check password: match strictly against user's stored password_hash.
      const isHashMatch = studentUser.password_hash === hashedPwd;

      if (isHashMatch) {
        return { user: studentUser, student: foundStudent };
      }
    }

    // Direct search in users table for student
    let userRow: DBUser | undefined;
    if (this.isFallbackMode || !this.sqliteDb) {
      userRow = this.memStore.users.find(u => 
        (u.username.toLowerCase() === cleanId.toLowerCase() || (u.email && u.email.toLowerCase() === cleanId.toLowerCase()))
      );
    } else {
      userRow = this.sqliteDb.prepare(`
        SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
      `).get(cleanId, cleanId) as DBUser | undefined;
    }

    if (userRow) {
      if (userRow.password_hash === hashedPwd) {
        const student = userRow.student_id ? this.getStudentById(userRow.student_id) : undefined;
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

    if (this.isFallbackMode || !this.sqliteDb) {
      return !!u;
    }

    const res = this.sqliteDb.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
    return res.changes > 0;
  }
}

export const db = new DatabaseService();


