import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  XCircle,
  AlertCircle, 
  Flame, 
  ChevronRight, 
  Timer,
  Globe,
  Share2,
  Code2,
  BookmarkPlus,
  Users,
  Search,
  Download,
  UserCheck,
  UserX,
  Copy,
  Check,
  GraduationCap
} from 'lucide-react';
import { ContestItem, ContestProblemLink, StudentWithLatest } from '../types';
import { api } from '../services/api';

interface ContestsViewProps {
  isFaculty?: boolean;
  students?: StudentWithLatest[];
}

export const ContestsView: React.FC<ContestsViewProps> = ({ isFaculty = true, students = [] }) => {
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    titleSlug: string;
    type: 'Weekly Contest' | 'Biweekly Contest' | 'Department Contest' | 'Virtual Contest';
    targetCohort: string;
    contestUrl: string;
    startTime: string;
    durationMinutes: number;
    description: string;
    problems: ContestProblemLink[];
  }>({
    title: '',
    titleSlug: '',
    type: 'Weekly Contest',
    targetCohort: 'ALL',
    contestUrl: '',
    startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: 90,
    description: '',
    problems: [
      { title: '', difficulty: 'Easy', leetcodeUrl: '' },
      { title: '', difficulty: 'Medium', leetcodeUrl: '' },
      { title: '', difficulty: 'Medium', leetcodeUrl: '' },
      { title: '', difficulty: 'Hard', leetcodeUrl: '' },
    ],
  });

  // Roster Modal state
  const [rosterContest, setRosterContest] = useState<ContestItem | null>(null);
  const [rosterTab, setRosterTab] = useState<'solved' | 'unsolved'>('solved');
  const [rosterYearFilter, setRosterYearFilter] = useState('ALL');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterCopiedRegNo, setRosterCopiedRegNo] = useState<string | null>(null);

  // Countdown timer clock
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await api.getContests();
      setContests(list || []);
      if (rosterContest) {
        const updated = (list || []).find(c => c.id === rosterContest.id);
        if (updated) setRosterContest(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  const handleOpenAdd = () => {
    setEditingContestId(null);
    setFormData({
      title: '',
      titleSlug: '',
      type: 'Weekly Contest',
      targetCohort: 'ALL',
      contestUrl: 'https://leetcode.com/contest/',
      startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      durationMinutes: 90,
      description: '',
      problems: [
        { title: '', difficulty: 'Easy' as const, leetcodeUrl: '' },
        { title: '', difficulty: 'Medium' as const, leetcodeUrl: '' },
        { title: '', difficulty: 'Medium' as const, leetcodeUrl: '' },
        { title: '', difficulty: 'Hard' as const, leetcodeUrl: '' },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ContestItem) => {
    setEditingContestId(c.id);
    const existingProblems: ContestProblemLink[] = c.problems && c.problems.length > 0 ? c.problems : [
      { title: '', difficulty: 'Easy', leetcodeUrl: '' },
      { title: '', difficulty: 'Medium', leetcodeUrl: '' },
      { title: '', difficulty: 'Medium', leetcodeUrl: '' },
      { title: '', difficulty: 'Hard', leetcodeUrl: '' },
    ];

    setFormData({
      title: c.title,
      titleSlug: c.titleSlug,
      type: c.type,
      targetCohort: c.targetCohort || 'ALL',
      contestUrl: c.contestUrl,
      startTime: c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      durationMinutes: c.durationMinutes || 90,
      description: c.description || '',
      problems: existingProblems,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove contest "${title}"?`)) return;
    try {
      await api.deleteContest(id);
      loadContests();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contest');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanedProblems = (formData.problems || []).filter(p => p.title && p.title.trim() !== '');
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        problems: cleanedProblems,
      };

      if (editingContestId) {
        await api.updateContest(editingContestId, payload);
      } else {
        await api.createContest(payload);
      }

      setIsModalOpen(false);
      loadContests();
    } catch (err: any) {
      alert(err.message || 'Failed to save contest');
    }
  };


  const handleExportRosterCSV = () => {
    if (!rosterContest) return;
    const solved = rosterContest.solvedStudents || [];
    const unsolved = rosterContest.unsolvedStudents || [];

    const rows = [
      ['Register No', 'Student Name', 'Cohort Year', 'Section', 'LeetCode Username', 'Contest Status', 'Problems Solved Count', 'Solved Problems', 'Total LeetCode Solved', 'Contest Rating', 'Solve Time / Last Active']
    ];

    solved.forEach(s => {
      rows.push([
        s.registerNo,
        s.studentName,
        s.year,
        s.section,
        s.username,
        'SOLVED',
        String(s.problemsSolvedCount),
        (s.solvedProblems || []).join('; '),
        String(s.totalSolved || 0),
        String(s.contestRating || 0),
        s.solvedAt || ''
      ]);
    });

    unsolved.forEach(u => {
      rows.push([
        u.registerNo,
        u.studentName,
        u.year,
        u.section,
        u.username,
        'DID NOT SOLVE',
        '0',
        '',
        String(u.totalSolved || 0),
        String(u.contestRating || 0),
        u.lastActive || ''
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${rosterContest.title.replace(/[^a-z0-9]/gi, '_')}_Participation_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCountdown = (startTimeStr: string) => {
    const diff = new Date(startTimeStr).getTime() - now;
    if (diff <= 0) {
      return { text: 'LIVE NOW', isLive: true, isPast: false };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return { text: `${days}d ${hours}h left`, isLive: false, isPast: false };
    }
    return { 
      text: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, 
      isLive: false, 
      isPast: false 
    };
  };

  const upcomingContests = contests.filter(c => new Date(c.startTime).getTime() + (c.durationMinutes * 60000) >= now);
  const pastContests = isFaculty ? contests.filter(c => new Date(c.startTime).getTime() + (c.durationMinutes * 60000) < now) : [];

  const ContestCard = ({ c, countdown, isLive, isPast = false }: { c: ContestItem; countdown: string; isLive: boolean; isPast?: boolean }) => (
    <div className={`bg-white/90 backdrop-blur-md border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${isPast ? 'border-slate-200/60 opacity-80' : 'border-slate-200/80 hover:border-purple-300'}`}>
      <div className="space-y-3">
        {/* Type & Status Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${
              c.type === 'Department Contest'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}>
              <Trophy className="w-3.5 h-3.5" />
              <span>{c.type}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-blue-50 border-blue-200 text-blue-700">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>
                {c.targetCohort === 'II_III'
                  ? 'II & III Year'
                  : c.targetCohort === 'II'
                  ? 'II Year Only'
                  : c.targetCohort === 'III'
                  ? 'III Year Only'
                  : c.targetCohort === 'IV'
                  ? 'Final Year (IV)'
                  : 'All Batches'}
              </span>
            </span>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
            isPast
              ? 'bg-slate-50 text-slate-500 border-slate-200'
              : isLive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <Timer className="w-3.5 h-3.5" />
            <span>{isPast ? 'Contest Ended' : isLive ? 'LIVE NOW' : countdown}</span>
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base font-black text-slate-900">{c.title}</h3>
          {c.description && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{c.description}</p>
          )}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(c.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.durationMinutes}m)</span>
          </div>
        </div>

        {/* Participation Stats Summary */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-extrabold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{c.solvedCount || 0} Solved ({c.participationRate || 0}%)</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-rose-600">
            <XCircle className="w-3.5 h-3.5" />
            <span>{c.unsolvedCount || 0} Absent</span>
          </div>
        </div>

        {/* View Solved vs Unsolved Button for Faculty */}
        {isFaculty && (
          <button
            type="button"
            onClick={() => {
              setRosterContest(c);
              setRosterTab('solved');
            }}
            className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-purple-200/80"
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>View Solved ({c.solvedCount || 0}) vs Unsolved ({c.unsolvedCount || 0})</span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <a
          href={c.contestUrl}
          target="_blank"
          rel="noreferrer"
          className={`flex-1 py-2.5 px-4 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all ${
            isPast
              ? 'bg-slate-500 hover:bg-slate-600'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
          }`}
        >
          <span>{isPast ? 'View on LeetCode' : 'Enter Contest on LeetCode'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {isFaculty && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEdit(c)}
              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
              title="Edit Contest"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(c.id, c.title)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Contest"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-purple-600" /> Contest Arena
            </span>
            <span className="text-xs text-slate-400 font-semibold">LeetCode Integration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            LeetCode Weekly & Department Contests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Participate in real-time speed coding challenges. Direct single link to enter each contest.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isFaculty && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Contest</span>
            </button>
          )}

          <a
            href="https://leetcode.com/contest/"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Globe className="w-4 h-4 text-purple-600" />
            <span>LeetCode Official</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. ACTIVE & UPCOMING CONTESTS */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-600" />
          Active & Upcoming Contests ({upcomingContests.length})
        </h2>

        {upcomingContests.length === 0 ? (
          <div className="p-10 bg-white/80 backdrop-blur-md border border-dashed border-slate-300 rounded-2xl text-center space-y-3 shadow-xs">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Scheduled Contests Currently</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Faculty can post upcoming weekly or department contest links here.
            </p>
            {isFaculty && (
              <button onClick={handleOpenAdd} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer">
                <Plus className="w-4 h-4" /><span>Schedule a Contest</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {upcomingContests.map(c => {
              const { text: countdown, isLive } = formatCountdown(c.startTime);
              return <ContestCard key={c.id} c={c} countdown={countdown} isLive={isLive} isPast={false} />;
            })}
          </div>
        )}
      </div>

      {/* 2.1 CONCLUDED / PAST CONTESTS */}
      {pastContests.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200/60">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Concluded Contests ({pastContests.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {pastContests.map(c => {
              const { text: countdown, isLive } = formatCountdown(c.startTime);
              return <ContestCard key={c.id} c={c} countdown={countdown} isLive={isLive} isPast={true} />;
            })}
          </div>
        </div>
      )}

      {/* 3. ROSTER MODAL: SOLVED VS UNSOLVED STUDENTS */}
      {rosterContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {rosterContest.title}
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {rosterContest.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Participation & solve roster: {rosterContest.solvedCount || 0} Solved ({rosterContest.participationRate || 0}%) • {rosterContest.unsolvedCount || 0} Absent
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportRosterCSV}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export Roster CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRosterContest(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Filter Bar & Sub-Tabs */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRosterTab('solved')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                      rosterTab === 'solved'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Solved ({rosterContest.solvedCount || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRosterTab('unsolved')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                      rosterTab === 'unsolved'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Did Not Solve ({rosterContest.unsolvedCount || 0})</span>
                  </button>
                </div>

                {/* Cohort & Search Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'II', label: 'II Yr' },
                      { id: 'III', label: 'III Yr' },
                      { id: 'IV', label: 'Final Yr (IV)' }
                    ].map(yr => (
                      <button
                        key={yr.id}
                        type="button"
                        onClick={() => setRosterYearFilter(yr.id)}
                        className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                          rosterYearFilter === yr.id ? 'bg-white text-slate-900 font-extrabold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {yr.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={rosterSearch}
                      onChange={e => setRosterSearch(e.target.value)}
                      placeholder="Search student..."
                      className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Table Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {rosterTab === 'solved' ? (
                <div>
                  {((rosterContest.solvedStudents || []).filter(s => {
                    if (rosterYearFilter !== 'ALL' && s.year !== rosterYearFilter) return false;
                    if (rosterSearch.trim()) {
                      const q = rosterSearch.toLowerCase();
                      return s.studentName.toLowerCase().includes(q) || s.registerNo.toLowerCase().includes(q) || s.username.toLowerCase().includes(q);
                    }
                    return true;
                  })).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No solved students match the selected filters.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Student & Reg No</th>
                          <th className="py-2.5 px-3">Cohort</th>
                          <th className="py-2.5 px-3">LeetCode Handle</th>
                          <th className="py-2.5 px-3">Solves</th>
                          <th className="py-2.5 px-3">Solve Time</th>
                          <th className="py-2.5 px-3">Total Solved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(rosterContest.solvedStudents || []).filter(s => {
                          if (rosterYearFilter !== 'ALL' && s.year !== rosterYearFilter) return false;
                          if (rosterSearch.trim()) {
                            const q = rosterSearch.toLowerCase();
                            return s.studentName.toLowerCase().includes(q) || s.registerNo.toLowerCase().includes(q) || s.username.toLowerCase().includes(q);
                          }
                          return true;
                        }).map(s => (
                          <tr key={s.studentId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="font-extrabold text-slate-900">{s.studentName}</div>
                              <div className="font-mono text-[11px] text-slate-400">{s.registerNo}</div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-600">
                              {s.year} Year
                            </td>
                            <td className="py-2.5 px-3">
                              <a
                                href={`https://leetcode.com/${s.username}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono font-bold text-purple-600 hover:underline flex items-center gap-1"
                              >
                                <span>@{s.username}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {s.problemsSolvedCount > 0 ? `${s.problemsSolvedCount} Solved` : 'Attended'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {s.solvedAt ? new Date(s.solvedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {s.totalSolved || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div>
                  {((rosterContest.unsolvedStudents || []).filter(u => {
                    if (rosterYearFilter !== 'ALL' && u.year !== rosterYearFilter) return false;
                    if (rosterSearch.trim()) {
                      const q = rosterSearch.toLowerCase();
                      return u.studentName.toLowerCase().includes(q) || u.registerNo.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                    }
                    return true;
                  })).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No unsolved students found for current filter.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Student & Reg No</th>
                          <th className="py-2.5 px-3">Cohort</th>
                          <th className="py-2.5 px-3">LeetCode Handle</th>
                          <th className="py-2.5 px-3">Inactivity</th>
                          <th className="py-2.5 px-3">Total Solved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(rosterContest.unsolvedStudents || []).filter(u => {
                          if (rosterYearFilter !== 'ALL' && u.year !== rosterYearFilter) return false;
                          if (rosterSearch.trim()) {
                            const q = rosterSearch.toLowerCase();
                            return u.studentName.toLowerCase().includes(q) || u.registerNo.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                          }
                          return true;
                        }).map(u => (
                          <tr key={u.studentId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="font-extrabold text-slate-900">{u.studentName}</div>
                              <div className="font-mono text-[11px] text-slate-400">{u.registerNo}</div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-600">
                              {u.year} Year
                            </td>
                            <td className="py-2.5 px-3">
                              <a
                                href={`https://leetcode.com/${u.username}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono font-bold text-slate-600 hover:text-purple-600 hover:underline flex items-center gap-1"
                              >
                                <span>@{u.username}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[11px] font-bold ${
                                (u.daysInactive || 0) > 14 ? 'text-rose-600' : 'text-slate-600'
                              }`}>
                                {u.daysInactive !== undefined ? `${u.daysInactive}d inactive` : 'No activity'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {u.totalSolved || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 4. MODAL: SCHEDULE / ADD CONTEST */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingContestId ? 'Edit Contest' : 'Schedule Contest'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter direct contest link, schedule time, and map contest problems.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700 flex-1">
              {/* Title */}
              <div>
                <label className="block mb-1 font-bold">Contest Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Weekly Contest 438 or CSBS Speed Sprint"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Contest Link (Single Link) */}
              <div>
                <label className="block mb-1 font-bold">LeetCode Contest URL *</label>
                <input
                  type="url"
                  value={formData.contestUrl}
                  onChange={e => setFormData({ ...formData, contestUrl: e.target.value })}
                  placeholder="https://leetcode.com/contest/weekly-contest-438/"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Direct link where students will compete on LeetCode.</span>
              </div>

              {/* Target Audience / Eligible Years */}
              <div>
                <label className="block mb-1 font-bold text-slate-900 flex items-center justify-between">
                  <span>Target Audience / Eligible Years *</span>
                  <span className="text-[10px] text-purple-600 font-semibold">Cohort Visibility</span>
                </label>
                <select
                  value={formData.targetCohort || 'ALL'}
                  onChange={e => setFormData({ ...formData, targetCohort: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Batches (II, III & Final Year)</option>
                  <option value="II_III">Both II & III Years</option>
                  <option value="II">II Year Only</option>
                  <option value="III">III Year Only</option>
                  <option value="IV">Final Year (IV Year) Only</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Select which cohort of students can see this contest and are tracked in the participation roster.
                </span>
              </div>

              {/* Contest Type & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold">Contest Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Weekly Contest">Weekly Contest</option>
                    <option value="Biweekly Contest">Biweekly Contest</option>
                    <option value="Department Contest">Department Contest</option>
                    <option value="Virtual Contest">Virtual Contest</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Start Time */}
              <div>
                <label className="block mb-1 font-bold">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 font-bold">Instructions / Guidance (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Instructions or department goals for students..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              {/* Optional Contest Problems Mapping (Q1 - Q4) */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Contest Problems (Optional, Q1 - Q4)</label>
                  <span className="text-[10px] text-slate-400">Maps accepted solves automatically</span>
                </div>
                
                {formData.problems.map((prob, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-purple-700">Q{idx + 1}</span>
                      <select
                        value={prob.difficulty}
                        onChange={e => {
                          const copy = [...formData.problems];
                          copy[idx].difficulty = e.target.value as any;
                          setFormData({ ...formData, problems: copy });
                        }}
                        className="text-[11px] font-bold p-1 bg-white border border-slate-200 rounded-lg text-slate-700"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={prob.title}
                        onChange={e => {
                          const copy = [...formData.problems];
                          copy[idx].title = e.target.value;
                          setFormData({ ...formData, problems: copy });
                        }}
                        placeholder={`e.g. Q${idx + 1}: Two Sum`}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                      <input
                        type="url"
                        value={prob.leetcodeUrl}
                        onChange={e => {
                          const copy = [...formData.problems];
                          copy[idx].leetcodeUrl = e.target.value;
                          setFormData({ ...formData, problems: copy });
                        }}
                        placeholder="LeetCode problem URL"
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingContestId ? 'Save Changes' : 'Publish Contest'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
