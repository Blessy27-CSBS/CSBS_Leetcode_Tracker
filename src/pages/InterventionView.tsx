import React, { useState } from 'react';
import { 
  AlertCircle, 
  UserX, 
  ExternalLink, 
  MessageSquare, 
  Download, 
  Clock, 
  RefreshCw,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { StudentWithLatest } from '../types';
import { api } from '../services/api';

interface InterventionViewProps {
  students: StudentWithLatest[];
  thresholdDays: number;
  onSelectStudent: (id: string) => void;
  onDataRefresh: () => void;
}

export const InterventionView: React.FC<InterventionViewProps> = ({
  students,
  thresholdDays,
  onSelectStudent,
  onDataRefresh,
}) => {
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  // Filter inactive students
  const inactiveStudents = students.filter(s => {
    const isInactive = (s.days_inactive ?? 999) > thresholdDays || s.latest_snapshot?.activity_status === 'Inactive' || s.latest_snapshot?.activity_status === 'No Data';
    if (!isInactive) return false;
    if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
    return true;
  }).sort((a, b) => (b.days_inactive ?? 999) - (a.days_inactive ?? 999));

  const handleSyncOne = async (e: React.MouseEvent, id: string) => {
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

  return (
    <div className="space-y-5">
      
      {/* Header & Threshold Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">
              Student Inactivity & Faculty Intervention List
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Flagging students with no verified coding submissions for {thresholdDays}+ days to facilitate mentor outreach
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <a
            href="/api/reports/csv"
            download="CSBS_Intervention_List.csv"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Intervention CSV</span>
          </a>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-slate-500 font-medium">Total Inactive Students</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {inactiveStudents.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Requiring departmental follow-up
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-slate-500 font-medium">Critical Inactivity (&gt;30 Days)</div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {inactiveStudents.filter(s => (s.days_inactive ?? 0) >= 30 && (s.days_inactive ?? 0) < 990).length}
          </div>
          <div className="text-[10px] text-rose-500 mt-0.5">
            High priority mentor outreach
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-slate-500 font-medium">Configured Threshold</div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {thresholdDays} Days
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Configurable in Settings tab
          </div>
        </div>

      </div>

      {/* Section Filter */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">Filter Section:</span>
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
        </div>
        <div className="text-slate-500">
          {inactiveStudents.length} student records flagged
        </div>
      </div>

      {/* Inactivity Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Register No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3">LeetCode Handle</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-3 font-bold text-amber-600">Inactivity Period</th>
                <th className="py-3 px-3">Solved</th>
                <th className="py-3 px-4">Faculty Mentor</th>
                <th className="py-3 px-4">Notes / Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inactiveStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-emerald-600 italic">
                    Great news! No students currently exceed the inactivity threshold of {thresholdDays} days.
                  </td>
                </tr>
              ) : (
                inactiveStudents.map(s => {
                  const snap = s.latest_snapshot;
                  const days = s.days_inactive ?? 999;
                  const isCritical = days >= 30 && days < 990;
                  const isNoData = days >= 990;
                  const isSyncing = refreshingId === s.id;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => onSelectStudent(s.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {s.register_no}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {s.student_name}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {s.section} • {s.year}
                        </span>
                      </td>

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

                      <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                        {snap?.last_active || 'N/A'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isNoData ? (
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                            No Submissions
                          </span>
                        ) : isCritical ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                            {days} Days Inactive
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                            {days} Days Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold whitespace-nowrap text-slate-800">
                        {snap?.total_solved || 0}
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {s.mentor || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {s.notes || <span className="text-slate-400 italic">No notes recorded</span>}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={e => handleSyncOne(e, s.id)}
                            disabled={isSyncing}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Re-check LeetCode profile now"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudent(s.id);
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Log Notes
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
