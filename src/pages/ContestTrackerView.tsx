import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Code2, 
  Download, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Users, 
  Target, 
  Sparkles, 
  Award,
  ChevronRight,
  Filter,
  Flame
} from 'lucide-react';
import { ContestItem, ContestProblemLink, StudentWithLatest } from '../types';
import { api } from '../services/api';

interface ContestTrackerViewProps {
  students?: StudentWithLatest[];
  onSelectStudent?: (id: string) => void;
}

const formatName = (str?: string): string => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const ContestTrackerView: React.FC<ContestTrackerViewProps> = ({
  students = [],
  onSelectStudent
}) => {
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContestId, setSelectedContestId] = useState<string>('');

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'solved' | 'unsolved' | 'all'>('solved');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProblemFilter, setSelectedProblemFilter] = useState<string>('ALL');

  // Interactive Action States
  const [copiedRegNo, setCopiedRegNo] = useState<string | null>(null);

  // Manage Contest Problems Modal
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [editingProblems, setEditingProblems] = useState<ContestProblemLink[]>([]);
  const [savingProblems, setSavingProblems] = useState(false);

  const loadContestsData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getContests();
      setContests(data || []);
      if (data && data.length > 0) {
        setSelectedContestId(prev => (prev && data.some(c => c.id === prev) ? prev : data[0].id));
      }
    } catch (e: any) {
      console.error('Failed to load contests tracker data:', e);
      setError(e.message || 'Failed to connect to contests service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContestsData();
  }, []);

  const selectedContest = useMemo(() => {
    return contests.find(c => c.id === selectedContestId) || contests[0] || null;
  }, [contests, selectedContestId]);

  const handleCopyRegNo = (regNo: string) => {
    navigator.clipboard.writeText(regNo);
    setCopiedRegNo(regNo);
    setTimeout(() => setCopiedRegNo(null), 2000);
  };


  const handleOpenProblemModal = () => {
    if (!selectedContest) return;
    const existing = selectedContest.problems || [];
    const initialList: ContestProblemLink[] = [
      existing[0] || { title: '', difficulty: 'Easy', leetcodeUrl: '' },
      existing[1] || { title: '', difficulty: 'Medium', leetcodeUrl: '' },
      existing[2] || { title: '', difficulty: 'Medium', leetcodeUrl: '' },
      existing[3] || { title: '', difficulty: 'Hard', leetcodeUrl: '' },
    ];
    setEditingProblems(initialList);
    setIsProblemModalOpen(true);
  };

  const handleSaveProblems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContest) return;
    try {
      setSavingProblems(true);
      const cleaned = editingProblems.filter(p => p.title.trim() !== '');
      await api.updateContestProblems(selectedContest.id, cleaned);
      setIsProblemModalOpen(false);
      await loadContestsData();
    } catch (err: any) {
      alert(err.message || 'Failed to update contest problems');
    } finally {
      setSavingProblems(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedContest) return;
    const solved = selectedContest.solvedStudents || [];
    const unsolved = selectedContest.unsolvedStudents || [];

    const rows = [
      ['Student Name', 'Register No', 'Academic Year', 'Section', 'LeetCode Username', 'Contest Status', 'Problems Solved Count', 'Problems Solved Details', 'Submission Time', 'Current Rating'],
      ...solved.map(s => [
        s.studentName,
        s.registerNo,
        `${s.year} Year`,
        s.section,
        s.username,
        s.isManualOverride ? 'SOLVED (Manual)' : 'SOLVED',
        s.problemsSolvedCount,
        s.solvedProblems?.join('; ') || 'Contest Challenge',
        s.solvedAt ? new Date(s.solvedAt).toLocaleString() : 'Verified',
        s.contestRating ? Math.round(s.contestRating) : 'Unrated'
      ]),
      ...unsolved.map(u => [
        u.studentName,
        u.registerNo,
        `${u.year} Year`,
        u.section,
        u.username,
        u.isManualOverride ? 'DID NOT SOLVE (Manual)' : 'DID NOT SOLVE',
        0,
        'None',
        'N/A',
        u.contestRating ? Math.round(u.contestRating) : 'Unrated'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Contest_${selectedContest.title.replace(/\s+/g, '_')}_Participation.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Students Calculation
  const { filteredSolvedStudents, filteredUnsolvedStudents, filteredAllStudents, allProblemsSolvedCount } = useMemo(() => {
    if (!selectedContest) {
      return { filteredSolvedStudents: [], filteredUnsolvedStudents: [], filteredAllStudents: [], allProblemsSolvedCount: 0 };
    }

    const q = searchQuery.toLowerCase().trim();
    const contestProblems = selectedContest.problems || [];
    const totalContestProbsCount = contestProblems.length || 4;

    const solvedList = selectedContest.solvedStudents || [];
    const unsolvedList = selectedContest.unsolvedStudents || [];

    let allProbsSolved = 0;

    const filteredSolved = solvedList.filter(s => {
      if (s.problemsSolvedCount >= totalContestProbsCount && totalContestProbsCount > 0) {
        allProbsSolved++;
      }
      if (yearFilter !== 'ALL' && s.year !== yearFilter) return false;
      if (q) {
        const matches = s.studentName.toLowerCase().includes(q) ||
          s.registerNo.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedProblemFilter !== 'ALL') {
        const hasProb = s.solvedProblems?.some(p => p.toLowerCase().includes(selectedProblemFilter.toLowerCase()));
        if (!hasProb) return false;
      }
      return true;
    });

    const filteredUnsolved = unsolvedList.filter(u => {
      if (yearFilter !== 'ALL' && u.year !== yearFilter) return false;
      if (q) {
        const matches = u.studentName.toLowerCase().includes(q) ||
          u.registerNo.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    // Combined All view
    const combinedAll = [
      ...filteredSolved.map(s => ({ ...s, status: 'SOLVED' as const })),
      ...filteredUnsolved.map(u => ({
        studentId: u.studentId,
        studentName: u.studentName,
        registerNo: u.registerNo,
        username: u.username,
        section: u.section,
        year: u.year,
        problemsSolvedCount: 0,
        solvedProblems: [],
        contestRating: u.contestRating,
        totalSolved: u.totalSolved,
        isManualOverride: u.isManualOverride,
        status: 'UNSOLVED' as const
      }))
    ];

    return {
      filteredSolvedStudents: filteredSolved,
      filteredUnsolvedStudents: filteredUnsolved,
      filteredAllStudents: combinedAll,
      allProblemsSolvedCount: allProbsSolved
    };
  }, [selectedContest, yearFilter, searchQuery, selectedProblemFilter]);

  if (loading && contests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-sm font-semibold text-slate-600">Loading Contest Participation Data...</p>
      </div>
    );
  }

  if (error && contests.length === 0) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4 my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-black text-slate-900">Failed to Load Contests</h2>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          onClick={loadContestsData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Module Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
                <Trophy className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Contest Solved Tracker
              </h1>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Faculty Assessment Module
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
              Track and evaluate students who solved posted LeetCode contest problems. Inspect per-problem solution rates, filter by academic year, and export attendance records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedContest && (
              <>
                <button
                  type="button"
                  onClick={handleOpenProblemModal}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Configure Contest Problems (Q1-Q4)"
                >
                  <Code2 className="w-4 h-4 text-purple-600" />
                  <span>Map Problems (Q1-Q4)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download Attendance CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={loadContestsData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Contest Selection Bar */}
        {contests.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <label className="text-xs font-black text-slate-500 shrink-0">Select Contest:</label>
              <select
                value={selectedContestId}
                onChange={e => {
                  setSelectedContestId(e.target.value);
                  setSelectedProblemFilter('ALL');
                }}
                className="w-full text-xs font-bold py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                {contests.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.type}) — {new Date(c.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>

            {selectedContest && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                  Target: {selectedContest.targetCohort === 'II_III' ? 'II & III Years' : selectedContest.targetCohort === 'ALL' ? 'All Batches' : `${selectedContest.targetCohort || 'ALL'} Year`}
                </span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-100 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedContest.durationMinutes || 90} mins
                </span>
                {selectedContest.contestUrl && (
                  <a
                    href={selectedContest.contestUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-100 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Open on LeetCode</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!selectedContest ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Contests Posted Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Schedule a contest in the Contest Arena or check back once a contest has been posted by faculty.
          </p>
        </div>
      ) : (
        <>
          {/* 3. KPI Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Cohort</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {selectedContest.totalEligibleCount || (selectedContest.solvedCount || 0) + (selectedContest.unsolvedCount || 0)}
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                Eligible students in target year
              </div>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-[11px] font-bold uppercase tracking-wider">Solved Problems</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {selectedContest.solvedCount || (selectedContest.solvedStudents?.length || 0)}
              </div>
              <div className="text-[11px] font-bold text-emerald-600">
                {selectedContest.participationRate || 0}% solved this contest
              </div>
            </div>

            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-purple-600">
                <span className="text-[11px] font-bold uppercase tracking-wider">All Problems Solvers</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-800">
                {allProblemsSolvedCount}
              </div>
              <div className="text-[11px] font-bold text-purple-600">
                Full-contest problem finishers
              </div>
            </div>

            <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-rose-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Did Not Solve</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-700">
                {selectedContest.unsolvedCount || (selectedContest.unsolvedStudents?.length || 0)}
              </div>
              <div className="text-[11px] font-bold text-rose-600">
                {100 - (selectedContest.participationRate || 0)}% absentee / non-participating
              </div>
            </div>
          </div>

          {/* 4. Mapped Contest Problems Solution Breakdown */}
          {selectedContest.problems && selectedContest.problems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    Contest Problem Breakdown & Solver Counts
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  Click a problem to filter solvers below
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedContest.problems.map((prob, idx) => {
                  const probSolvers = (selectedContest.solvedStudents || []).filter(s =>
                    s.solvedProblems?.some(p => p.toLowerCase().includes((prob.title || `Q${idx + 1}`).toLowerCase()))
                  ).length;
                  const isFiltered = selectedProblemFilter.toLowerCase() === (prob.title || `Q${idx + 1}`).toLowerCase();

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedProblemFilter(prev => prev === (prob.title || `Q${idx + 1}`) ? 'ALL' : (prob.title || `Q${idx + 1}`));
                        setActiveTab('solved');
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isFiltered
                          ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                          : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                          Q{idx + 1}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          prob.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                          prob.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {prob.difficulty}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 truncate" title={prob.title}>
                        {prob.title || `Problem ${idx + 1}`}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-500">Solvers:</span>
                        <span className="font-extrabold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
                          {probSolvers} students
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedProblemFilter !== 'ALL' && (
                <div className="flex items-center gap-2 pt-1 text-xs text-purple-700 font-bold">
                  <span>Filtering students who solved: "{selectedProblemFilter}"</span>
                  <button
                    onClick={() => setSelectedProblemFilter('ALL')}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    (Clear filter)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. Main Roster Table Section */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            
            {/* Filter & View Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveTab('solved')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'solved'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Solved Problems ({selectedContest.solvedCount || (selectedContest.solvedStudents?.length || 0)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('unsolved')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'unsolved'
                        ? 'bg-white text-rose-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Did Not Solve ({selectedContest.unsolvedCount || (selectedContest.unsolvedStudents?.length || 0)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>All Cohort Students ({selectedContest.totalEligibleCount || 0})</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search name, reg no, handle..."
                    className="w-full pl-8.5 pr-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[11px] text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Year Filter Chips (No Section since only Section A exists) */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs font-bold text-slate-400 shrink-0">Filter Academic Year:</span>
                {['ALL', 'II', 'III', 'IV'].map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setYearFilter(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      yearFilter === yr
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {yr === 'ALL' ? 'All Years' : yr === 'IV' ? 'Final Year' : `${yr} Year`}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Display based on Tab */}
            {activeTab === 'solved' ? (
              <div className="p-4 sm:p-5">
                {filteredSolvedStudents.length === 0 ? (
                  <div className="p-8 bg-slate-50/60 rounded-2xl border border-slate-200 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">No Solved Students Found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No students matching the current filter have solved contest problems yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                      <thead className="bg-slate-50/90 text-slate-500 font-extrabold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Student & Register No</th>
                          <th className="py-3 px-3">Year / Section</th>
                          <th className="py-3 px-3">LeetCode Profile</th>
                          <th className="py-3 px-3">Problems Solved</th>
                          <th className="py-3 px-3">Submission Time</th>
                          <th className="py-3 px-3">Overall Solved / Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSolvedStudents.map(s => (
                          <tr key={s.studentId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => onSelectStudent && onSelectStudent(s.studentId)}
                                className="text-left group cursor-pointer"
                              >
                                <div className="font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center gap-1.5">
                                  <span>{formatName(s.studentName)}</span>
                                  {s.isManualOverride && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold rounded">
                                      Manual
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                                  <span>{s.registerNo}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCopyRegNo(s.registerNo); }}
                                    className="p-0.5 hover:text-slate-600 transition-colors cursor-pointer"
                                    title="Copy Register Number"
                                  >
                                    {copiedRegNo === s.registerNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                                  </button>
                                </div>
                              </button>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-700">{s.year} Year</span>
                              <span className="text-slate-400 mx-1">•</span>
                              <span className="font-bold text-slate-600">Sec {s.section}</span>
                            </td>

                            <td className="py-3 px-3">
                              <a
                                href={`https://leetcode.com/${s.username}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-slate-600 hover:text-purple-600 hover:underline"
                              >
                                <span>@{s.username}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            </td>

                            <td className="py-3 px-3">
                              <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black rounded-lg text-xs">
                                {s.problemsSolvedCount} {s.problemsSolvedCount === 1 ? 'Problem Solved' : 'Problems Solved'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-500 text-[11px]">
                              {s.solvedAt ? new Date(s.solvedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                            </td>

                            <td className="py-3 px-3 font-mono">
                              <span className="font-extrabold text-slate-800">{s.totalSolved || 0}</span>
                              <span className="text-slate-400 mx-1">/</span>
                              <span className="text-purple-600 font-bold">{s.contestRating ? Math.round(s.contestRating) : 'Unrated'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'unsolved' ? (
              <div className="p-4 sm:p-5">
                {filteredUnsolvedStudents.length === 0 ? (
                  <div className="p-8 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h3 className="text-sm font-extrabold text-emerald-900">All Eligible Students Have Solved!</h3>
                    <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                      Every filtered student has participated in or solved this contest challenge.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                      <thead className="bg-slate-50/90 text-slate-500 font-extrabold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Student & Register No</th>
                          <th className="py-3 px-3">Year / Section</th>
                          <th className="py-3 px-3">LeetCode Profile</th>
                          <th className="py-3 px-3">Last Active</th>
                          <th className="py-3 px-3">Overall Solved / Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUnsolvedStudents.map(u => (
                          <tr key={u.studentId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => onSelectStudent && onSelectStudent(u.studentId)}
                                className="text-left group cursor-pointer"
                              >
                                <div className="font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                                  {formatName(u.studentName)}
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                                  <span>{u.registerNo}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyRegNo(u.registerNo);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                    title="Copy Register Number"
                                  >
                                    {copiedRegNo === u.registerNo ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </button>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-700">{u.year} Year</span>
                              <span className="text-slate-400 mx-1">•</span>
                              <span className="font-bold text-slate-600">Sec {u.section}</span>
                            </td>

                            <td className="py-3 px-3">
                              <a
                                href={`https://leetcode.com/${u.username}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-slate-600 hover:text-purple-600 hover:underline"
                              >
                                <span>@{u.username}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            </td>

                            <td className="py-3 px-3">
                              {u.daysInactive !== undefined ? (
                                <span className={`text-[11px] font-bold ${
                                  u.daysInactive > 14 ? 'text-rose-600' : u.daysInactive > 7 ? 'text-amber-600' : 'text-slate-600'
                                }`}>
                                  {u.daysInactive === 0 ? 'Active Today' : `${u.daysInactive}d inactive`}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">No activity</span>
                              )}
                            </td>

                            <td className="py-3 px-3 font-mono">
                              <span className="font-bold text-slate-700">{u.totalSolved || 0}</span>
                              <span className="text-slate-400 mx-1">/</span>
                              <span className="text-slate-500">{u.contestRating ? Math.round(u.contestRating) : '0'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* All Cohort Students Tab */
              <div className="p-4 sm:p-5">
                <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-slate-50/90 text-slate-500 font-extrabold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Student & Register No</th>
                        <th className="py-3 px-3">Year / Section</th>
                        <th className="py-3 px-3">Contest Status</th>
                        <th className="py-3 px-3">Problems Solved</th>
                        <th className="py-3 px-3">LeetCode Handle</th>
                        <th className="py-3 px-3">Overall Solved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAllStudents.map(student => (
                        <tr key={student.studentId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-medium">
                            <button
                              type="button"
                              onClick={() => onSelectStudent && onSelectStudent(student.studentId)}
                              className="text-left group cursor-pointer"
                            >
                              <div className="font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                                {formatName(student.studentName)}
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                                <span>{student.registerNo}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyRegNo(student.registerNo);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                  title="Copy Register Number"
                                >
                                  {copiedRegNo === student.registerNo ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </button>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-700">{student.year} Year</span>
                            <span className="text-slate-400 mx-1">•</span>
                            <span className="font-bold text-slate-600">Sec {student.section}</span>
                          </td>

                          <td className="py-3 px-3">
                            {student.status === 'SOLVED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Solved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                Absent / Unsolved
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            {student.status === 'SOLVED' ? (
                              <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black rounded-lg text-xs">
                                {student.problemsSolvedCount} {student.problemsSolvedCount === 1 ? 'Problem Solved' : 'Problems Solved'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">0 Solved</span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <a
                              href={`https://leetcode.com/${student.username}/`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-slate-600 hover:text-purple-600 hover:underline"
                            >
                              @{student.username}
                            </a>
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            {student.totalSolved || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 6. Manage Contest Problems Modal */}
      {isProblemModalOpen && selectedContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Map Contest Problems</h3>
                  <p className="text-xs text-slate-500">
                    Map individual contest problems (Q1-Q4) to automatically track student solves.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProblemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProblems} className="space-y-3">
              {editingProblems.map((prob, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-700">Problem Q{idx + 1}</span>
                    <select
                      value={prob.difficulty}
                      onChange={e => {
                        const copy = [...editingProblems];
                        copy[idx].difficulty = e.target.value as any;
                        setEditingProblems(copy);
                      }}
                      className="text-xs font-bold p-1 bg-white border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Problem Title / Name</label>
                      <input
                        type="text"
                        value={prob.title}
                        onChange={e => {
                          const copy = [...editingProblems];
                          copy[idx].title = e.target.value;
                          setEditingProblems(copy);
                        }}
                        placeholder={`e.g. Q${idx + 1}: Two Sum`}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">LeetCode URL (Optional)</label>
                      <input
                        type="url"
                        value={prob.leetcodeUrl}
                        onChange={e => {
                          const copy = [...editingProblems];
                          copy[idx].leetcodeUrl = e.target.value;
                          setEditingProblems(copy);
                        }}
                        placeholder="https://leetcode.com/problems/..."
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProblemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProblems}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingProblems ? 'Saving & Checking...' : 'Save & Check Solves'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
