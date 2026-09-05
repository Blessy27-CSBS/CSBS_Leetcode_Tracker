import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  Calendar, 
  ExternalLink, 
  ArrowUpRight, 
  CheckCircle2, 
  Search, 
  BookOpen, 
  Users, 
  HelpCircle,
  Edit3,
  X,
  Plus,
  Trash2,
  Edit,
  FolderPlus,
  Link as LinkIcon,
  Code2
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
  
  // POTD State (supports multiple problems per day)
  const [potdList, setPotdList] = useState<POTDItem[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [deptTotalStudents, setDeptTotalStudents] = useState(0);
  const [showHintMap, setShowHintMap] = useState<Record<string, boolean>>({});

  // POTD Modal State
  const [isPOTDModalOpen, setIsPOTDModalOpen] = useState(false);
  const [editingPOTDId, setEditingPOTDId] = useState<string | null>(null);
  const [potdForm, setPotdForm] = useState({
    title: '',
    titleSlug: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    topic: 'DSA',
    acceptanceRate: 50,
    leetcodeUrl: '',
    hint: '',
    orderIndex: 0,
  });

  // Curated Tracks State
  const [tracks, setTracks] = useState<CuratedTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<CuratedTrack | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  // Track & Problem Modal State
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackForm, setTrackForm] = useState({
    title: '',
    description: '',
    category: 'custom' as 'custom' | 'blind75' | 'top150' | 'csbs_core',
    icon: 'Code',
  });

  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [problemForm, setProblemForm] = useState({
    title: '',
    titleSlug: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    topic: 'General',
    leetcodeUrl: '',
    orderIndex: 1,
  });

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

      setPotdList(potdRes.potdList || (potdRes.potd ? [potdRes.potd] : []));
      setCompletionRate(potdRes.completionRate || 0);
      setDeptTotalStudents(potdRes.departmentTotalStudents || 0);

      setTracks(tracksRes);
      if (tracksRes.length > 0) {
        if (!selectedTrackId || !tracksRes.some(t => t.id === selectedTrackId)) {
          setSelectedTrackId(tracksRes[0].id);
        }
      } else {
        setSelectedTrackId('');
        setCurrentTrack(null);
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

  // --- POTD Handlers ---
  const handleOpenAddPOTD = () => {
    setEditingPOTDId(null);
    setPotdForm({
      title: '',
      titleSlug: '',
      difficulty: 'Medium',
      topic: 'DSA',
      acceptanceRate: 50,
      leetcodeUrl: '',
      hint: '',
      orderIndex: potdList.length + 1,
    });
    setIsPOTDModalOpen(true);
  };

  const handleOpenEditPOTD = (p: POTDItem) => {
    setEditingPOTDId(p.id);
    setPotdForm({
      title: p.title,
      titleSlug: p.titleSlug,
      difficulty: p.difficulty,
      topic: p.topic,
      acceptanceRate: p.acceptanceRate || 50,
      leetcodeUrl: p.leetcodeUrl,
      hint: p.hint || '',
      orderIndex: p.orderIndex || 0,
    });
    setIsPOTDModalOpen(true);
  };

  const handlePOTDUrlChange = (url: string) => {
    const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
    if (match && match[1]) {
      const slug = match[1];
      const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setPotdForm(prev => ({
        ...prev,
        leetcodeUrl: url,
        titleSlug: slug,
        title: prev.title || title,
      }));
    } else {
      setPotdForm(prev => ({ ...prev, leetcodeUrl: url }));
    }
  };

  const handleSavePOTD = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPOTDId) {
        await api.updatePOTD(editingPOTDId, potdForm);
      } else {
        await api.setPOTD(potdForm);
      }
      setIsPOTDModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save Problem of the Day');
    }
  };

  const handleDeletePOTD = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove POTD "${title}"?`)) return;
    try {
      await api.deletePOTD(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete POTD item');
    }
  };

  // --- Track Handlers ---
  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createTrack(trackForm);
      setIsTrackModalOpen(false);
      await loadData();
      if (res.track) {
        setSelectedTrackId(res.track.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create track');
    }
  };

  const handleDeleteTrack = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete track "${title}" and all its problems?`)) return;
    try {
      await api.deleteTrack(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete track');
    }
  };

  // --- Problem Handlers ---
  const handleProblemUrlChange = (url: string) => {
    const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
    if (match && match[1]) {
      const slug = match[1];
      const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setProblemForm(prev => ({
        ...prev,
        leetcodeUrl: url,
        titleSlug: slug,
        title: prev.title || title,
      }));
    } else {
      setProblemForm(prev => ({ ...prev, leetcodeUrl: url }));
    }
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackId) return;
    try {
      await api.addProblemToTrack(selectedTrackId, problemForm);
      setIsProblemModalOpen(false);
      await loadTrackDetails(selectedTrackId);
    } catch (err: any) {
      alert(err.message || 'Failed to add problem');
    }
  };

  const handleDeleteProblem = async (problemId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete problem "${title}"?`)) return;
    try {
      await api.deleteProblemFromTrack(problemId);
      if (selectedTrackId) {
        await loadTrackDetails(selectedTrackId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete problem');
    }
  };

  const problems = currentTrack?.problems || [];
  const distinctTopics = Array.from(new Set(problems.map(p => p.topic))).filter(Boolean);

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Header Banner with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> Daily Focus
            </span>
            <span className="text-xs text-slate-400 font-semibold">Department of CSBS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Daily POTD & Problem Tracks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Post daily LeetCode challenge links and maintain curated algorithmic roadmaps for CSBS students.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <X className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. POTD SECTION (Multi-Problem Support) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
              <Flame className="w-5 h-5 fill-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Today's Problem Challenges ({potdList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Synchronized live to both student portal and faculty dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddPOTD}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-orange-600" />
              <span>Add Another Problem</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Next POTD in:</span>
              <span className="font-mono font-bold text-purple-600">{timeLeft}</span>
            </div>
          </div>
        </div>

        {potdList.length === 0 ? (
          <div className="p-10 bg-white/80 backdrop-blur-md border border-dashed border-slate-300 rounded-2xl text-center space-y-3 shadow-xs">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-orange-100">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No POTD Posted for Today Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Faculty has not posted today's Problem of the Day challenge. Add problem 1, problem 2, etc. with direct LeetCode links.
            </p>
            <button
              onClick={handleOpenAddPOTD}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post Problem #1 Link</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {potdList.map((potd, idx) => (
              <div
                key={potd.id || idx}
                className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                        Problem #{idx + 1}
                      </span>
                      {getDifficultyBadge(potd.difficulty)}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {potd.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPOTD(potd)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-purple-200 flex items-center gap-1"
                        title="Edit Problem Link"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePOTD(potd.id, potd.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Problem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & URL */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {potd.title}
                    </h3>
                    <a
                      href={potd.leetcodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1 mt-1 break-all"
                    >
                      <span>{potd.leetcodeUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  {/* Hint Toggle */}
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

                  {/* Solvers Status */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Department Solvers</span>
                      </span>
                      <span className="text-emerald-700 font-bold">
                        {potd.solvedCount || 0} / {deptTotalStudents} Solved
                      </span>
                    </div>

                    {potd.solvedStudents && potd.solvedStudents.length > 0 ? (
                      <div className="max-h-24 overflow-y-auto space-y-1 pt-1">
                        {potd.solvedStudents.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => onOpenStudentDetail(s.studentId)}
                            className="text-[11px] p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800">{s.studentName} ({s.registerNo})</span>
                            <span className="text-emerald-600 font-bold">✓ Solved</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">No student submissions recorded yet today.</div>
                    )}
                  </div>

                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={potd.leetcodeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Open Problem on LeetCode</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. CURATED TRACKS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">Curated Problem Tracks</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Custom problem collections created by CSBS faculty for placement and algorithmic training.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Create Track</span>
            </button>
            {selectedTrackId && (
              <button
                onClick={() => setIsProblemModalOpen(true)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Problem</span>
              </button>
            )}
          </div>
        </div>

        {/* Track Tabs */}
        {tracks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <p className="text-xs">No problem tracks created yet.</p>
            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Create Your First Track
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              {tracks.map(t => (
                <div key={t.id} className="relative group flex items-center">
                  <button
                    onClick={() => setSelectedTrackId(t.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      selectedTrackId === t.id
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>{t.title}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedTrackId === t.id ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {t.totalProblems}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteTrack(t.id, t.title)}
                    className="ml-1 text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Delete Track"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Selected Track Details & Problems */}
            {currentTrack && (
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">{currentTrack.title}</h3>
                    <p className="text-xs text-slate-500">{currentTrack.description}</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs shrink-0">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Problems</span>
                      <span className="font-bold text-slate-800 text-base">{currentTrack.totalProblems}</span>
                    </div>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search problems in this track..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>

                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                  >
                    <option value="ALL">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Problems Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12">#</th>
                        <th className="p-3">Problem Title</th>
                        <th className="p-3">Difficulty</th>
                        <th className="p-3">Topic</th>
                        <th className="p-3">Solved by Students</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProblems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No problems in this track yet. Click "+ Add Problem" above to add challenges.
                          </td>
                        </tr>
                      ) : (
                        filteredProblems.map((p, pIdx) => (
                          <tr key={p.id || pIdx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-mono text-slate-400">{pIdx + 1}</td>
                            <td className="p-3 font-semibold text-slate-900">
                              <a
                                href={p.leetcodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-purple-600 flex items-center gap-1.5"
                              >
                                <span>{p.title}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            </td>
                            <td className="p-3">{getDifficultyBadge(p.difficulty)}</td>
                            <td className="p-3 text-slate-600">{p.topic}</td>
                            <td className="p-3 font-semibold text-emerald-600">{p.solvedCount || 0} students</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteProblem(p.id, p.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove from track"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- MODAL 1: ADD/EDIT POTD --- */}
      {isPOTDModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                <span>{editingPOTDId ? 'Edit POTD Challenge' : 'Post Today\'s POTD Problem'}</span>
              </h3>
              <button onClick={() => setIsPOTDModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSavePOTD} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold">LeetCode Problem URL *</label>
                <input
                  type="url"
                  value={potdForm.leetcodeUrl}
                  onChange={e => handlePOTDUrlChange(e.target.value)}
                  placeholder="https://leetcode.com/problems/two-sum/"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Title and slug will auto-populate from the URL.</span>
              </div>

              <div>
                <label className="block mb-1 font-bold">Problem Title *</label>
                <input
                  type="text"
                  value={potdForm.title}
                  onChange={e => setPotdForm({ ...potdForm, title: e.target.value })}
                  placeholder="e.g. Two Sum"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold">Difficulty</label>
                  <select
                    value={potdForm.difficulty}
                    onChange={e => setPotdForm({ ...potdForm, difficulty: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold">Topic / Category</label>
                  <input
                    type="text"
                    value={potdForm.topic}
                    onChange={e => setPotdForm({ ...potdForm, topic: e.target.value })}
                    placeholder="e.g. Arrays, Trees, DP"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold">Faculty Hint / Guidance (Optional)</label>
                <textarea
                  rows={2}
                  value={potdForm.hint}
                  onChange={e => setPotdForm({ ...potdForm, hint: e.target.value })}
                  placeholder="Provide algorithmic hints or key intuition for students..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPOTDModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingPOTDId ? 'Save Changes' : 'Post POTD Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE TRACK --- */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-600" />
                <span>Create New Problem Track</span>
              </h3>
              <button onClick={() => setIsTrackModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveTrack} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold">Track Title *</label>
                <input
                  type="text"
                  value={trackForm.title}
                  onChange={e => setTrackForm({ ...trackForm, title: e.target.value })}
                  placeholder="e.g. Placement Core 2026 or DP Sprint"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold">Description</label>
                <textarea
                  rows={2}
                  value={trackForm.description}
                  onChange={e => setTrackForm({ ...trackForm, description: e.target.value })}
                  placeholder="Goals and syllabus of this track..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTrackModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-md"
                >
                  Create Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD PROBLEM TO TRACK --- */}
      {isProblemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-600" />
                <span>Add Problem to Track</span>
              </h3>
              <button onClick={() => setIsProblemModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveProblem} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold">LeetCode Problem URL *</label>
                <input
                  type="url"
                  value={problemForm.leetcodeUrl}
                  onChange={e => handleProblemUrlChange(e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold">Problem Title *</label>
                <input
                  type="text"
                  value={problemForm.title}
                  onChange={e => setProblemForm({ ...problemForm, title: e.target.value })}
                  placeholder="e.g. Invert Binary Tree"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold">Difficulty</label>
                  <select
                    value={problemForm.difficulty}
                    onChange={e => setProblemForm({ ...problemForm, difficulty: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold">Topic</label>
                  <input
                    type="text"
                    value={problemForm.topic}
                    onChange={e => setProblemForm({ ...problemForm, topic: e.target.value })}
                    placeholder="e.g. Trees, Arrays"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProblemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-md"
                >
                  Add Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
