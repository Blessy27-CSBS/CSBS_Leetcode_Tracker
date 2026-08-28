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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Easy</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
      case 'Hard':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Hard</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">{difficulty}</span>;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> Daily Focus
            </span>
            <span className="text-xs text-slate-500 font-medium">Department of CSBS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Daily POTD & Curated Problem Tracks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
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
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>Set Custom POTD</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <X className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero: Problem of the Day Banner */}
      {potd && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main POTD Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all">
            {/* Subtle background decorative glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-50/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Flame className="w-5 h-5 fill-orange-500" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-orange-600">Problem of the Day</span>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Resets in:</span>
                  <span className="font-mono font-bold text-blue-600">{timeLeft}</span>
                </div>
              </div>

              {/* Title & Difficulty */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {potd.title}
                  </h2>
                  {getDifficultyBadge(potd.difficulty)}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {potd.topic}
                  </span>
                </div>

                {potd.acceptanceRate && (
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>LeetCode Acceptance:</span>
                    <span className="font-bold text-slate-700">{potd.acceptanceRate}%</span>
                  </div>
                )}
              </div>

              {/* Hint Box (Collapsible) */}
              {potd.hint && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Hide Faculty Hint' : 'View Faculty Hint / Intuition'}</span>
                  </button>
                  {showHint && (
                    <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                      💡 {potd.hint}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-5 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 relative z-10">
              <div className="text-xs text-slate-500 font-medium">
                Tracked automatically via student submission snapshots.
              </div>

              <a
                href={potd.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Solve on LeetCode</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Department Solved Roster */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-800">Department Solvers Today</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {potdData?.completionRate || 0}% Solved
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${potdData?.completionRate || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
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
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{s.studentName}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{s.registerNo} • Sec {s.section}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                    <p className="font-medium">No verified submissions logged today yet.</p>
                    <p className="text-[10px] text-slate-400">Submissions sync automatically via LeetCode.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center font-medium">
              Encourage students to maintain their daily streak!
            </div>
          </div>
        </div>
      )}

      {/* Curated Problem Tracks Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Curated Preparation Tracks</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured problem roadmaps designed for placements and competitive programming mastery.
            </p>
          </div>

          {/* Track Tabs */}
          <div className="flex flex-wrap gap-2">
            {tracks.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTrackId(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedTrackId === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{t.title}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${selectedTrackId === t.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {t.totalProblems}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Track Banner */}
        {currentTrack && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>{currentTrack.title}</span>
              </h3>
              <p className="text-xs text-slate-500">{currentTrack.description}</p>
            </div>

            <div className="flex items-center gap-6 text-xs shrink-0">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Problems</span>
                <span className="font-bold text-slate-800 text-base">{currentTrack.totalProblems}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dept. Solved</span>
                <span className="font-bold text-emerald-600 text-base">{currentTrack.departmentCompletionRate || 0}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search problem title, topic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-2xs"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Topics ({distinctTopics.length})</option>
              {distinctTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Problem Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-slate-500 font-semibold">#</th>
                <th className="py-3 px-4 text-slate-700 font-semibold">Problem</th>
                <th className="py-3 px-4 text-slate-700 font-semibold">Topic</th>
                <th className="py-3 px-4 text-slate-700 font-semibold">Difficulty</th>
                <th className="py-3 px-4 text-center text-slate-700 font-semibold">Dept Solvers</th>
                <th className="py-3 px-4 text-right text-slate-700 font-semibold">Solve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredProblems.length > 0 ? (
                filteredProblems.map((problem, idx) => (
                  <tr key={problem.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {problem.orderIndex || idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <a 
                        href={problem.leetcodeUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{problem.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {problem.topic}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getDifficultyBadge(problem.difficulty)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold ${
                        (problem.solvedCount || 0) > 0 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {problem.solvedCount || 0} students
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={problem.leetcodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-slate-200 hover:border-blue-600"
                      >
                        <span>Practice</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-800 text-base">Set Department Problem of the Day</h3>
              </div>
              <button
                onClick={() => setIsEditPOTDOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPOTD} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Title *</label>
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
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty *</label>
                  <select
                    value={customPOTDForm.difficulty}
                    onChange={e => setCustomPOTDForm({ ...customPOTDForm, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hashmap, Prefix Sum"
                    value={customPOTDForm.topic}
                    onChange={e => setCustomPOTDForm({ ...customPOTDForm, topic: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LeetCode URL</label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/problems/..."
                  value={customPOTDForm.leetcodeUrl}
                  onChange={e => setCustomPOTDForm({ ...customPOTDForm, leetcodeUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Hint / Key Intuition (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Think about maintaining prefix sum frequency in a hash map."
                  value={customPOTDForm.hint}
                  onChange={e => setCustomPOTDForm({ ...customPOTDForm, hint: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditPOTDOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
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
