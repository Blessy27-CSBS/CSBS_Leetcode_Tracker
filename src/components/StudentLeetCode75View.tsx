import React, { useState, useEffect, useMemo } from 'react';
import { 
  StudentLeetCode75Progress, 
  LeetCode75Category, 
  LeetCode75Problem 
} from '../types';
import { api } from '../services/api';
import { 
  Play, 
  CheckCircle2, 
  Circle, 
  FileText, 
  ExternalLink, 
  Search, 
  Award, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Trophy,
  Share2,
  RotateCcw,
  Target,
  RefreshCw
} from 'lucide-react';

interface StudentLeetCode75ViewProps {
  studentId?: string;
}

export const StudentLeetCode75View: React.FC<StudentLeetCode75ViewProps> = ({ studentId }) => {
  const [progress, setProgress] = useState<StudentLeetCode75Progress | null>(null);
  const [categories, setCategories] = useState<LeetCode75Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [error, setError] = useState('');

  // Filters & State
  const [showTags, setShowTags] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadLeetCode75(true);
  }, [studentId]);

  const loadLeetCode75 = async (autoSync = false) => {
    try {
      if (!progress) setLoading(true);
      setError('');
      const res = await api.getLeetCode75StudentProgress(studentId);
      setProgress(res.leetcode75Progress);
      setCategories(res.categories);

      // Auto-sync fresh LeetCode data if requested on mount
      if (autoSync && !syncing) {
        handleSyncSilently();
      }
    } catch (err: any) {
      console.error(err);
      if (!progress) {
        setError(err.message || 'Failed to load LeetCode 75 Study Plan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSilently = async () => {
    try {
      setSyncing(true);
      await api.syncMyLeetCode(studentId);
      const res = await api.getLeetCode75StudentProgress(studentId);
      setProgress(res.leetcode75Progress);
      setCategories(res.categories);
      setSyncMsg('Auto-synced with LeetCode live');
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (e) {
      // Ignore background sync errors if initial data is present
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncMsg('');
      setError('');
      await api.syncMyLeetCode(studentId);
      const res = await api.getLeetCode75StudentProgress(studentId);
      setProgress(res.leetcode75Progress);
      setCategories(res.categories);
      setSyncMsg('Successfully synchronized LeetCode 75 progress!');
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync LeetCode progress.');
    } finally {
      setSyncing(false);
    }
  };

  const toggleCategory = (catName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const solvedSlugsSet = useMemo(() => {
    return new Set(progress?.solvedSlugs.map(s => s.toLowerCase()) || []);
  }, [progress]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase().trim();
    return categories.map(cat => ({
      ...cat,
      problems: cat.problems.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.difficulty.toLowerCase().includes(q)
      )
    })).filter(cat => cat.problems.length > 0);
  }, [categories, search]);

  if (loading && !progress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium text-sm animate-pulse">Loading LeetCode 75 Study Plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl max-w-xl mx-auto my-12">
        <p className="text-rose-400 font-semibold mb-4">{error}</p>
        <button 
          onClick={() => { void loadLeetCode75(); }} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalSolved = progress?.totalSolved || 0;
  const completionPct = progress?.completionPercentage || 0;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500 selection:text-white">
      {/* Container */}
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Section styled exactly like LeetCode Study Plan Header */}
        <div className="relative overflow-hidden bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
          
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-5 relative z-10">

            {/* Subtitle Badge */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ace Coding Interview with 75 Qs</span>
            </div>

            {/* Circular Target Ring Graphic (LeetCode 75 Hero Logo) */}
            <div className="relative w-32 h-32 flex items-center justify-center my-2 group cursor-pointer">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md group-hover:scale-110 transition-transform duration-300" />
              
              {/* Target Concentric Circles SVG */}
              <svg className="w-28 h-28 transform transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="4" opacity="0.2" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#0088ff" strokeWidth="5" opacity="0.6" />
                <circle cx="50" cy="50" r="26" fill="none" stroke="#0088ff" strokeWidth="6" />
                <circle cx="50" cy="50" r="16" fill="none" stroke="#00b4d8" strokeWidth="6" />
                <circle cx="50" cy="50" r="7" fill="#00b4d8" />
                
                {/* Blue Cursor Arrow overlay */}
                <path d="M50 50 L65 72 L58 58 L72 65 Z" fill="#0088ff" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Solved percentage pill over badge */}
              <div className="absolute -bottom-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                {completionPct}%
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              LeetCode 75
            </h1>

            {/* Start CTA Button & Sync Button */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="https://leetcode.com/studyplan/leetcode-75/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full font-bold text-sm shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{totalSolved > 0 ? 'Continue' : 'Start'}</span>
              </a>

              <button
                onClick={() => { void handleManualSync(); }}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync fresh progress from LeetCode"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync LeetCode'}</span>
              </button>
            </div>

            {syncMsg && (
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in flex items-center gap-1.5 justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{syncMsg}</span>
              </div>
            )}

            {/* Overall Progress Gauge */}
            <div className="w-full max-w-md pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Progress</span>
                <span>{totalSolved} / 75 Solved</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search problem or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400 self-end sm:self-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showTags} 
                onChange={e => setShowTags(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-xs border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Show tags</span>
            </label>
          </div>
        </div>

        {/* Main Content Layout (Grid split: Left Problem List, Right Sidebar Widgets) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Problem List by Category (2 Cols wide on large screen) */}
          <div className="lg:col-span-2 space-y-4">
            
            {filteredCategories.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No matching problems found.</p>
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isCollapsed = collapsedCategories[cat.name];
                const catSolved = cat.problems.filter(p => solvedSlugsSet.has(p.titleSlug.toLowerCase())).length;
                const catTotal = cat.problems.length;
                const isCategoryCompleted = catSolved === catTotal;

                return (
                  <div 
                    key={cat.name} 
                    className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-all"
                  >
                    {/* Category Header Bar */}
                    <div 
                      onClick={() => toggleCategory(cat.name)}
                      className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {cat.name}
                        </span>
                        {isCategoryCompleted && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {catSolved} / {catTotal}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Category Problems Table / List */}
                    {!isCollapsed && (
                      <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {cat.problems.map((problem) => {
                          const isSolved = solvedSlugsSet.has(problem.titleSlug.toLowerCase());

                          return (
                            <div 
                              key={problem.id}
                              className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                            >
                              {/* Left: Completion radio + Title */}
                              <div className="flex items-center gap-3 min-w-0">
                                {isSolved ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                                )}

                                <a
                                  href={problem.leetcodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs md:text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                                >
                                  {problem.title}
                                </a>
                              </div>

                              {/* Right: Solution Link & Difficulty Tag */}
                              <div className="flex items-center gap-4 shrink-0">
                                <a
                                  href={`${problem.leetcodeUrl}solutions/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                  title="View Solution"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Solution</span>
                                </a>

                                {showTags && (
                                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                    problem.difficulty === 'Easy'
                                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                      : problem.difficulty === 'Medium'
                                      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                      : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                                  }`}>
                                    {problem.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>

          {/* Right Column: Widgets matching exact LeetCode Study Plan right sidebar */}
          <div className="space-y-6">

            {/* Summary Widget */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Summary</h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside">
                <li>75 Essential & Trending Problems</li>
                <li>Must-do problem list for interview prep</li>
                <li>Best for 1-3 month of prep time</li>
              </ul>
            </div>

            {/* Award / Badge Preview Widget */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Award</h3>
              
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 rounded-full border border-blue-500/30">
                  <Target className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">LeetCode 75</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Complete the study plan to win the badge!
                  </p>
                </div>
              </div>
            </div>

            {/* Related Study Plans Widget */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Related</h3>
              
              <div className="space-y-3">
                <a 
                  href="https://leetcode.com/studyplan/top-interview-150/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    TOP
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                      Top Interview 150
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Must-do List for Interview Prep</p>
                  </div>
                </a>

                <a 
                  href="https://leetcode.com/studyplan/top-100-liked/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    100
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-purple-400 transition-colors">
                      Top 100 Liked
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">100 Best Rated Problems</p>
                  </div>
                </a>

                <a 
                  href="https://leetcode.com/studyplan/30-days-of-lc-javascript/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    JS
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-400 transition-colors">
                      30 Days of JavaScript
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Learn JS Basics & Closure</p>
                  </div>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
