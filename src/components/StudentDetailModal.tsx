import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  ExternalLink, 
  Award, 
  Flame, 
  Calendar, 
  Code2, 
  Brain, 
  FileText, 
  Check, 
  TrendingUp,
  User,
  Shield,
  Clock,
  BookOpen
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';
import { StudentWithLatest, Snapshot } from '../types';

interface StudentDetailModalProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated?: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  isOpen,
  onClose,
  onDataUpdated,
}) => {
  const [data, setData] = useState<{
    student: StudentWithLatest;
    snapshots: Snapshot[];
    recent_submissions: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (studentId && isOpen) {
      loadStudent();
    }
  }, [studentId, isOpen]);

  const loadStudent = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await api.getStudent(studentId);
      setData(res);
      setNotes(res.student.notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!studentId) return;
    try {
      setRefreshing(true);
      await api.fetchStudentData(studentId);
      await loadStudent();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!studentId) return;
    try {
      setSavingNotes(true);
      await api.updateStudent(studentId, { notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isOpen || !studentId) return null;

  const student = data?.student;
  const snap = student?.latest_snapshot;
  const snapshots = data?.snapshots || [];
  const submissions = data?.recent_submissions || [];

  // Chart data for historical growth
  const chartData = snapshots.map(s => ({
    date: s.captured_at.split('T')[0],
    total: s.total_solved,
    easy: s.easy,
    medium: s.medium,
    hard: s.hard,
    rating: s.contest_rating > 0 ? s.contest_rating : null,
    engagement: s.engagement_score,
  }));

  const total = snap?.total_solved || 0;
  const easy = snap?.easy || 0;
  const medium = snap?.medium || 0;
  const hard = snap?.hard || 0;

  const easyPct = total > 0 ? Math.round((easy / total) * 100) : 0;
  const medPct = total > 0 ? Math.round((medium / total) * 100) : 0;
  const hardPct = total > 0 ? Math.round((hard / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-base">
              {student?.student_name.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-800">
                  {student?.student_name}
                </h2>
                <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-mono border border-slate-200">
                  {student?.register_no}
                </span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded font-medium">
                  Sec {student?.section} • Year {student?.year}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                <a
                  href={`https://leetcode.com/${student?.username}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 flex items-center space-x-1 underline decoration-amber-300 font-medium"
                >
                  <span>@{student?.username}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>•</span>
                <span>Mentor: {student?.mentor || 'Unassigned'}</span>
                <span>•</span>
                <span>Batch: {student?.batch}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors disabled:opacity-50"
              title="Sync latest live data from LeetCode profile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Fetching...' : 'Sync Live'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
              Loading student analytics...
            </div>
          ) : (
            <>
              {/* Top KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Total Solved</div>
                  <div className="text-2xl font-bold font-mono text-blue-700 mt-1">{total}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {student?.problems_added_month ? `+${student.problems_added_month} this month` : 'All time'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">CSBS Engagement</div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                    {snap?.engagement_score ?? 0}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                    Tier: {snap?.performance_tier || 'Beginner'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Contest Rating</div>
                  <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                    {snap?.contest_rating || 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {snap?.contests_attended ? `${snap.contests_attended} contests` : 'No contests'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Active Streak</div>
                  <div className="text-2xl font-bold font-mono text-orange-600 mt-1 flex items-center space-x-1">
                    <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
                    <span>{snap?.streak ?? 0}d</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Total: {snap?.active_days ?? 0} active days
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Acceptance Rate</div>
                  <div className="text-2xl font-bold font-mono text-sky-700 mt-1">
                    {snap?.acceptance_rate ? `${snap.acceptance_rate}%` : 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Global Rank: #{snap?.ranking?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Activity Status</div>
                  <div className="text-sm font-bold mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      student?.days_inactive! <= 14
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : student?.days_inactive! >= 990
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {snap?.activity_status || 'Active'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {student?.days_inactive! >= 990 ? 'No activity data' : `${student?.days_inactive} days inactive`}
                  </div>
                </div>

              </div>

              {/* Problem Difficulty Breakdown */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Problem Difficulty Distribution</span>
                  <span className="font-mono text-slate-500">{total} Total Solved</span>
                </div>

                {/* Progress bar */}
                <div className="h-4 w-full bg-slate-200 rounded-md overflow-hidden flex border border-slate-300/60">
                  <div
                    style={{ width: `${easyPct}%` }}
                    className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                    title={`Easy: ${easy} (${easyPct}%)`}
                  >
                    {easyPct > 8 && `${easy}`}
                  </div>
                  <div
                    style={{ width: `${medPct}%` }}
                    className="bg-amber-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                    title={`Medium: ${medium} (${medPct}%)`}
                  >
                    {medPct > 8 && `${medium}`}
                  </div>
                  <div
                    style={{ width: `${hardPct}%` }}
                    className="bg-rose-600 h-full flex items-center justify-center text-[10px] text-white font-bold"
                    title={`Hard: ${hard} (${hardPct}%)`}
                  >
                    {hardPct > 8 && `${hard}`}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 shrink-0" />
                    <span className="text-slate-600 font-medium">Easy: <strong className="text-slate-900 font-mono">{easy}</strong> ({easyPct}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-xs bg-amber-500 shrink-0" />
                    <span className="text-slate-600 font-medium">Medium: <strong className="text-slate-900 font-mono">{medium}</strong> ({medPct}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-xs bg-rose-600 shrink-0" />
                    <span className="text-slate-600 font-medium">Hard: <strong className="text-slate-900 font-mono">{hard}</strong> ({hardPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Historical Growth Chart */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Historical Progress Timeline</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {snapshots.length} snapshots recorded
                  </span>
                </div>

                {chartData.length > 0 ? (
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Line type="monotone" dataKey="total" name="Total Solved" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="medium" name="Medium" stroke="#f59e0b" strokeWidth={1.5} />
                        <Line type="monotone" dataKey="hard" name="Hard" stroke="#f43f5e" strokeWidth={1.5} />
                        <Line type="monotone" dataKey="engagement" name="CSBS Engagement" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs italic">
                    No historical snapshots recorded yet. Click Sync Live to capture the initial snapshot.
                  </div>
                )}
              </div>

              {/* Skills & Languages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Topic / Skill tags */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span>Topic & Algorithmic Skills</span>
                  </div>
                  {snap?.skills && snap.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {snap.skills.map((sk, i) => (
                        <span
                          key={i}
                          className={`text-[11px] px-2 py-1 rounded-md font-medium border ${
                            sk.category === 'advanced'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : sk.category === 'intermediate'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sk.tagName} <strong className="font-mono text-slate-900">({sk.problemsSolved})</strong>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs italic">No topic statistics reported by LeetCode.</div>
                  )}
                </div>

                {/* Languages */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                    <Code2 className="w-4 h-4 text-sky-600" />
                    <span>Programming Languages Used</span>
                  </div>
                  {snap?.languages && snap.languages.length > 0 ? (
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {snap.languages.map((l, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium">{l.languageName}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900">{l.problemsSolved}</span>
                            <span className="text-slate-400 text-[10px]">solved</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs italic">No language statistics reported.</div>
                  )}
                </div>

              </div>

              {/* Recent Solved Problems Table */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Recent Solved Problems ({submissions.length})</span>
                  </div>
                </div>

                {submissions.length === 0 ? (
                  <div className="text-slate-400 text-xs italic py-2">
                    No recent problem submissions recorded yet. Click "Sync Live" to retrieve fresh activity.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2.5">Problem Title</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Language</th>
                          <th className="p-2.5 text-right">Solved Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {submissions.map((sub, sIdx) => {
                          const l = (sub.language || 'Python3').toLowerCase();
                          const langColor = l.includes('python') ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : l.includes('cpp') || l === 'c++' ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : l.includes('java') ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200';

                          const tsNum = Number(sub.timestamp);
                          const d = !isNaN(tsNum) && tsNum > 0
                            ? (tsNum > 1e11 ? new Date(tsNum) : new Date(tsNum * 1000))
                            : new Date(sub.timestamp);
                          const dateStr = isNaN(d.getTime()) ? String(sub.timestamp || 'Recent') : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                          return (
                            <tr key={sub.id || sIdx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-semibold text-slate-900">
                                <a
                                  href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-purple-600 inline-flex items-center gap-1"
                                >
                                  <span>{sub.title}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              </td>
                              <td className="p-2.5">
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  {sub.statusDisplay || 'Accepted'}
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${langColor}`}>
                                  {sub.language || 'Python3'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right text-slate-500 font-medium">{dateStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Faculty Notes & Action */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Faculty Intervention & Mentor Notes</span>
                  </div>
                  {notesSaved && (
                    <span className="text-xs text-emerald-700 flex items-center space-x-1 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </span>
                  )}
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record student guidance notes, intervention discussion, or target problem goals..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-md p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>

            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Last snapshot captured:{' '}
            {snap?.captured_at ? new Date(snap.captured_at).toLocaleString() : 'Never'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
