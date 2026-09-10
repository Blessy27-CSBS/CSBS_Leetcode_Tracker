import React, { useState, useEffect, useMemo } from 'react';
import { 
  StudentWithLatest, 
  FacultyQuestSummary, 
  StudentQuestProgress,
  isEligibleForQuest
} from '../types';
import { api } from '../services/api';
import { 
  Compass, 
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
  BookOpen
} from 'lucide-react';

interface QuestViewProps {
  students?: StudentWithLatest[];
  onSelectStudent?: (id: string) => void;
}

export const QuestView: React.FC<QuestViewProps> = ({ students = [], onSelectStudent }) => {
  const [summary, setSummary] = useState<FacultyQuestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<'ALL' | 'II' | 'III'>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'COMPLETION_DESC' | 'LEVEL_DESC' | 'NAME_ASC'>('COMPLETION_DESC');

  // Modal inspection
  const [inspectedStudent, setInspectedStudent] = useState<StudentQuestProgress | null>(null);

  useEffect(() => {
    loadQuestSummary();
  }, [students]);

  const loadQuestSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getFacultyQuestSummary();
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load faculty quest analytics.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique sections
  const availableSections = useMemo(() => {
    if (!summary?.studentsProgress) return [];
    const set = new Set<string>();
    for (const s of summary.studentsProgress) {
      if (s.section) set.add(s.section);
    }
    return Array.from(set).sort();
  }, [summary]);

  // Filter & sort students
  const filteredStudents = useMemo(() => {
    if (!summary?.studentsProgress) return [];
    return summary.studentsProgress.filter(s => {
      // Year filter
      if (selectedYear !== 'ALL') {
        const y = String(s.year).toUpperCase();
        if (selectedYear === 'II' && !['II', '2', '2ND'].includes(y)) return false;
        if (selectedYear === 'III' && !['III', '3', '3RD'].includes(y)) return false;
      }
      // Section filter
      if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
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
      if (sortBy === 'COMPLETION_DESC') return b.completionPercentage - a.completionPercentage;
      if (sortBy === 'LEVEL_DESC') return b.currentLevelNumber - a.currentLevelNumber;
      return a.studentName.localeCompare(b.studentName);
    });
  }, [summary, search, selectedYear, selectedSection, sortBy]);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-slate-600">Loading Faculty DSA Quest Analytics...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-rose-50 border border-rose-200 rounded-xl text-center space-y-4 my-12 font-sans">
        <h2 className="text-base font-bold text-slate-900">Unable to Load Quest Analytics</h2>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          onClick={loadQuestSummary}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Light Theme Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-slate-50 p-6 sm:p-8 text-slate-900 border border-emerald-200/80 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/80 border border-emerald-300/60 rounded-full text-xs font-bold text-emerald-800">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span>Faculty DSA Quest Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Data Structures & Algorithms Quest
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Track student level progression across Linear Shoal, Sequence Valley, Stacks, Monotonic Stacks, and Dynamic Programming for II and III Year CSBS batches.
            </p>
          </div>

          <button
            onClick={loadQuestSummary}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* Light Theme KPI Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">II & III Year Enrolled</div>
              <div className="text-2xl font-black text-slate-900">{summary.eligibleStudentsCount} Students</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Participants</div>
              <div className="text-2xl font-black text-emerald-700">{summary.activeParticipantsCount} Active</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Avg Quest Completion</div>
              <div className="text-2xl font-black text-teal-700">{summary.avgCompletionPercentage}%</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Highest Stage Reached</div>
              <div className="text-2xl font-black text-amber-700 truncate">{summary.highestStageReached}</div>
            </div>

          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, reg no..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All (II & III Years)</option>
              <option value="II">II Year Only</option>
              <option value="III">III Year Only</option>
            </select>
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="COMPLETION_DESC">Completion % (High to Low)</option>
              <option value="LEVEL_DESC">Stage Level (High to Low)</option>
              <option value="NAME_ASC">Student Name (A-Z)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Student Quest Table - Clean Properly Aligned Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">
              Student Quest Progression List ({filteredStudents.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Filtered II & III Year Students
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Compass className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No II/III Year students match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-[24%]">Student Name & Reg No</th>
                  <th className="py-3.5 px-4 w-[12%] text-center">Batch / Sec</th>
                  <th className="py-3.5 px-4 w-[18%]">LeetCode Handle</th>
                  <th className="py-3.5 px-4 w-[20%]">Current Quest Stage</th>
                  <th className="py-3.5 px-4 w-[12%] text-center">Cleared</th>
                  <th className="py-3.5 px-4 w-[14%]">Progress %</th>
                  <th className="py-3.5 px-4 w-[10%] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/90 text-xs">
                {filteredStudents.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/90 transition-colors">
                    
                    {/* Student Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 leading-tight">{st.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{st.registerNo}</div>
                    </td>

                    {/* Year & Sec */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                        {st.year} Year • Sec {st.section}
                      </span>
                    </td>

                    {/* LeetCode Username */}
                    <td className="py-3.5 px-4">
                      <a
                        href={`https://leetcode.com/u/${st.username}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-emerald-700 hover:text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1.5"
                      >
                        <span>{st.username}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </td>

                    {/* Current Stage */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                        <Flame className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Level {st.currentLevelNumber}: {st.currentStageName}</span>
                      </div>
                    </td>

                    {/* Levels Unlocked */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                      {st.completedNodesCount} / {st.totalQuestNodes}
                    </td>

                    {/* Completion % Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-800">{st.completionPercentage}%</span>
                          <span className="text-slate-400 font-normal">{st.totalSolvedInQuest} Solved</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.max(4, st.completionPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInspectedStudent(st)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs whitespace-nowrap"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Light Theme Student Quest Details Inspection Modal */}
      {inspectedStudent && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{inspectedStudent.studentName}</h3>
                  <p className="text-xs text-slate-500">
                    Reg: {inspectedStudent.registerNo} • {inspectedStudent.year} Year (Sec {inspectedStudent.section}) • @{inspectedStudent.username}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setInspectedStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Level Nodes breakdown */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
              
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Current Stage</div>
                  <div className="text-sm font-black text-emerald-700 truncate">{inspectedStudent.currentStageName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Levels Cleared</div>
                  <div className="text-sm font-black text-slate-900">{inspectedStudent.completedNodesCount} / {inspectedStudent.totalQuestNodes}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Quest Progress</div>
                  <div className="text-sm font-black text-teal-700">{inspectedStudent.completionPercentage}%</div>
                </div>
              </div>

              {/* Levels Map List */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Quest Levels Breakdown</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inspectedStudent.nodes.map(node => (
                    <div
                      key={node.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        node.status === 'COMPLETED'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : node.status === 'IN_PROGRESS'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono text-slate-500">
                          Level {node.levelNumber} • {node.region}
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate">{node.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Solved: {node.userSolvedCount} / {node.requiredSolvedCount} Target Problems
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        node.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : node.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {node.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>CSBS LeetCode Quest Tracker</span>
              <button
                onClick={() => setInspectedStudent(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition-colors"
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
