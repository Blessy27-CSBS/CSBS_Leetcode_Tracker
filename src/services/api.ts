import { 
  Student, 
  StudentWithLatest, 
  Snapshot, 
  DashboardSummary, 
  SectionStat, 
  BatchStat, 
  SystemSettings, 
  BatchFetchProgress,
  POTDItem,
  CuratedTrack,
  SchedulerStatus
} from '../types';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Dashboard
  async getDashboard(): Promise<{
    summary: DashboardSummary;
    sectionStats: SectionStat[];
    batchStats: BatchStat[];
    timeline: { date: string; total_problems: number; avg_problems: number; avg_rating: number }[];
    settings: SystemSettings;
  }> {
    const res = await fetch('/api/dashboard');
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
  },

  // Students
  async getStudents(filters?: {
    search?: string;
    section?: string;
    year?: string;
    batch?: string;
    tier?: string;
    activity?: string;
  }): Promise<StudentWithLatest[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }
    const res = await fetch(`/api/students?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  async getStudent(id: string): Promise<{
    student: StudentWithLatest;
    snapshots: Snapshot[];
    recent_submissions: any[];
  }> {
    const res = await fetch(`/api/students/${id}`);
    if (!res.ok) throw new Error('Failed to load student details');
    return res.json();
  },

  async createStudent(data: Partial<Student>): Promise<Student> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create student');
    return json;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update student');
    return json;
  },

  async deleteStudent(id: string): Promise<void> {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Failed to delete student');
    }
  },

  async importStudents(rows: any[]): Promise<{
    success: boolean;
    insertedCount: number;
    errorsCount: number;
    errors: { row: number; identifier: string; error: string }[];
  }> {
    const res = await fetch('/api/students/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to import students');
    return json;
  },

  // LeetCode Fetching
  async fetchStudentData(id: string): Promise<{
    success: boolean;
    status: string;
    error?: string;
    snapshot: Snapshot;
  }> {
    const res = await fetch(`/api/fetch/student/${id}`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok && !json.snapshot) throw new Error(json.error || 'Failed to fetch student data');
    return json;
  },

  async startBatchFetch(filters?: { section?: string; year?: string }): Promise<{ message: string; total: number }> {
    const res = await fetch('/api/fetch/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters || {}),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to start batch synchronization');
    return json;
  },

  async getBatchProgress(): Promise<BatchFetchProgress> {
    const res = await fetch('/api/fetch/progress');
    return res.json();
  },

  async cancelBatchFetch(): Promise<void> {
    await fetch('/api/fetch/cancel', { method: 'POST' });
  },

  // Leaderboard
  async getLeaderboard(sortBy: string = 'engagement_score', section?: string, year?: string): Promise<StudentWithLatest[]> {
    const params = new URLSearchParams({ sort_by: sortBy });
    if (section && section !== 'ALL') params.append('section', section);
    if (year && year !== 'ALL') params.append('year', year);
    const res = await fetch(`/api/leaderboard?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load leaderboard');
    return res.json();
  },

  // Sections
  async getSections(): Promise<{ sectionStats: SectionStat[]; batchStats: BatchStat[] }> {
    const res = await fetch('/api/sections');
    if (!res.ok) throw new Error('Failed to load section comparisons');
    return res.json();
  },

  // Intervention
  async getIntervention(): Promise<{
    threshold_days: number;
    count: number;
    students: StudentWithLatest[];
  }> {
    const res = await fetch('/api/intervention');
    if (!res.ok) throw new Error('Failed to load intervention list');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update settings');
    return json;
  },

  async resetToDemo(): Promise<void> {
    const res = await fetch('/api/settings/reset-demo', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo dataset');
  },

  async clearHistory(studentId?: string): Promise<void> {
    const res = await fetch('/api/settings/clear-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    });
    if (!res.ok) throw new Error('Failed to clear snapshots');
  },

  // Problem of the Day (POTD)
  async getPOTD(): Promise<{
    potd: POTDItem;
    departmentTotalStudents: number;
    completionRate: number;
  }> {
    const res = await fetch('/api/potd');
    if (!res.ok) throw new Error('Failed to load Problem of the Day');
    return res.json();
  },

  async setPOTD(data: Partial<POTDItem>): Promise<{ success: boolean; potd: POTDItem }> {
    const res = await fetch('/api/potd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to set Problem of the Day');
    return json;
  },

  // Curated Problem Tracks
  async getTracks(): Promise<CuratedTrack[]> {
    const res = await fetch('/api/tracks');
    if (!res.ok) throw new Error('Failed to load curated tracks');
    return res.json();
  },

  async getTrackDetails(trackId: string, studentId?: string): Promise<CuratedTrack> {
    const url = studentId ? `/api/tracks/${trackId}?studentId=${studentId}` : `/api/tracks/${trackId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load track details');
    return res.json();
  },

  // Scheduler Controls
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    const res = await fetch('/api/scheduler/status');
    if (!res.ok) throw new Error('Failed to fetch scheduler status');
    return res.json();
  },

  async updateSchedulerConfig(enabled: boolean, intervalHours: number): Promise<{ success: boolean; scheduler: SchedulerStatus }> {
    const res = await fetch('/api/scheduler/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, intervalHours }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update scheduler configuration');
    return json;
  },
};

