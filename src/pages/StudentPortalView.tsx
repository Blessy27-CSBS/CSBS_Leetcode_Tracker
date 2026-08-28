import React, { useState, useEffect } from 'react';
import { 
  StudentDashboardData, 
  StudentWithLatest, 
  CuratedTrack, 
  CuratedProblem, 
  POTDItem, 
  RecentSubmission,
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
  Star
} from 'lucide-react';

interface StudentPortalViewProps {
  currentUser: AuthUser;
  onStudentUpdated?: () => void;
  allStudents?: StudentWithLatest[];
}

type StudentSubTab = 'overview' | 'potd_tracks' | 'leaderboard' | 'submissions' | 'profile';

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

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { student, potd, tracks, recentSubmissions, rankInSection, rankInDepartment, totalStudentsDepartment, totalStudentsSection } = dashboardData;
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
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-60 h-60 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/20">
                CSBS Year {student.year} • Sec {student.section}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-100 border border-blue-400/30">
                Reg: {student.register_no}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getTierColor(snapshot?.performance_tier)}`}>
                {snapshot?.performance_tier || 'Beginner'} Tier
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{student.student_name}</span>
            </h1>

            <div className="flex items-center gap-4 text-xs text-blue-100 flex-wrap">
              <a 
                href={`https://leetcode.com/${student.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-200 hover:text-white underline font-semibold transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>@{student.username}</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {student.mentor && (
                <span className="flex items-center gap-1 text-blue-200/80">
                  <User className="w-3.5 h-3.5" />
                  <span>Mentor: {student.mentor}</span>
                </span>
              )}

              <span className="flex items-center gap-1 text-blue-200/80">
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
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Fetch fresh data from LeetCode"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
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
          { id: 'potd_tracks', label: 'POTD & Practice Tracks', icon: Flame },
          { id: 'leaderboard', label: 'Class Leaderboard', icon: Trophy },
          { id: 'submissions', label: 'Recent Submissions', icon: BookOpen },
          { id: 'profile', label: 'My Account & Security', icon: KeyRound },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as StudentSubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Solved Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Solved</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
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
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Streak</span>
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
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Rank</span>
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
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Engagement</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
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

          {/* Difficulty Solved Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Solved Bars */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs space-y-5 lg:col-span-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>Problem Difficulty Distribution</span>
                <span className="text-xs text-slate-500 font-normal">Acceptance Rate: {snapshot?.acceptance_rate ? `${snapshot.acceptance_rate.toFixed(1)}%` : 'N/A'}</span>
              </h2>

              <div className="space-y-4">
                {/* Easy */}
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

                {/* Medium */}
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

                {/* Hard */}
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

              {/* Languages Used */}
              {snapshot?.languages && snapshot.languages.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-700">Languages Used in Solutions:</span>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.languages.map(lang => (
                      <span key={lang.languageName} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700">
                        {lang.languageName}: <strong>{lang.problemsSolved}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Problem of the Day Spotlight */}
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-xl p-6 border border-amber-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Flame className="w-3.5 h-3.5 text-orange-600" />
                    <span>Problem of the Day</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {potd.date}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {potd.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getDifficultyColor(potd.difficulty)}`}>
                      {potd.difficulty}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Topic: {potd.topic}
                    </span>
                  </div>
                </div>

                {potd.hint && (
                  <div className="bg-white/80 border border-amber-200 rounded-lg p-2.5 text-xs text-slate-600">
                    <strong>Faculty Hint:</strong> {potd.hint}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Your Status:</span>
                  {potd.isSolvedByMe ? (
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Solved</span>
                    </span>
                  ) : (
                    <span className="font-bold text-amber-700 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Pending Today</span>
                    </span>
                  )}
                </div>

                <a
                  href={potd.leetcodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Solve on LeetCode</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>

          </div>

          {/* Quick Practice Tracks Preview */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Curated Learning Tracks</h2>
                <p className="text-xs text-slate-500">Track your progress across Blind 75, NeetCode 150 & CSBS Core</p>
              </div>
              <button
                onClick={() => setActiveSubTab('potd_tracks')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Problems</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tracks.map(track => (
                <div 
                  key={track.id}
                  onClick={() => {
                    setSelectedTrackId(track.id);
                    setActiveSubTab('potd_tracks');
                  }}
                  className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{track.title}</span>
                    <span className="text-xs font-extrabold text-blue-600">{track.userCompletionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${track.userCompletionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>{track.userSolvedCount} / {track.totalProblems} Solved</span>
                    <span>{track.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: POTD & PRACTICE TRACKS */}
      {activeSubTab === 'potd_tracks' && (
        <div className="space-y-6">
          
          {/* POTD Detail Box */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-orange-500 text-white rounded-lg shadow-xs">
                  <Flame className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xs text-orange-700 font-bold uppercase tracking-wider">Today's Faculty Challenge</div>
                  <h2 className="text-lg font-black text-slate-900">{potd.title}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getDifficultyColor(potd.difficulty)}`}>
                  {potd.difficulty}
                </span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700">
                  Topic: {potd.topic}
                </span>
              </div>
            </div>

            {potd.hint && (
              <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs text-slate-700">
                <strong className="text-amber-800">Faculty Hint:</strong> {potd.hint}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">Status:</span>
                {potd.isSolvedByMe ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Solved on LeetCode</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Unsolved</span>
                  </span>
                )}
              </div>

              <a
                href={potd.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Solve on LeetCode</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Curated Track Explorer */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
            
            {/* Track Selector Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                {tracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      selectedTrack.id === track.id
                        ? 'bg-blue-600 text-white shadow-xs'
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

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                {(['ALL', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setTrackDifficultyFilter(diff)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      trackDifficultyFilter === diff
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                <div className="text-sm font-black text-blue-600">{selectedTrack.userCompletionRate}% Completed</div>
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
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Open problem on LeetCode"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: LEADERBOARD */}
      {activeSubTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Department Leaderboard</h2>
              <p className="text-xs text-slate-500">Track where you stand among your CSBS peers</p>
            </div>

            {/* Scope Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setLeaderboardScope('SECTION')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    leaderboardScope === 'SECTION'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Section ({student.section})
                </button>
                <button
                  onClick={() => setLeaderboardScope('DEPT')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    leaderboardScope === 'DEPT'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Entire Department
                </button>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={leaderboardSearch}
              onChange={(e) => setLeaderboardSearch(e.target.value)}
              placeholder="Search classmate name or register no..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Solved</th>
                  <th className="px-4 py-3">Streak</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaderboard.map((s, index) => {
                  const isMe = s.id === student.id;
                  const snap = s.latest_snapshot;
                  return (
                    <tr 
                      key={s.id}
                      className={`transition-colors ${
                        isMe ? 'bg-blue-50/80 font-semibold text-blue-950 ring-1 ring-blue-300' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="px-4 py-3 font-extrabold">
                        {index === 0 && <span className="text-amber-500 mr-1">🥇</span>}
                        {index === 1 && <span className="text-slate-400 mr-1">🥈</span>}
                        {index === 2 && <span className="text-amber-700 mr-1">🥉</span>}
                        #{index + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{s.student_name}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-blue-600 text-white uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {s.register_no} • @{s.username}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        Sec {s.section}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900">
                        {snap?.total_solved || 0}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {snap?.streak || 0}d
                      </td>

                      <td className="px-4 py-3 font-extrabold text-blue-600">
                        {snap?.engagement_score || 0}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTierColor(snap?.performance_tier)}`}>
                          {snap?.performance_tier || 'Beginner'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: RECENT SUBMISSIONS */}
      {activeSubTab === 'submissions' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Accepted Solutions</h2>
              <p className="text-xs text-slate-500">Live feed of your completed problems on LeetCode</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total Recorded: {recentSubmissions.length}
            </span>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No recent submissions found. Solve problems on LeetCode and click "Sync LeetCode Now" above!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{sub.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.titleSlug}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {sub.language && (
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700">
                        {sub.language}
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px]">
                      {sub.timestamp ? (
                        !isNaN(Number(sub.timestamp))
                          ? new Date(Number(sub.timestamp) * 1000).toLocaleDateString()
                          : sub.timestamp.split('T')[0]
                      ) : ''}
                    </span>
                    <a
                      href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Open problem"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MY ACCOUNT & SECURITY */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Account Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Student Profile Details</span>
            </h2>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Full Name</span>
                <span className="font-bold text-slate-900">{student.student_name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Register Number</span>
                <span className="font-mono font-bold text-slate-900">{student.register_no}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">College Mail ID (Username)</span>
                <span className="font-semibold text-slate-800">{student.email || `${student.register_no.toLowerCase()}@kgkite.ac.in`}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Section & Year</span>
                <span className="font-semibold text-slate-800">Section {student.section} • Year {student.year} ({student.batch})</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">LeetCode Handle</span>
                <span className="font-semibold text-blue-600">@{student.username}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Faculty Mentor</span>
                <span className="font-semibold text-slate-800">{student.mentor || 'Not Assigned'}</span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Change Portal Password</span>
            </h2>

            <p className="text-xs text-slate-500">
              Default password is your <strong>Register Number</strong>. You can update your portal password below.
            </p>

            {pwdMsg && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                pwdMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {pwdMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {pwdLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
