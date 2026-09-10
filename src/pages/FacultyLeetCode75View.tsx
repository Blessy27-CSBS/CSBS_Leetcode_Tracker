import React, { useState, useEffect, useMemo } from 'react';
import { 
  FacultyLeetCode75Summary, 
  StudentLeetCode75Progress, 
  StudentWithLatest,
  LeetCode75Category
} from '../types';
import { api } from '../services/api';
import { LEETCODE_75_CATEGORIES, ALL_LEETCODE_75_PROBLEMS } from '../../server/leetcode75Data';
import { 
  Target, 
  Search, 
  Trophy, 
  CheckCircle2, 
  Flame, 
  RefreshCw, 
  ExternalLink, 
  Users, 
  ShieldCheck, 
  X, 
  ChevronRight,
  BookOpen,
  Filter,
  BarChart3,
  Award,
  Sparkles,
  Circle,
  FileText
} from 'lucide-react';

interface FacultyLeetCode75ViewProps {
  students?: StudentWithLatest[];
  onSelectStudent?: (id: string) => void;
}

export const FacultyLeetCode75View: React.FC<FacultyLeetCode75ViewProps> = ({ 
  students = [], 
  onSelectStudent 
}) => {
  const [summary, setSummary] = useState<FacultyLeetCode75Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'SOLVED_DESC' | 'COMPLETION_DESC' | 'NAME_ASC'>('SOLVED_DESC');

  // Inspection Modal
  const [inspectedStudent, setInspectedStudent] = useState<StudentLeetCode75Progress | null>(null);

  useEffect(() => {
    loadFacultySummary();
  }, [students]);

  const loadFacultySummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getFacultyLeetCode75Summary();
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load faculty LeetCode 75 summary.');
    } finally {
      setLoading(false);
    }
  };

  const availableSections = useMemo(() => {
    if (!summary?.studentsProgress) return [];
    const set = new Set<string>();
    for (const s of summary.studentsProgress) {
      if (s.section) set.add(s.section);
    }
    return Array.from(set).sort();
  }, [summary]);

  const filteredStudents = useMemo(() => {
    if (!summary?.studentsProgress) return [];
    return summary.studentsProgress.filter(s => {
      // Section filter
      if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
      // Level filter
      if (selectedLevel !== 'ALL' && s.levelName !== selectedLevel) return false;
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.studentName.toLowerCase().includes(q);
        const matchReg = s.registerNo.toLowerCase().includes(q);
        const matchUser = s.username.toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchUser) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'SOLVED_DESC') return b.totalSolved - a.totalSolved;
      if (sortBy === 'COMPLETION_DESC') return b.completionPercentage - a.completionPercentage;
      return a.studentName.localeCompare(b.studentName);
    });
  }, [summary, search, selectedSection, selectedLevel, sortBy]);

  const getLevelBadgeStyle = (levelName: string) => {
    switch (levelName) {
      case 'Ace':
        return 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'Master':
        return 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'Achiever':
        return 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-600/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm animate-pulse">Loading IV Year LeetCode 75 Analytics...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl mx-auto my-12">
        <p className="text-rose-500 font-semibold mb-4">{error}</p>
        <button 
          onClick={loadFacultySummary}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const eligibleCount = summary?.eligibleStudentsCount || 0;
  const activeCount = summary?.activeParticipantsCount || 0;
  const avgCompletion = summary?.avgCompletionPercentage || 0;
  const badgeEarners = summary?.badgeEarnersCount || 0;
  const totalSolvedSum = summary?.totalSolvedOverall || 0;
  const avgSolvedPerStudent = eligibleCount > 0 ? Math.round(totalSolvedSum / eligibleCount) : 0;

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 md:p-8 rounded-2xl border border-blue-900/50 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-bold text-blue-300">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>Final Year (IV Year) Special Track</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            LeetCode 75 Faculty Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Monitor and evaluate the LeetCode 75 interview prep progress for IV Year students. Track individual student levels, category mastery, and completion benchmarks.
          </p>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
          <Target className="w-64 h-64 text-blue-400" />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>IV Year Students</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            {eligibleCount}
          </div>
          <p className="text-[11px] text-slate-500">
            <strong className="text-emerald-600 dark:text-emerald-400">{activeCount}</strong> active participants
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Avg Solved (out of 75)</span>
            <BarChart3 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            {avgSolvedPerStudent} <span className="text-xs font-semibold text-slate-400">/ 75</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Total {totalSolvedSum} problems solved
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Avg Completion Rate</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            {avgCompletion}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-1">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${avgCompletion}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Badge Earners / Masters</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            {badgeEarners}
          </div>
          <p className="text-[11px] text-slate-500">
            Students with 60+ solved Qs
          </p>
        </div>

      </div>

      {/* Level Breakdown Cards */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>LeetCode 75 Student Level Tiers</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 1: Explorer</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">1-15 Solved</span>
            </div>
            <p className="text-[11px] text-slate-500">Foundation string & array concepts</p>
          </div>

          <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Level 2: Achiever</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">16-35 Solved</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Pointers, windows & stacks</p>
          </div>

          <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">Level 3: Master</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">36-60 Solved</span>
            </div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400">Trees, graphs & binary search</p>
          </div>

          <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-950 bg-purple-50/50 dark:bg-purple-950/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300">Level 4: Ace</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">61-75 Solved</span>
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400">DP, Trie, & Monotonic Stack</p>
          </div>

        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, reg no, or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Section Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Section:</span>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Level:</span>
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Levels</option>
              <option value="Explorer">Explorer (L1)</option>
              <option value="Achiever">Achiever (L2)</option>
              <option value="Master">Master (L3)</option>
              <option value="Ace">Ace (L4)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="SOLVED_DESC">Most Solved</option>
              <option value="COMPLETION_DESC">Highest Completion %</option>
              <option value="NAME_ASC">Student Name</option>
            </select>
          </div>

        </div>

      </div>

      {/* Student LeetCode 75 Progress Table */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4">Level Tier</th>
                <th className="py-3.5 px-4">LeetCode 75 Progress</th>
                <th className="py-3.5 px-4">Difficulty Distribution</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {eligibleCount === 0 
                            ? "No IV (Final Year) student details uploaded yet" 
                            : "No IV Year students found matching filters"}
                        </p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          {eligibleCount === 0 
                            ? "When IV Year students are added via the 'Students' administration module, their LeetCode 75 levels and problem-solving progress will appear here." 
                            : "Try adjusting your search query, section filter, or level filter."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{s.studentName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {s.registerNo} • @{s.username}
                      </div>
                    </td>

                    {/* Section */}
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">
                      Section {s.section}
                    </td>

                    {/* Level Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getLevelBadgeStyle(s.levelName)}`}>
                        <span>Level {s.levelNumber}:</span>
                        <span>{s.levelName}</span>
                      </span>
                    </td>

                    {/* Progress Bar & Solved count */}
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-900 dark:text-slate-100 font-bold">{s.totalSolved} / 75</span>
                          <span className="text-slate-500">{s.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${s.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Difficulty breakdown */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {s.easySolved} E
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {s.mediumSolved} M
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {s.hardSolved} H
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInspectedStudent(s)}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        Inspect Solved Qs
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Solved Qs Detail Modal */}
      {inspectedStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLevelBadgeStyle(inspectedStudent.levelName)}`}>
                    Level {inspectedStudent.levelNumber}: {inspectedStudent.levelName}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">IV Year • Sec {inspectedStudent.section}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {inspectedStudent.studentName}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {inspectedStudent.registerNo} • @{inspectedStudent.username}
                </p>
              </div>

              <button
                onClick={() => setInspectedStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Overall Stat Pill Grid */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{inspectedStudent.totalSolved} / 75</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Total Solved</div>
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{inspectedStudent.easySolved}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Easy</div>
                </div>
                <div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">{inspectedStudent.mediumSolved}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Medium</div>
                </div>
                <div>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400">{inspectedStudent.hardSolved}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Hard</div>
                </div>
              </div>

              {/* Category Breakdown & Solved Status */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Category Progress Breakdown</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LEETCODE_75_CATEGORIES.map(cat => {
                    const catProg = inspectedStudent.categoryProgress[cat.name] || { total: cat.problems.length, solved: 0 };
                    const pct = Math.round((catProg.solved / catProg.total) * 100);

                    return (
                      <div key={cat.name} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                          <span className="text-slate-500">{catProg.solved} / {catProg.total}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setInspectedStudent(null)}
                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
