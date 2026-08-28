import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Target, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Sparkles, 
  Award, 
  BookOpen, 
  ChevronRight, 
  Users, 
  HelpCircle, 
  Edit3, 
  Plus, 
  Check, 
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  X
} from 'lucide-react';
import { POTDItem, CuratedTrack, CuratedProblem, StudentWithLatest } from '../types';
import { api } from '../services/api';

interface TracksViewProps {
  onOpenStudentDetail: (id: string) => void;
  students: StudentWithLatest[];
}

export const TracksView: React.FC<TracksViewProps> = ({ onOpenStudentDetail, students }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // POTD State
  const [potdData, setPotdData] = useState<{
    potd: POTDItem;
    departmentTotalStudents: number;
    completionRate: number;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isEditPOTDOpen, setIsEditPOTDOpen] = useState(false);
  const [customPOTDForm, setCustomPOTDForm] = useState({
    title: '',
    titleSlug: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    topic: 'DSA',
    acceptanceRate: 50,
    leetcodeUrl: '',
    hint: '',
  });

  // Curated Tracks State
  const [tracks, setTracks] = useState<CuratedTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('blind75');
  const [currentTrack, setCurrentTrack] = useState<CuratedTrack | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  // Countdown timer for next POTD (midnight)
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    loadData();
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedTrackId) {
      loadTrackDetails(selectedTrackId);
    }
  }, [selectedTrackId]);

  const updateCountdown = () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft(`${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [potdRes, tracksRes] = await Promise.all([
        api.getPOTD(),
        api.getTracks(),
      ]);

      setPotdData(potdRes);
      setTracks(tracksRes);
      if (tracksRes.length > 0 && !selectedTrackId) {
        setSelectedTrackId(tracksRes[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load tracks and POTD data.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackDetails = async (trackId: string) => {
    try {
      const details = await api.getTrackDetails(trackId);
      setCurrentTrack(details);
    } catch (err) {
      console.error('Failed to load track details:', err);
    }
  };

  const handleSaveCustomPOTD = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!customPOTDForm.title || !customPOTDForm.titleSlug) return;
      const res = await api.setPOTD(customPOTDForm);
      if (res.success) {
        setIsEditPOTDOpen(false);
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to set POTD');
    }
  };

  const potd = potdData?.potd;
  const problems = currentTrack?.problems || [];

  // Get distinct topics for filter
  const distinctTopics = Array.from(new Set(problems.map(p => p.topic))).filter(Boolean);

  // Filtered problems
  const filteredProblems = problems.filter(p => {
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'ALL' || p.topic === selectedTopic;
    const matchesDiff = selectedDifficulty === 'ALL' || p.difficulty === selectedDifficulty;
    return matchesSearch && matchesTopic && matchesDiff;
  });

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Easy</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Medium</span>;
      case 'Hard':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Hard</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">{difficulty}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/40 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" /> Daily Focus
            </span>
            <span className="text-xs text-slate-400">Department of CSBS</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Daily POTD & Curated Problem Tracks
          </h1>
          <p className="text-sm text-slate-300">
            Boost algorithmic problem solving with daily challenges and industry-standard preparation tracks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (potd) {
                setCustomPOTDForm({
                  title: potd.title,
                  titleSlug: potd.titleSlug,
                  difficulty: potd.difficulty,
                  topic: potd.topic,
                  acceptanceRate: potd.acceptanceRate || 50,
                  leetcodeUrl: potd.leetcodeUrl,
                  hint: potd.hint || '',
                });
              }
              setIsEditPOTDOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Set Custom POTD</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Hero: Problem of the Day Banner */}
      {potd && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main POTD Card */}
          <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Flame className="w-5 h-5 fill-orange-400" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-orange-400">Problem of the Day</span>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs font-medium text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Resets in:</span>
                  <span className="font-mono font-bold text-blue-400">{timeLeft}</span>
                </div>
              </div>

              {/* Title & Difficulty */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {potd.title}
                  </h2>
                  {getDifficultyBadge(potd.difficulty)}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {potd.topic}
                  </span>
                </div>

                {potd.acceptanceRate && (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>LeetCode Acceptance:</span>
                    <span className="font-semibold text-slate-200">{potd.acceptanceRate}%</span>
                  </div>
                )}
              </div>

              {/* Hint Box (Collapsible) */}
              {potd.hint && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'View Faculty Hint / Intuition'}</span>
                  </button>
                  {showHint && (
                    <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed animate-fade-in">
                      💡 {potd.hint}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="text-xs text-slate-400">
                Tracked automatically via student submission snapshots.
              </div>

              <a
                href={potd.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Solve on LeetCode</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Department Solved Roster */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Department Solvers Today</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {potdData?.completionRate || 0}% Solved
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${potdData?.completionRate || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{potd.solvedCount || 0} students completed</span>
                  <span>{potdData?.departmentTotalStudents || 0} total</span>
                </div>
              </div>

              {/* Solved Students List */}
              <div className="space-y-2 pt-2 max-h-52 overflow-y-auto pr-1">
                {potd.solvedStudents && potd.solvedStudents.length > 0 ? (
                  potd.solvedStudents.map((s, idx) => (
                    <div 
                      key={s.studentId || idx}
                      onClick={() => onOpenStudentDetail(s.studentId)}
                      className="p-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 rounded-xl flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{s.studentName}</div>
                          <div className="text-[10px] text-slate-400">{s.registerNo} • Sec {s.section}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">Completed</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                    <p>No verified submissions logged today yet.</p>
                    <p className="text-[10px] text-slate-600">Submissions sync automatically via LeetCode.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              Encourage students to maintain their daily streak!
            </div>
          </div>
        </div>
      )}

      {/* Curated Problem Tracks Section */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Curated Preparation Tracks</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured problem roadmaps designed for placements and competitive programming mastery.
            </p>
          </div>

          {/* Track Tabs */}
          <div className="flex flex-wrap gap-2">
            {tracks.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTrackId(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTrackId === t.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                }`}
              >
                <span>{t.title}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${selectedTrackId === t.id ? 'bg-blue-700 text-white' : 'bg-slate-900 text-slate-400'}`}>
                  {t.totalProblems}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Track Banner */}
        {currentTrack && (
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{currentTrack.title}</span>
              </h3>
              <p className="text-xs text-slate-400">{currentTrack.description}</p>
            </div>

            <div className="flex items-center gap-6 text-xs shrink-0">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Problems</span>
                <span className="font-bold text-white text-base">{currentTrack.totalProblems}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dept. Solved</span>
                <span className="font-bold text-emerald-400 text-base">{currentTrack.departmentCompletionRate || 0}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search problem title, topic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Topics ({distinctTopics.length})</option>
              {distinctTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Problem Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Problem</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4 text-center">Dept Solvers</th>
                <th className="py-3 px-4 text-right">Solve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProblems.length > 0 ? (
                filteredProblems.map((problem, idx) => (
                  <tr key={problem.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {problem.orderIndex || idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <a 
                        href={problem.leetcodeUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="hover:text-blue-400 transition flex items-center gap-1.5"
                      >
                        <span>{problem.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/40">
                        {problem.topic}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getDifficultyBadge(problem.difficulty)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold ${
                        (problem.solvedCount || 0) > 0 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {problem.solvedCount || 0} students
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={problem.leetcodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
                      >
                        <span>Practice</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No problems match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Set Custom POTD */}
      {isEditPOTDOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">Set Department Problem of the Day</h3>
              </div>
              <button
                onClick={() => setIsEditPOTDOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPOTD} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Problem Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subarray Sum Equals K"
                  value={customPOTDForm.title}
                  onChange={e => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setCustomPOTDForm({
                      ...customPOTDForm,
                      title,
                      titleSlug: slug,
                      leetcodeUrl: `https://leetcode.com/problems/${slug}/`
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty *</label>
                  <select
                    value={customPOTDForm.difficulty}
                    onChange={e => setCustomPOTDForm({ ...customPOTDForm, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Topic Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hashmap, Prefix Sum"
                    value={customPOTDForm.topic}
                    onChange={e => setCustomPOTDForm({ ...customPOTDForm, topic: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">LeetCode URL</label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/problems/..."
                  value={customPOTDForm.leetcodeUrl}
                  onChange={e => setCustomPOTDForm({ ...customPOTDForm, leetcodeUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Faculty Hint / Key Intuition (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Think about maintaining prefix sum frequency in a hash map."
                  value={customPOTDForm.hint}
                  onChange={e => setCustomPOTDForm({ ...customPOTDForm, hint: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditPOTDOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Publish POTD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
