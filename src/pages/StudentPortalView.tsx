import React, { useState, useEffect } from 'react';
import { 
  StudentDashboardData, 
  StudentWithLatest, 
  CuratedTrack, 
  CuratedProblem, 
  POTDItem, 
  RecentSubmission,
  ContestItem,
  AuthUser
} from '../types';
import { api } from '../services/api';
import { 
  Trophy, 
  Flame, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Award, 
  ExternalLink, 
  RefreshCw, 
  Code2, 
  ChevronRight, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  User, 
  Lock, 
  KeyRound, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  Layers, 
  Compass, 
  Search,
  Filter,
  BarChart3,
  ShieldCheck,
  Star,
  Timer,
  Globe
} from 'lucide-react';
import { LeetCodeContestLeaderboard } from '../components/LeetCodeContestLeaderboard';

interface StudentPortalViewProps {
  currentUser: AuthUser;
  onStudentUpdated?: () => void;
  allStudents?: StudentWithLatest[];
}

type StudentSubTab = 'overview' | 'contests' | 'potd_tracks' | 'leaderboard' | 'submissions' | 'profile';

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({ 
  currentUser, 
  onStudentUpdated,
  allStudents = []
}) => {
  const [activeSubTab, setActiveSubTab] = useState<StudentSubTab>('overview');
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  // Selected Track for detail inspection
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [trackDifficultyFilter, setTrackDifficultyFilter] = useState<'ALL' | 'Easy' | 'Medium' | 'Hard'>('ALL');

  // Leaderboard filters
  const [leaderboardScope, setLeaderboardScope] = useState<'DEPT' | 'SECTION'>('SECTION');
  const [leaderboardSearch, setLeaderboardSearch] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Hints state
  const [showHintMap, setShowHintMap] = useState<Record<string, boolean>>({});

  // Countdown timer for next POTD / Contests
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Dashboard Data
  useEffect(() => {
    loadDashboard();
  }, [currentUser]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getStudentDashboard(currentUser.student_id);
      setDashboardData(data);
      if (data.tracks && data.tracks.length > 0 && !selectedTrackId) {
        setSelectedTrackId(data.tracks[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load your student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLeetCode = async () => {
    try {
      setSyncing(true);
      setSyncSuccessMsg('');
      setError('');
      const res = await api.syncMyLeetCode(currentUser.student_id);
      if (res.success) {
        setSyncSuccessMsg(`Synchronized! ${res.snapshot.total_solved} problems solved.`);
        await loadDashboard();
        if (onStudentUpdated) onStudentUpdated();
        setTimeout(() => setSyncSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Live synchronization failed. Please check LeetCode handle availability.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 4) {
      setPwdMsg({ text: 'Password must be at least 4 characters long.', type: 'error' });
      return;
    }

    try {
      setPwdLoading(true);
      setPwdMsg(null);
      await api.changePassword(newPassword, oldPassword);
      setPwdMsg({ text: 'Password updated successfully!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setPwdLoading(false);
    }
  };

  const formatCountdown = (startTimeStr: string) => {
    const diff = new Date(startTimeStr).getTime() - now;
    if (diff <= 0) return 'Contest Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
    return `${hours}h ${mins}m ${secs}s`;
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-purple-600" />
        <p className="text-sm font-semibold text-slate-600">Loading your LeetCode analytics...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-rose-50 border border-rose-200 rounded-xl text-center space-y-4 my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Unable to load dashboard</h2>
        <p className="text-xs text-rose-600">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { student, potdList = [], contests = [], tracks = [], recentSubmissions = [], rankInSection, rankInDepartment, totalStudentsDepartment, totalStudentsSection } = dashboardData;
  const snapshot = student.latest_snapshot;
  const selectedTrack = tracks.find(t => t.id === selectedTrackId) || tracks[0];

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Advanced': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Proficient': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Developing': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Hard': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const formatSubmissionDate = (ts: string | number) => {
    if (!ts) return 'Recent';
    const n = Number(ts);
    const d = !isNaN(n) && n > 0
      ? (n > 1e11 ? new Date(n) : new Date(n * 1000))
      : new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLanguageBadge = (lang: string) => {
    const l = (lang || '').toLowerCase().trim();
    if (l.includes('python')) return { name: 'Python 3', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (l.includes('cpp') || l === 'c++') return { name: 'C++', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (l.includes('java') && !l.includes('script')) return { name: 'Java', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (l.includes('javascript') || l === 'js') return { name: 'JavaScript', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    if (l.includes('typescript') || l === 'ts') return { name: 'TypeScript', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
    if (l === 'c') return { name: 'C', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    if (l.includes('sql')) return { name: 'MySQL', color: 'bg-sky-50 text-sky-800 border-sky-200' };
    if (l.includes('golang') || l === 'go') return { name: 'Go', color: 'bg-teal-50 text-teal-800 border-teal-200' };
    if (l.includes('rust')) return { name: 'Rust', color: 'bg-orange-50 text-orange-800 border-orange-200' };
    return { name: lang || 'Python 3', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  };

  // Filter leaderboard
  const studentList = allStudents.length > 0 ? allStudents : [student];
  const filteredLeaderboard = studentList
    .filter(s => {
      if (leaderboardScope === 'SECTION') {
        return s.section === student.section;
      }
      return true;
    })
    .filter(s => {
      if (!leaderboardSearch.trim()) return true;
      const q = leaderboardSearch.toLowerCase();
      return (
        s.student_name.toLowerCase().includes(q) ||
        s.register_no.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (b.latest_snapshot?.engagement_score || 0) - (a.latest_snapshot?.engagement_score || 0));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner / Student Hero Card */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-2xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-60 h-60 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/20">
                CSBS Year {student.year} • Sec {student.section}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/30 text-purple-100 border border-purple-400/30">
                Reg: {student.register_no}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getTierColor(snapshot?.performance_tier)}`}>
                {snapshot?.performance_tier || 'Beginner'} Tier
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{student.student_name}</span>
            </h1>

            <div className="flex items-center gap-4 text-xs text-purple-100 flex-wrap">
              <a 
                href={`https://leetcode.com/${student.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-purple-200 hover:text-white underline font-semibold transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>@{student.username}</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {student.mentor && (
                <span className="flex items-center gap-1 text-purple-200/80">
                  <User className="w-3.5 h-3.5" />
                  <span>Mentor: {student.mentor}</span>
                </span>
              )}

              <span className="flex items-center gap-1 text-purple-200/80">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Updated: {snapshot?.captured_at ? new Date(snapshot.captured_at).toLocaleDateString() : 'Never'}</span>
              </span>
            </div>
          </div>

          {/* Sync Button & Live Status */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <button
              onClick={handleSyncLeetCode}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-purple-900 font-bold text-xs rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Fetch fresh data from LeetCode"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-purple-600' : 'text-purple-600'}`} />
              <span>{syncing ? 'Syncing LeetCode...' : 'Sync LeetCode Now'}</span>
            </button>

            {syncSuccessMsg && (
              <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{syncSuccessMsg}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'My Dashboard', icon: BarChart3 },
          { id: 'contests', label: 'LeetCode Contests', icon: Trophy },
          { id: 'potd_tracks', label: 'POTD & Practice Tracks', icon: Flame },
          { id: 'leaderboard', label: 'Class Leaderboard', icon: Award },
          { id: 'submissions', label: 'Recent Submissions', icon: BookOpen },
          { id: 'profile', label: 'My Account & Security', icon: KeyRound },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as StudentSubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Solved Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Solved</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Code2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {snapshot?.total_solved || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">+{student.problems_added_month || 0}</span>
                  <span>in last 30 days</span>
                </div>
              </div>
            </div>

            {/* Daily Streak & Activity */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Streak</span>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{snapshot?.streak || 0}</span>
                  <span className="text-xs font-medium text-slate-500">days</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Total Active Days: <strong className="text-slate-700">{snapshot?.active_days || 0}</strong>
                </div>
              </div>
            </div>

            {/* Department Standings */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Rank</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  #{rankInSection}
                  <span className="text-xs font-normal text-slate-500 ml-1">of {totalStudentsSection} (Sec {student.section})</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Dept Rank: <strong className="text-slate-700">#{rankInDepartment}</strong> of {totalStudentsDepartment}
                </div>
              </div>
            </div>

            {/* Contest Rating & Score */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engagement</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {snapshot?.engagement_score || 0}
                  <span className="text-xs font-normal text-slate-500 ml-1">pts</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Contest Rating: <strong className="text-slate-700">{snapshot?.contest_rating ? Math.round(snapshot.contest_rating) : 'Unrated'}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* POTD Section Preview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                  <Flame className="w-4 h-4 fill-orange-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Today's Problem of the Day Challenges</h2>
              </div>
              <button
                onClick={() => setActiveSubTab('potd_tracks')}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Tracks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {potdList.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                No Problem of the Day challenge posted by faculty yet for today.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {potdList.map((p, idx) => (
                  <div key={p.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                          Challenge #{idx + 1}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getDifficultyColor(p.difficulty)}`}>
                          {p.difficulty}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900">{p.title}</h3>
                      <p className="text-[11px] text-slate-500">Topic: {p.topic}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      {p.isSolvedByMe ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Solved</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}

                      <a
                        href={p.leetcodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                      >
                        <span>Solve</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty Solved Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Problem Difficulty Breakdown</span>
              <span className="text-xs text-slate-500 font-normal">Acceptance Rate: {snapshot?.acceptance_rate ? `${snapshot.acceptance_rate.toFixed(1)}%` : 'N/A'}</span>
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-700">Easy</span>
                  <span className="text-slate-700">{snapshot?.easy || 0} Solved</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((snapshot?.easy || 0) / Math.max(1, snapshot?.total_solved || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-700">Medium</span>
                  <span className="text-slate-700">{snapshot?.medium || 0} Solved</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((snapshot?.medium || 0) / Math.max(1, snapshot?.total_solved || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-700">Hard</span>
                  <span className="text-slate-700">{snapshot?.hard || 0} Solved</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((snapshot?.hard || 0) / Math.max(1, snapshot?.total_solved || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Solved Problems Preview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Recently Solved Problems ({recentSubmissions.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Problems solved on LeetCode with programming language and completion date.
                </p>
              </div>

              <button
                onClick={() => setActiveSubTab('submissions')}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full List</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No solved problems logged yet. Click "Sync LeetCode Now" to retrieve your latest accepted submissions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentSubmissions.slice(0, 6).map((sub, idx) => {
                  const langBadge = getLanguageBadge(sub.language);
                  return (
                    <div
                      key={sub.id || idx}
                      className="p-3.5 bg-slate-50/70 hover:bg-purple-50/40 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <a
                          href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-xs text-slate-900 hover:text-purple-600 truncate flex items-center gap-1.5"
                        >
                          <span className="truncate">{sub.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        </a>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${langBadge.color}`}>
                            {langBadge.name}
                          </span>
                          <span>•</span>
                          <span>{formatSubmissionDate(sub.timestamp)}</span>
                        </div>
                      </div>

                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0">
                        {sub.statusDisplay || 'Accepted'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: LEETCODE CONTESTS */}
      {activeSubTab === 'contests' && (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-indigo-900/50 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-bold text-indigo-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>LeetCode Contests Arena</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Weekly & Department Contests</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Compete live against global programmers and CSBS classmates. Climb rating ladders and solve real interview questions.
              </p>
              <div className="pt-2">
                <a
                  href="https://leetcode.com/contest/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Open Official LeetCode Contest Page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Contests Grid */}
          {contests.length === 0 ? (
            <div className="p-10 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
              <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Contests Scheduled Yet</h3>
              <p className="text-xs text-slate-500">
                Faculty has not scheduled any upcoming department contests yet. Check back soon or visit leetcode.com/contest.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contests.map(c => {
                const countdown = formatCountdown(c.startTime);
                return (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-extrabold">
                          {c.type}
                        </span>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-amber-600" />
                          <span>{countdown}</span>
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{c.title}</h3>
                        {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(c.startTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.durationMinutes} mins</span>
                        </div>
                      </div>

                      {c.problems && c.problems.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">Problems</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {c.problems.map((p, pIdx) => (
                              <a
                                key={pIdx}
                                href={p.leetcodeUrl || c.contestUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-lg text-xs font-medium truncate flex items-center justify-between"
                              >
                                <span className="truncate">{p.title}</span>
                                <span className={`text-[10px] px-1 rounded font-bold border ${getDifficultyColor(p.difficulty)}`}>
                                  {p.difficulty}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <a
                      href={c.contestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Enter Contest on LeetCode</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 3: POTD & PRACTICE TRACKS */}
      {activeSubTab === 'potd_tracks' && (
        <div className="space-y-6">
          
          {/* Multiple POTD Cards */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <span>Today's Problem Challenges ({potdList.length})</span>
            </h2>

            {potdList.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                No POTD challenge posted yet for today.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {potdList.map((potd, idx) => (
                  <div key={potd.id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                          Challenge #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getDifficultyColor(potd.difficulty)}`}>
                            {potd.difficulty}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {potd.topic}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-slate-900">{potd.title}</h3>
                        {potd.acceptanceRate && (
                          <p className="text-xs text-slate-500 mt-0.5">LeetCode Acceptance: {potd.acceptanceRate}%</p>
                        )}
                      </div>

                      {potd.hint && (
                        <div>
                          <button
                            onClick={() => setShowHintMap({ ...showHintMap, [potd.id]: !showHintMap[potd.id] })}
                            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{showHintMap[potd.id] ? 'Hide Faculty Hint' : 'View Faculty Hint'}</span>
                          </button>
                          {showHintMap[potd.id] && (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                              💡 {potd.hint}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {potd.isSolvedByMe ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Solved on LeetCode</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Pending Today</span>
                        </span>
                      )}

                      <a
                        href={potd.leetcodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                      >
                        <span>Solve on LeetCode</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curated Track Explorer */}
          {tracks.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Custom Tracks Assigned Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Faculty has not created any custom problem tracks yet. Only problems and tracks assigned by faculty will appear here.
              </p>
            </div>
          ) : selectedTrack && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {tracks.map(track => (
                    <button
                      key={track.id}
                      onClick={() => setSelectedTrackId(track.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        selectedTrack.id === track.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{track.title}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                        {track.userSolvedCount}/{track.totalProblems}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  {(['ALL', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setTrackDifficultyFilter(diff)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        trackDifficultyFilter === diff ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Track Info Header */}
              <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedTrack.title}</h3>
                  <p className="text-xs text-slate-500">{selectedTrack.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-purple-600">{selectedTrack.userCompletionRate}% Completed</div>
                  <div className="text-xs text-slate-500">{selectedTrack.userSolvedCount} of {selectedTrack.totalProblems} problems solved</div>
                </div>
              </div>

              {/* Problems Checklist Table */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedTrack.problems
                  ?.filter(p => trackDifficultyFilter === 'ALL' || p.difficulty === trackDifficultyFilter)
                  .map((problem, idx) => (
                    <div 
                      key={problem.id}
                      className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                        problem.isSolvedBySelectedStudent ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 text-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </div>

                        {problem.isSolvedBySelectedStudent ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                        )}

                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {problem.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {problem.topic}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>

                        <a
                          href={problem.leetcodeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          title="Open problem on LeetCode"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 4: LEADERBOARD */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-4">
          <LeetCodeContestLeaderboard
            students={allStudents && allStudents.length > 0 ? allStudents : (dashboardData ? [{
              ...student,
              latest_snapshot: dashboardData.summary as any
            }] : [])}
            currentStudentId={student.id}
            isFaculty={false}
          />
        </div>
      )}

      {/* TAB 5: SUBMISSIONS */}
      {activeSubTab === 'submissions' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span>Recent LeetCode Submissions</span>
            </h2>
            <button
              onClick={handleSyncLeetCode}
              disabled={syncing}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Refresh Submissions</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Problem Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Language Used</th>
                  <th className="p-3 text-right">Solved Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No recent submissions recorded yet. Click "Sync LeetCode Now" to fetch your recent activity.
                    </td>
                  </tr>
                ) : (
                  recentSubmissions.map((sub, sIdx) => {
                    const langBadge = getLanguageBadge(sub.language);
                    return (
                      <tr key={sub.id || sIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">
                          <a
                            href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-purple-600 inline-flex items-center gap-1.5 transition-colors group"
                          >
                            <span>{sub.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                          </a>
                        </td>
                        <td className="p-3">
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{sub.statusDisplay || sub.status || 'Accepted'}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${langBadge.color} inline-flex items-center gap-1`}>
                            <Code2 className="w-3 h-3" />
                            <span>{langBadge.name}</span>
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-slate-600 text-xs">
                          {formatSubmissionDate(sub.timestamp)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PROFILE & PASSWORD CHANGE */}
      {activeSubTab === 'profile' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Account Security & Password</h2>
              <p className="text-xs text-slate-500">Update your student dashboard password.</p>
            </div>
          </div>

          {pwdMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              pwdMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1 font-bold">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 4 characters"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              {pwdLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
