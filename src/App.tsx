import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './pages/DashboardView';
import { ContestsView } from './pages/ContestsView';
import { TracksView } from './pages/TracksView';
import { StudentsView } from './pages/StudentsView';
import { LeaderboardView } from './pages/LeaderboardView';
import { ProgressView } from './pages/ProgressView';
import { SectionsView } from './pages/SectionsView';
import { InterventionView } from './pages/InterventionView';
import { ReportsView } from './pages/ReportsView';
import { SettingsView } from './pages/SettingsView';
import { LoginView } from './pages/LoginView';
import { StudentPortalView } from './pages/StudentPortalView';
import { QuestView } from './pages/QuestView';
import { FacultyLeetCode75View } from './pages/FacultyLeetCode75View';

import { StudentDetailModal } from './components/StudentDetailModal';
import { StudentFormModal } from './components/StudentFormModal';
import { ImportStudentsModal } from './components/ImportStudentsModal';
import { BatchFetchModal } from './components/BatchFetchModal';
import { SecurityNoticeToast } from './components/SecurityNoticeToast';
import { initSecurityShield } from './utils/securityShield';

import { api } from './services/api';
import { 
  DashboardSummary, 
  SectionStat, 
  BatchStat, 
  StudentWithLatest, 
  SystemSettings, 
  BatchFetchProgress,
  AuthUser
} from './types';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => api.getCachedUser());
  const [authChecking, setAuthChecking] = useState<boolean>(() => {
    const token = api.getToken();
    const cached = api.getCachedUser();
    return !!token && !cached;
  });

  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('csbs_active_tab') as NavTab;
      if (saved) return saved;
    }
    return 'dashboard';
  });

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('csbs_active_tab', tab);
    } catch (e) {}
  };

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // Hydrate initial App Data from localStorage cache if available
  const [summary, setSummary] = useState<DashboardSummary | null>(() => {
    try {
      const cached = localStorage.getItem('csbs_dashboard_cache');
      return cached ? JSON.parse(cached).summary || null : null;
    } catch (e) { return null; }
  });
  const [sectionStats, setSectionStats] = useState<SectionStat[]>(() => {
    try {
      const cached = localStorage.getItem('csbs_dashboard_cache');
      return cached ? JSON.parse(cached).sectionStats || [] : [];
    } catch (e) { return []; }
  });
  const [batchStats, setBatchStats] = useState<BatchStat[]>(() => {
    try {
      const cached = localStorage.getItem('csbs_dashboard_cache');
      return cached ? JSON.parse(cached).batchStats || [] : [];
    } catch (e) { return []; }
  });
  const [timeline, setTimeline] = useState<{ date: string; total_problems: number; avg_problems: number; avg_rating: number }[]>(() => {
    try {
      const cached = localStorage.getItem('csbs_dashboard_cache');
      return cached ? JSON.parse(cached).timeline || [] : [];
    } catch (e) { return []; }
  });
  const [students, setStudents] = useState<StudentWithLatest[]>(() => {
    try {
      const cached = localStorage.getItem('csbs_students_cache');
      return cached ? JSON.parse(cached) || [] : [];
    } catch (e) { return []; }
  });
  const [settings, setSettings] = useState<SystemSettings | null>(() => {
    try {
      const cached = localStorage.getItem('csbs_dashboard_cache');
      return cached ? JSON.parse(cached).settings || null : null;
    } catch (e) { return null; }
  });

  const [loading, setLoading] = useState<boolean>(() => !summary && !students.length);
  const [error, setError] = useState('');
  const [batchProgress, setBatchProgress] = useState<BatchFetchProgress | undefined>(undefined);

  // Modal states
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentWithLatest | null>(null);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Initialize client security shield (right-click block, shortcuts, DevTools detector, print deterrence)
  useEffect(() => {
    const teardown = initSecurityShield();
    return teardown;
  }, []);

  // Background verification of auth session on startup
  useEffect(() => {
    const verifySession = async () => {
      try {
        const token = api.getToken();
        if (token) {
          const res = await api.getMe();
          if (res && res.user) {
            setCurrentUser(res.user);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        api.clearToken();
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    verifySession();
  }, []);

  const [autoBatchSynced, setAutoBatchSynced] = useState(false);

  // Initial Load of application data when authenticated
  useEffect(() => {
    if (currentUser) {
      loadAllData();
      if (currentUser.role === 'staff' && !autoBatchSynced) {
        setAutoBatchSynced(true);
        api.startBatchFetch().then(() => {
          console.log('Automatic background batch sync started on faculty login.');
        }).catch(err => console.log('Auto batch fetch already running or ignored:', err));
      }
    }
  }, [currentUser]);

  // Poll batch progress (only for staff)
  useEffect(() => {
    if (currentUser?.role !== 'staff') return;

    let wasRunning = false;
    const checkProgress = async () => {
      try {
        const p = await api.getBatchProgress();
        setBatchProgress(p);
        if (wasRunning && !p.is_running) {
          loadAllData();
        }
        wasRunning = p.is_running;
      } catch (e) {
        // ignore
      }
    };
    checkProgress();
    const interval = setInterval(checkProgress, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadAllData = async () => {
    try {
      if (!summary && students.length === 0) setLoading(true);
      setError('');

      const [studentList, dashData] = await Promise.all([
        api.getStudents(),
        api.getDashboard()
      ]);

      setStudents(studentList);
      setSummary(dashData.summary);
      setSectionStats(dashData.sectionStats);
      setBatchStats(dashData.batchStats);
      setTimeline(dashData.timeline);
      setSettings(dashData.settings);
    } catch (err: any) {
      console.error(err);
      if (!summary) {
        setError(err.message || 'Failed to connect to backend service');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.clearToken();
    setCurrentUser(null);
    setActiveTab('dashboard');
    try {
      localStorage.removeItem('csbs_active_tab');
    } catch (e) {}
  };

  const handleOpenStudentDetail = (id: string) => {
    setSelectedStudentId(id);
    setIsDetailOpen(true);
  };

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditStudent = (s: StudentWithLatest) => {
    setStudentToEdit(s);
    setIsFormOpen(true);
  };

  // Render active view for faculty/staff
  const renderActiveView = () => {
    if (loading && !summary) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading Department Analytics...</p>
        </div>
      );
    }

    if (error && !summary) {
      return (
        <div className="p-6 max-w-lg mx-auto bg-rose-950/30 border border-rose-800/50 rounded-xl text-center space-y-4 my-12">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-100">Unable to Connect</h2>
          <p className="text-xs text-rose-300">{error}</p>
          <button
            onClick={loadAllData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    if (!summary || !settings) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            summary={summary}
            sectionStats={sectionStats}
            batchStats={batchStats}
            timeline={timeline}
            students={students}
            onOpenBatchSync={() => setIsBatchModalOpen(true)}
            onOpenAddStudent={handleOpenAddStudent}
            onSelectStudent={handleOpenStudentDetail}
            onNavigateTab={setActiveTab}
          />
        );

      case 'quest':
        return (
          <QuestView
            students={students}
            onSelectStudent={handleOpenStudentDetail}
          />
        );

      case 'leetcode75':
        return (
          <FacultyLeetCode75View
            students={students}
            onSelectStudent={handleOpenStudentDetail}
          />
        );

      case 'contests':
        return (
          <ContestsView
            isFaculty={currentUser?.role === 'staff'}
            students={students}
          />
        );

      case 'tracks':
        return (
          <TracksView
            students={students}
            onOpenStudentDetail={handleOpenStudentDetail}
          />
        );

      case 'students':
        return (
          <StudentsView
            students={students}
            onSelectStudent={handleOpenStudentDetail}
            onOpenAddStudent={handleOpenAddStudent}
            onOpenEditStudent={handleOpenEditStudent}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenBatchSync={() => setIsBatchModalOpen(true)}
            onDataRefresh={loadAllData}
          />
        );

      case 'leaderboard':
        return (
          <LeaderboardView
            students={students}
            onSelectStudent={handleOpenStudentDetail}
          />
        );

      case 'progress':
        return (
          <ProgressView
            students={students}
            onSelectStudent={handleOpenStudentDetail}
          />
        );

      case 'sections':
        return (
          <SectionsView
            sectionStats={sectionStats}
            batchStats={batchStats}
            students={students}
            onSelectStudent={handleOpenStudentDetail}
          />
        );

      case 'intervention':
        return (
          <InterventionView
            students={students}
            thresholdDays={settings.inactivity_threshold_days}
            onSelectStudent={handleOpenStudentDetail}
            onDataRefresh={loadAllData}
          />
        );

      case 'reports':
        return (
          <ReportsView
            summary={summary}
            sectionStats={sectionStats}
            students={students}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSettingsUpdated={loadAllData}
          />
        );

      default:
        return null;
    }
  };

  // 1. Loading session
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-semibold text-slate-300">Checking authentication...</p>
      </div>
    );
  }

  // 2. Unauthenticated -> Show Login View
  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // 3. Student Portal View
  if (currentUser.role === 'student') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
        <Header
          onOpenBatchSync={() => {}}
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />
        
        <StudentPortalView
          currentUser={currentUser}
          allStudents={students}
          onStudentUpdated={loadAllData}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // 4. Staff / Faculty Portal with Full Modules
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        onOpenBatchSync={() => setIsBatchModalOpen(true)}
        batchProgress={batchProgress}
        onRefreshCurrentView={loadAllData}
        isRefreshing={loading}
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      {/* Main Layout Area: Full-width docking, sidebar perfectly flush to the corner */}
      <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-3.5rem)]">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          interventionCount={summary?.inactive_students || 0}
          totalStudents={summary?.total_students || students.length}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Dynamic View Content Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 overflow-y-auto bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* MODALS */}
      <StudentDetailModal
        studentId={selectedStudentId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedStudentId(null);
        }}
        onDataUpdated={loadAllData}
      />

      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setStudentToEdit(null);
        }}
        onSaved={loadAllData}
        studentToEdit={studentToEdit}
      />

      <ImportStudentsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={loadAllData}
      />

      <BatchFetchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onCompleted={loadAllData}
      />

      <SecurityNoticeToast />
    </div>
  );
}

export default App;

