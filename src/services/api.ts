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
  CuratedProblem,
  SchedulerStatus,
  AuthUser,
  AuthSession,
  StudentDashboardData,
  ContestItem,
  StudentQuestProgress,
  FacultyQuestSummary,
  StudentLeetCode75Progress,
  FacultyLeetCode75Summary,
  LeetCode75Category
} from '../types';

const TOKEN_KEY = 'csbs_auth_token';
const USER_KEY = 'csbs_auth_user';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setCachedUser(user: AuthUser) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {}
  },

  getCachedUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async login(credentials: {
    identifier?: string;
    username?: string;
    password?: string;
    role?: 'staff' | 'student';
  }): Promise<AuthSession> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    if (json.token) {
      this.setToken(json.token);
    }
    if (json.user) {
      this.setCachedUser(json.user);
    }
    if (json.studentDashboard && json.user?.student_id) {
      try {
        localStorage.setItem(`csbs_student_dash_${json.user.student_id}`, JSON.stringify(json.studentDashboard));
      } catch (e) {}
    }
    if (json.facultyDashboard) {
      try {
        if (json.facultyDashboard.dashData) {
          localStorage.setItem('csbs_dashboard_cache', JSON.stringify(json.facultyDashboard.dashData));
        }
        if (json.facultyDashboard.students) {
          localStorage.setItem('csbs_students_cache', JSON.stringify(json.facultyDashboard.students));
        }
      } catch (e) {}
    }
    return json;
  },

  async getMe(): Promise<{ user: AuthUser }> {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch session');
    if (json.user) {
      this.setCachedUser(json.user);
    }
    return json;
  },

  async changePassword(newPassword: string, oldPassword?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ newPassword, oldPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to change password');
    return json;
  },

  // Student Portal
  async getStudentDashboard(studentId?: string): Promise<StudentDashboardData> {
    const user = this.getCachedUser();
    const resolvedId = studentId || user?.student_id || (user?.id?.startsWith('usr_s_') ? user.id.replace('usr_', '') : undefined) || user?.username;
    const cacheKey = `csbs_student_dash_${resolvedId || 'me'}`;
    const url = resolvedId ? `/api/student/dashboard?studentId=${encodeURIComponent(resolvedId)}` : '/api/student/dashboard';
    try {
      const res = await fetch(url, {
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.student) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(json));
          } catch (e) {}
        }
        return json;
      }
      const errJson = await res.json().catch(() => null);
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
    } catch (err: any) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
      throw err;
    }
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    throw new Error('Failed to load student dashboard');
  },

  async syncMyLeetCode(studentId?: string): Promise<{ success: boolean; snapshot: Snapshot; student: StudentWithLatest }> {
    const res = await fetch('/api/student/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ studentId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to sync LeetCode profile');
    return json;
  },

  // Quest API
  async getQuestStudentProgress(studentId?: string): Promise<{ questProgress: StudentQuestProgress }> {
    const url = studentId ? `/api/quest/student?studentId=${studentId}` : '/api/quest/student';
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load quest progress');
    return json;
  },

  async getFacultyQuestSummary(): Promise<FacultyQuestSummary> {
    const res = await fetch('/api/quest/faculty-overview', {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load faculty quest summary');
    return json;
  },

  // LeetCode 75 API
  async getLeetCode75StudentProgress(studentId?: string): Promise<{ leetcode75Progress: StudentLeetCode75Progress; categories: LeetCode75Category[] }> {
    const url = studentId ? `/api/leetcode75/student?studentId=${studentId}` : '/api/leetcode75/student';
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load LeetCode 75 progress');
    return json;
  },

  async getFacultyLeetCode75Summary(): Promise<FacultyLeetCode75Summary> {
    const res = await fetch('/api/leetcode75/faculty-overview', {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load faculty LeetCode 75 summary');
    return json;
  },

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
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data && data.summary) {
          try {
            localStorage.setItem('csbs_dashboard_cache', JSON.stringify(data));
          } catch (e) {}
        }
        return data;
      }
    } catch (err) {
      const cached = localStorage.getItem('csbs_dashboard_cache');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    const cached = localStorage.getItem('csbs_dashboard_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    throw new Error('Failed to load dashboard data');
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

    try {
      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const data: StudentWithLatest[] = await res.json();
        // If server returns students, cache them in localStorage
        if (Array.isArray(data) && data.length > 0 && !filters?.search && (!filters?.section || filters.section === 'ALL')) {
          try {
            localStorage.setItem('csbs_students_cache', JSON.stringify(data));
          } catch (e) {}
          return data;
        } else if (Array.isArray(data) && data.length === 0) {
          // Server returned empty list (e.g. Vercel cold-start). Check client localStorage cache!
          const cached = localStorage.getItem('csbs_students_cache');
          if (cached) {
            try {
              const parsed: StudentWithLatest[] = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Asynchronously re-seed Vercel backend
                this.syncCache(parsed).catch(() => {});
                return parsed;
              }
            } catch (e) {}
          }
        }
        return data;
      }
    } catch (err) {
      // Network error or offline - fallback to localStorage cache
      const cached = localStorage.getItem('csbs_students_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return [];
  },

  async syncCache(students: StudentWithLatest[]): Promise<{ success: boolean; count: number }> {
    try {
      const res = await fetch('/api/cache/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, count: 0 };
    }
  },

  async getStudent(id: string): Promise<{
    student: StudentWithLatest;
    snapshots: Snapshot[];
    recent_submissions: any[];
  }> {
    let studentData: any = null;
    try {
      const res = await fetch(`/api/students/${id}`);
      if (res.ok) {
        studentData = await res.json();
      }
    } catch (e) {
      console.warn('API getStudent failed, trying local cache', e);
    }

    if (!studentData || !studentData.student) {
      const cachedStr = localStorage.getItem('csbs_students_cache');
      if (cachedStr) {
        try {
          const list: StudentWithLatest[] = JSON.parse(cachedStr);
          const found = list.find(s => s.id === id || s.register_no === id);
          if (found) {
            studentData = {
              student: found,
              snapshots: found.latest_snapshot ? [found.latest_snapshot] : [],
              recent_submissions: []
            };
          }
        } catch (err) {}
      }
    }

    if (!studentData || !studentData.student) {
      throw new Error('Student not found');
    }

    const s = studentData.student;
    let snap = s.latest_snapshot || (studentData.snapshots && studentData.snapshots[studentData.snapshots.length - 1]);

    if (!snap) {
      snap = {
        id: 'snap-' + (s.id || 'default'),
        student_id: s.id || id,
        captured_at: new Date().toISOString(),
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
        engagement_score: s.engagement_score || 0,
        performance_tier: s.performance_tier || (s.total_solved >= 200 ? 'Advanced' : s.total_solved >= 100 ? 'Proficient' : s.total_solved >= 50 ? 'Developing' : 'Beginner'),
        activity_status: s.activity_status || 'Active',
        status: 'success'
      };
      studentData.student.latest_snapshot = snap;
      if (!studentData.snapshots || studentData.snapshots.length === 0) {
        studentData.snapshots = [snap];
      }
    }

    return studentData;
  },

  async createStudent(data: Partial<Student>): Promise<Student> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create student');
    return json;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update student');
    return json;
  },

  async deleteStudent(id: string): Promise<void> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Failed to delete student');
    }
  },

  async importStudents(rows: any[]): Promise<{
    success: boolean;
    insertedCount: number;
    updatedCount?: number;
    errorsCount: number;
    errors: { row: number; identifier: string; error: string }[];
    inserted?: Student[];
    updated?: Student[];
    autoFetchStarted?: boolean;
    autoFetchCount?: number;
  }> {
    const res = await fetch('/api/students/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
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
    const res = await fetch(`/api/fetch/student/${id}`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok && !json.snapshot) throw new Error(json.error || 'Failed to fetch student data');
    return json;
  },

  async startBatchFetch(filters?: { section?: string; year?: string }): Promise<{ message: string; total: number }> {
    const res = await fetch('/api/fetch/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(filters || {}),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to start batch synchronization');
    return json;
  },

  async cancelBatchFetch(): Promise<void> {
    await fetch('/api/fetch/cancel', {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
  },

  async getBatchProgress(): Promise<BatchFetchProgress> {
    const res = await fetch('/api/fetch/progress');
    return res.json();
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
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update settings');
    return json;
  },

  async resetToDemo(): Promise<void> {
    const res = await fetch('/api/settings/reset-demo', {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to reset demo dataset');
  },

  async clearHistory(studentId?: string): Promise<void> {
    const res = await fetch('/api/settings/clear-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ studentId }),
    });
    if (!res.ok) throw new Error('Failed to clear snapshots');
  },

  // Problem of the Day (POTD)
  async getPOTD(date?: string): Promise<{
    potd: POTDItem | null;
    potdList: POTDItem[];
    departmentTotalStudents: number;
    completionRate: number;
  }> {
    const url = date ? `/api/potd?date=${date}` : '/api/potd';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load Problem of the Day');
    return res.json();
  },

  async setPOTD(data: Partial<POTDItem>): Promise<{ success: boolean; potd: POTDItem }> {
    const res = await fetch('/api/potd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to set Problem of the Day');
    return json;
  },

  async updatePOTD(id: string, data: Partial<POTDItem>): Promise<{ success: boolean; potd: POTDItem }> {
    const res = await fetch(`/api/potd/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update POTD');
    return json;
  },

  async deletePOTD(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/potd/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete POTD');
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

  async createTrack(data: Partial<CuratedTrack>): Promise<{ success: boolean; track: CuratedTrack }> {
    const res = await fetch('/api/tracks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create track');
    return json;
  },

  async deleteTrack(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/tracks/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async addProblemToTrack(trackId: string, data: Partial<CuratedProblem>): Promise<{ success: boolean; problem: CuratedProblem }> {
    const res = await fetch(`/api/tracks/${trackId}/problems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add problem to track');
    return json;
  },

  async deleteProblemFromTrack(problemId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/tracks/problems/${problemId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
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
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ enabled, intervalHours }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update scheduler configuration');
    return json;
  },

  // Contest Management Endpoints
  async getContests(): Promise<ContestItem[]> {
    const res = await fetch('/api/contests', {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch contests');
    return json;
  },

  async getContestById(id: string): Promise<ContestItem> {
    const res = await fetch(`/api/contests/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch contest');
    return json;
  },

  async createContest(data: Partial<ContestItem>): Promise<{ success: boolean; contest: ContestItem }> {
    const res = await fetch('/api/contests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create contest');
    return json;
  },

  async updateContest(id: string, data: Partial<ContestItem>): Promise<{ success: boolean; contest: ContestItem }> {
    const res = await fetch(`/api/contests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update contest');
    return json;
  },

  async deleteContest(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/contests/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete contest');
    return json;
  },
};


