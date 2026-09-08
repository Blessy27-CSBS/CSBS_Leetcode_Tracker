-- ====================================================================
-- CSBS LEETCODE TRACKER - SUPABASE CLOUD DATABASE SCHEMA MIGRATION
-- Copy and run this script in your Supabase SQL Editor (SQL Editor -> New Query)
-- ====================================================================

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
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
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_students_regno ON public.students(register_no);
CREATE INDEX IF NOT EXISTS idx_students_username ON public.students(username);

-- 2. Snapshots Table
CREATE TABLE IF NOT EXISTS public.snapshots (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_solved INTEGER NOT NULL DEFAULT 0,
  easy INTEGER NOT NULL DEFAULT 0,
  medium INTEGER NOT NULL DEFAULT 0,
  hard INTEGER NOT NULL DEFAULT 0,
  acceptance_rate NUMERIC NOT NULL DEFAULT 0,
  ranking INTEGER NOT NULL DEFAULT 0,
  reputation INTEGER NOT NULL DEFAULT 0,
  contest_rating INTEGER NOT NULL DEFAULT 0,
  contest_rank INTEGER NOT NULL DEFAULT 0,
  contests_attended INTEGER NOT NULL DEFAULT 0,
  top_percentage NUMERIC NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  active_days INTEGER NOT NULL DEFAULT 0,
  last_active TEXT,
  languages JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  badges JSONB DEFAULT '[]'::jsonb,
  submission_calendar JSONB DEFAULT '{}'::jsonb,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  performance_tier TEXT NOT NULL DEFAULT 'Beginner',
  activity_status TEXT NOT NULL DEFAULT 'No Data',
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_snapshots_student_id ON public.snapshots(student_id);

-- 3. Recent Submissions Table
CREATE TABLE IF NOT EXISTS public.recent_submissions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "titleSlug" TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  language TEXT NOT NULL,
  "statusDisplay" TEXT NOT NULL
);

-- 4. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  inactivity_threshold_days INTEGER NOT NULL DEFAULT 14,
  academic_year TEXT NOT NULL DEFAULT '2024-2025',
  fetch_delay_ms INTEGER NOT NULL DEFAULT 1500,
  api_timeout_seconds INTEGER NOT NULL DEFAULT 25,
  tier_beginner_max INTEGER NOT NULL DEFAULT 49,
  tier_developing_max INTEGER NOT NULL DEFAULT 99,
  tier_proficient_max INTEGER NOT NULL DEFAULT 199,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_sync_interval_hours INTEGER NOT NULL DEFAULT 12,
  weights JSONB NOT NULL DEFAULT '{"total_solved":25,"medium_solved":20,"hard_solved":15,"recent_activity":15,"streak":10,"contest_participation":10,"improvement_rate":5}'::jsonb
);

-- Insert Default Settings row
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 5. Problem of the Day Items Table
CREATE TABLE IF NOT EXISTS public.potd_items (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  "titleSlug" TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  topic TEXT NOT NULL,
  "acceptanceRate" NUMERIC,
  "leetcodeUrl" TEXT NOT NULL,
  hint TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Curated Tracks Table
CREATE TABLE IF NOT EXISTS public.curated_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  "totalProblems" INTEGER NOT NULL DEFAULT 0
);

-- 7. Curated Problems Table
CREATE TABLE IF NOT EXISTS public.curated_problems (
  id TEXT PRIMARY KEY,
  "trackId" TEXT NOT NULL REFERENCES public.curated_tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "titleSlug" TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  topic TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "leetcodeUrl" TEXT NOT NULL
);

-- 8. Contests Table
CREATE TABLE IF NOT EXISTS public.contests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "titleSlug" TEXT NOT NULL,
  type TEXT NOT NULL,
  "contestUrl" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL DEFAULT 90,
  description TEXT,
  problems JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'UPCOMING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Logs Table
CREATE TABLE IF NOT EXISTS public.logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL,
  message TEXT NOT NULL
);

-- 10. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) and allow Public Read/Write Access
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.potd_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read/write on students" ON public.students;
DROP POLICY IF EXISTS "Allow anon read/write on snapshots" ON public.snapshots;
DROP POLICY IF EXISTS "Allow anon read/write on recent_submissions" ON public.recent_submissions;
DROP POLICY IF EXISTS "Allow anon read/write on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow anon read/write on potd_items" ON public.potd_items;
DROP POLICY IF EXISTS "Allow anon read/write on curated_tracks" ON public.curated_tracks;
DROP POLICY IF EXISTS "Allow anon read/write on curated_problems" ON public.curated_problems;
DROP POLICY IF EXISTS "Allow anon read/write on contests" ON public.contests;
DROP POLICY IF EXISTS "Allow anon read/write on logs" ON public.logs;
DROP POLICY IF EXISTS "Allow anon read/write on users" ON public.users;

CREATE POLICY "Allow anon read/write on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on snapshots" ON public.snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on recent_submissions" ON public.recent_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on potd_items" ON public.potd_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on curated_tracks" ON public.curated_tracks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on curated_problems" ON public.curated_problems FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on contests" ON public.contests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on logs" ON public.logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
