import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Flame, 
  Code2, 
  TrendingUp, 
  Filter, 
  ExternalLink,
  Award,
  Crown,
  Sparkles,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { StudentWithLatest } from '../types';
import { LeetCodeContestLeaderboard } from '../components/LeetCodeContestLeaderboard';

interface LeaderboardViewProps {
  students: StudentWithLatest[];
  onSelectStudent: (id: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  students,
  onSelectStudent,
}) => {
  const [viewMode, setViewMode] = useState<'arena' | 'table'>('arena');
  const [sortBy, setSortBy] = useState<'engagement_score' | 'total_solved' | 'medium' | 'hard' | 'contest_rating' | 'improvement' | 'streak'>('engagement_score');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  const filtered = students.filter(s => {
    if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
    if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const snapA = a.latest_snapshot;
    const snapB = b.latest_snapshot;

    if (sortBy === 'total_solved') {
      return (snapB?.total_solved || 0) - (snapA?.total_solved || 0);
    }
    if (sortBy === 'medium') {
      return (snapB?.medium || 0) - (snapA?.medium || 0);
    }
    if (sortBy === 'hard') {
      return (snapB?.hard || 0) - (snapA?.hard || 0);
    }
    if (sortBy === 'contest_rating') {
      return (snapB?.contest_rating || 0) - (snapA?.contest_rating || 0);
    }
    if (sortBy === 'improvement') {
      return (b.problems_added_month || 0) - (a.problems_added_month || 0);
    }
    if (sortBy === 'streak') {
      return (snapB?.streak || 0) - (snapA?.streak || 0);
    }
    // Default: engagement_score
    return (snapB?.engagement_score || 0) - (snapA?.engagement_score || 0);
  });

  const getMetricLabel = () => {
    switch (sortBy) {
      case 'total_solved': return 'Total Solved';
      case 'medium': return 'Medium Problems';
      case 'hard': return 'Hard Problems';
      case 'contest_rating': return 'Contest Rating';
      case 'improvement': return 'Monthly Improvement';
      case 'streak': return 'Active Streak';
      default: return 'CSBS Engagement Score';
    }
  };

  const getMetricValue = (s: StudentWithLatest) => {
    const snap = s.latest_snapshot;
    switch (sortBy) {
      case 'total_solved': return `${snap?.total_solved || 0} Solved`;
      case 'medium': return `${snap?.medium || 0} Medium`;
      case 'hard': return `${snap?.hard || 0} Hard`;
      case 'contest_rating': return snap?.contest_rating ? `${snap.contest_rating} Rating` : 'N/A';
      case 'improvement': return `+${s.problems_added_month || 0} Problems`;
      case 'streak': return `${snap?.streak || 0} Days`;
      default: return `${snap?.engagement_score || 0}/100 Score`;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Top View Mode Switcher Header */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900">
              CSBS Official LeetCode Leaderboard & Contest Arena
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time rankings, contest countdowns, top 3 podium, and department analytics.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('arena')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'arena'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Contest Arena</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Full Table View</span>
          </button>
        </div>
      </div>

      {/* 1. ARENA VIEW (Default - LeetCode Style) */}
      {viewMode === 'arena' && (
        <LeetCodeContestLeaderboard
          students={students}
          onSelectStudent={onSelectStudent}
          isFaculty={true}
        />
      )}

      {/* 2. TABLE VIEW (Detailed Faculty Metric Matrix) */}
      {viewMode === 'table' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            {/* Filter Row */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1 text-slate-500 font-bold">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Years</option>
                <option value="I">I Year</option>
                <option value="II">II Year</option>
                <option value="III">III Year</option>
                <option value="IV">IV Year</option>
              </select>
            </div>

            {/* Metric Selector Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSortBy('engagement_score')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  sortBy === 'engagement_score'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Engagement
              </button>
              <button
                onClick={() => setSortBy('total_solved')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  sortBy === 'total_solved'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Total Solved
              </button>
              <button
                onClick={() => setSortBy('contest_rating')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  sortBy === 'contest_rating'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Contest Rating
              </button>
              <button
                onClick={() => setSortBy('streak')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  sortBy === 'streak'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Streak
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">LeetCode Handle</th>
                    <th className="py-3 px-4 text-right font-bold text-purple-700">{getMetricLabel()}</th>
                    <th className="py-3 px-4">Total Solved</th>
                    <th className="py-3 px-3">Contest Rating</th>
                    <th className="py-3 px-3">Active Streak</th>
                    <th className="py-3 px-3">CSBS Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sorted.map((s, idx) => {
                    const snap = s.latest_snapshot;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => onSelectStudent(s.id)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                          {idx === 0 ? '👑 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                          <div>{s.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal">{s.register_no}</div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                            Sec {s.section} • {s.year} Yr
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <a
                            href={`https://leetcode.com/${s.username}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-amber-600 hover:text-amber-700 font-semibold flex items-center space-x-1"
                          >
                            <span>@{s.username}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-black text-sm text-purple-700">
                          {getMetricValue(s)}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-slate-800">
                          {snap?.total_solved ?? 0}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            (M: {snap?.medium ?? 0}, H: {snap?.hard ?? 0})
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono whitespace-nowrap">
                          {snap?.contest_rating ? (
                            <span className="text-amber-600 font-black">{snap.contest_rating}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center space-x-1 text-orange-500 font-mono font-bold">
                            <Flame className="w-3.5 h-3.5 fill-orange-500" />
                            <span>{snap?.streak ?? 0}d</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs">
                            {snap?.engagement_score ?? 0}/100
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
