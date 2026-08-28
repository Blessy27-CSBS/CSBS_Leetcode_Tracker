import fs from 'fs';
import path from 'path';
import DatabaseConstructor, { Database as SQLiteDB } from 'better-sqlite3';
import { 
  Student, 
  Snapshot, 
  RecentSubmission, 
  SystemSettings 
} from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'csbs_tracker.db');
const LEGACY_JSON_FILE = path.join(DATA_DIR, 'tracker_database.json');

const DEFAULT_SETTINGS: SystemSettings = {
  inactivity_threshold_days: 14,
  academic_year: '2024-2025',
  fetch_delay_ms: 1500,
  api_timeout_seconds: 25,
  tier_beginner_max: 49,
  tier_developing_max: 99,
  tier_proficient_max: 199,
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

export class DatabaseService {
  private db: SQLiteDB;

  constructor() {
    this.ensureDataDir();
    this.db = new DatabaseConstructor(DB_FILE);
    this.initDatabase();
    this.migrateFromLegacyJSON();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private initDatabase() {
    // Enable WAL mode for performance & concurrent reads
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_students_section ON students(section);
      CREATE INDEX IF NOT EXISTS idx_students_year ON students(year);

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
      CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at ON snapshots(captured_at);

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

      CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON recent_submissions(student_id);

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        inactivity_threshold_days INTEGER NOT NULL DEFAULT 14,
        academic_year TEXT NOT NULL DEFAULT '2024-2025',
        fetch_delay_ms INTEGER NOT NULL DEFAULT 1500,
        api_timeout_seconds INTEGER NOT NULL DEFAULT 25,
        tier_beginner_max INTEGER NOT NULL DEFAULT 49,
        tier_developing_max INTEGER NOT NULL DEFAULT 99,
        tier_proficient_max INTEGER NOT NULL DEFAULT 199,
        weights TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL
      );
    `);

    // Ensure settings record exists
    const settingsRow = this.db.prepare('SELECT id FROM settings WHERE id = 1').get();
    if (!settingsRow) {
      this.db.prepare(`
        INSERT INTO settings (
          id, inactivity_threshold_days, academic_year, fetch_delay_ms, api_timeout_seconds,
          tier_beginner_max, tier_developing_max, tier_proficient_max, weights
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        DEFAULT_SETTINGS.inactivity_threshold_days,
        DEFAULT_SETTINGS.academic_year,
        DEFAULT_SETTINGS.fetch_delay_ms,
        DEFAULT_SETTINGS.api_timeout_seconds,
        DEFAULT_SETTINGS.tier_beginner_max,
        DEFAULT_SETTINGS.tier_developing_max,
        DEFAULT_SETTINGS.tier_proficient_max,
        JSON.stringify(DEFAULT_SETTINGS.weights)
      );
    }
  }

  private migrateFromLegacyJSON() {
    const studentCount = (this.db.prepare('SELECT COUNT(*) as c FROM students').get() as { c: number }).c;
    if (studentCount === 0 && fs.existsSync(LEGACY_JSON_FILE)) {
      try {
        const raw = fs.readFileSync(LEGACY_JSON_FILE, 'utf-8');
        const legacy = JSON.parse(raw);
        if (legacy && Array.isArray(legacy.students) && legacy.students.length > 0) {
          const insertStudent = this.db.prepare(`
            INSERT OR REPLACE INTO students (
              id, register_no, student_name, section, year, batch, username, email, mentor, academic_year, active, created_at, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const insertSnapshot = this.db.prepare(`
            INSERT OR REPLACE INTO snapshots (
              id, student_id, captured_at, total_solved, easy, medium, hard, acceptance_rate,
              ranking, reputation, contest_rating, contest_rank, contests_attended, top_percentage,
              streak, active_days, last_active, languages, skills, badges, submission_calendar,
              engagement_score, performance_tier, activity_status, status, error
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const insertSub = this.db.prepare(`
            INSERT OR REPLACE INTO recent_submissions (
              id, student_id, title, titleSlug, timestamp, language, statusDisplay
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          const migrateTx = this.db.transaction(() => {
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
          this.addLog('INFO', `Migrated ${legacy.students.length} students into SQLite database.`);
        }
      } catch (err) {
        console.error('Failed to migrate from legacy JSON:', err);
      }
    }
  }

  // Students CRUD
  public getStudents(): Student[] {
    const rows = this.db.prepare('SELECT * FROM students ORDER BY student_name ASC').all() as any[];
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
    const r = this.db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
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
    const r = this.db.prepare('SELECT * FROM students WHERE LOWER(username) = LOWER(?)').get(username) as any;
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
    const r = this.db.prepare('SELECT * FROM students WHERE LOWER(register_no) = LOWER(?)').get(regNo) as any;
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

    this.db.prepare(`
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

    return {
      ...student,
      id,
      created_at,
      active,
    };
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    const existing = this.getStudentById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };

    this.db.prepare(`
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

    return merged;
  }

  public deleteStudent(id: string): boolean {
    const res = this.db.prepare('DELETE FROM students WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // Snapshots
  public getSnapshots(studentId?: string): Snapshot[] {
    let rows: any[];
    if (studentId) {
      rows = this.db.prepare('SELECT * FROM snapshots WHERE student_id = ? ORDER BY datetime(captured_at) ASC').all(studentId);
    } else {
      rows = this.db.prepare('SELECT * FROM snapshots ORDER BY datetime(captured_at) ASC').all();
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
    const r = this.db.prepare('SELECT * FROM snapshots WHERE student_id = ? ORDER BY datetime(captured_at) DESC LIMIT 1').get(studentId) as any;
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
    const rows = this.db.prepare('SELECT * FROM snapshots WHERE student_id = ? ORDER BY datetime(captured_at) DESC LIMIT 2').all(studentId) as any[];
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

    this.db.prepare(`
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

    return {
      ...snapshot,
      id,
    };
  }

  public deleteSnapshots(studentId?: string): void {
    if (studentId) {
      this.db.prepare('DELETE FROM snapshots WHERE student_id = ?').run(studentId);
    } else {
      this.db.prepare('DELETE FROM snapshots').run();
    }
  }

  // Recent Submissions
  public getSubmissions(studentId: string): RecentSubmission[] {
    const rows = this.db.prepare('SELECT * FROM recent_submissions WHERE student_id = ? ORDER BY id DESC').all(studentId) as any[];
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
    const insertSub = this.db.prepare(`
      INSERT OR REPLACE INTO recent_submissions (
        id, student_id, title, titleSlug, timestamp, language, statusDisplay
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM recent_submissions WHERE student_id = ?').run(studentId);
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
    const r = this.db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    if (!r) return DEFAULT_SETTINGS;
    return {
      inactivity_threshold_days: r.inactivity_threshold_days,
      academic_year: r.academic_year,
      fetch_delay_ms: r.fetch_delay_ms,
      api_timeout_seconds: r.api_timeout_seconds,
      tier_beginner_max: r.tier_beginner_max,
      tier_developing_max: r.tier_developing_max,
      tier_proficient_max: r.tier_proficient_max,
      weights: r.weights ? JSON.parse(r.weights) : DEFAULT_SETTINGS.weights,
    };
  }

  public updateSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };

    this.db.prepare(`
      UPDATE settings SET
        inactivity_threshold_days = ?,
        academic_year = ?,
        fetch_delay_ms = ?,
        api_timeout_seconds = ?,
        tier_beginner_max = ?,
        tier_developing_max = ?,
        tier_proficient_max = ?,
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
      JSON.stringify(updated.weights)
    );

    return updated;
  }

  // Reset / Clear
  public resetToDemo(): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM snapshots').run();
      this.db.prepare('DELETE FROM recent_submissions').run();
      this.db.prepare('DELETE FROM students').run();
      this.updateSettings(DEFAULT_SETTINGS);
    })();
  }

  // Logs
  public addLog(level: string, message: string): void {
    this.db.prepare(`
      INSERT INTO logs (timestamp, level, message) VALUES (?, ?, ?)
    `).run(new Date().toISOString(), level, message);

    // Keep latest 1000 logs
    this.db.prepare(`
      DELETE FROM logs WHERE id NOT IN (
        SELECT id FROM logs ORDER BY id DESC LIMIT 1000
      )
    `).run();
  }

  public getLogs(): { timestamp: string; level: string; message: string }[] {
    const rows = this.db.prepare('SELECT timestamp, level, message FROM logs ORDER BY id DESC LIMIT 500').all() as any[];
    return rows.reverse();
  }
}

export const db = new DatabaseService();
