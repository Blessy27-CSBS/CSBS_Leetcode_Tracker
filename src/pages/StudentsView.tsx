import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  UploadCloud, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  Edit, 
  Trash2, 
  Flame, 
  Check, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { StudentWithLatest } from '../types';
import { api } from '../services/api';

interface StudentsViewProps {
  students: StudentWithLatest[];
  onSelectStudent: (id: string) => void;
  onOpenAddStudent: () => void;
  onOpenEditStudent: (student: StudentWithLatest) => void;
  onOpenImport: () => void;
  onOpenBatchSync: () => void;
  onDataRefresh: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onSelectStudent,
  onOpenAddStudent,
  onOpenEditStudent,
  onOpenImport,
  onOpenBatchSync,
  onDataRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedActivity, setSelectedActivity] = useState('ALL');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter students
  const filteredStudents = students.filter(s => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = 
        s.student_name.toLowerCase().includes(q) ||
        s.register_no.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        (s.mentor && s.mentor.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
    if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;
    if (selectedTier !== 'ALL' && (s.latest_snapshot?.performance_tier || 'Beginner') !== selectedTier) return false;
    if (selectedActivity !== 'ALL' && (s.latest_snapshot?.activity_status || 'No Data') !== selectedActivity) return false;
    return true;
  });

  const handleSingleRefresh = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setRefreshingId(id);
      await api.fetchStudentData(id);
      onDataRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, s: StudentWithLatest) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ${s.student_name} (${s.register_no})? All historical data will be removed.`)) {
      return;
    }
    try {
      setDeletingId(s.id);
      await api.deleteStudent(s.id);
      onDataRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Action & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, register no, LeetCode handle, or mentor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddStudent}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Roster</span>
            </button>

            <a
              href="/api/students/template?format=xlsx"
              download="CSBS_LeetCode_Template.xlsx"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
              title="Download Excel Import Template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template</span>
            </a>

            <button
              onClick={onOpenBatchSync}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Fetch All</span>
            </button>

            <a
              href="/api/reports/csv"
              download="CSBS_LeetCode_Export.csv"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Years</option>
            <option value="I">I Year</option>
            <option value="II">II Year</option>
            <option value="III">III Year</option>
            <option value="IV">IV Year</option>
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={e => setSelectedTier(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Performance Tiers</option>
            <option value="Beginner">Beginner (0-49)</option>
            <option value="Developing">Developing (50-99)</option>
            <option value="Proficient">Proficient (100-199)</option>
            <option value="Advanced">Advanced (200+)</option>
          </select>

          {/* Activity Filter */}
          <select
            value={selectedActivity}
            onChange={e => setSelectedActivity(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Activity States</option>
            <option value="Active">Active (≤14d)</option>
            <option value="Inactive">Inactive (&gt;14d)</option>
            <option value="No Data">No Data</option>
          </select>

          <div className="ml-auto text-[11px] text-slate-500">
            Showing <strong className="text-slate-800 font-bold">{filteredStudents.length}</strong> of {students.length} students
          </div>
        </div>

      </div>

      {/* Student Master Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Register No</th>
                <th className="py-3 px-4">Student & Mentor</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3">LeetCode Handle</th>
                <th className="py-3 px-4">Solved (E/M/H)</th>
                <th className="py-3 px-3">Contest</th>
                <th className="py-3 px-3">Streak</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-3">CSBS Score</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                    No students match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => {
                  const snap = s.latest_snapshot;
                  const totalSolved = snap?.total_solved || 0;
                  const easy = snap?.easy || 0;
                  const medium = snap?.medium || 0;
                  const hard = snap?.hard || 0;
                  const isRefreshing = refreshingId === s.id;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => onSelectStudent(s.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Reg No */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {s.register_no}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {s.student_name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          Mentor: {s.mentor || 'Unassigned'}
                        </div>
                      </td>

                      {/* Section & Year */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {s.section} • {s.year}
                        </span>
                      </td>

                      {/* Handle */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <a
                          href={`https://leetcode.com/${s.username}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-amber-600 hover:text-amber-700 font-medium flex items-center space-x-1 underline decoration-amber-300"
                        >
                          <span>@{s.username}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      {/* Solved breakdown */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold font-mono text-slate-800 text-sm">
                            {totalSolved}
                          </span>
                          <div className="flex items-center space-x-1 text-[10px] font-mono">
                            <span className="text-emerald-600 font-semibold" title="Easy">{easy}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-amber-600 font-semibold" title="Medium">{medium}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-600 font-semibold" title="Hard">{hard}</span>
                          </div>
                        </div>
                        {s.problems_added_month! > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            +{s.problems_added_month} this mo
                          </div>
                        )}
                      </td>

                      {/* Contest Rating */}
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        {snap?.contest_rating ? (
                          <span className="text-amber-600 font-bold">{snap.contest_rating}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Streak */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-orange-500 font-mono font-bold">
                          <Flame className="w-3.5 h-3.5 fill-orange-500" />
                          <span>{snap?.streak ?? 0}d</span>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-[11px] text-slate-700 font-medium">
                          {snap?.last_active || 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.days_inactive! >= 990 ? 'No data' : `${s.days_inactive}d ago`}
                        </div>
                      </td>

                      {/* Engagement Score */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                          {snap?.engagement_score ?? 0}
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          snap?.performance_tier === 'Advanced'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : snap?.performance_tier === 'Proficient'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : snap?.performance_tier === 'Developing'
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {snap?.performance_tier || 'Beginner'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={(e) => handleSingleRefresh(e, s.id)}
                            disabled={isRefreshing}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Sync LeetCode profile now"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditStudent(s);
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                            title="Edit student record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, s)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete student record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
