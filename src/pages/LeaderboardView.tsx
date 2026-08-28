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
  Sparkles
} from 'lucide-react';
import { StudentWithLatest } from '../types';

interface LeaderboardViewProps {
  students: StudentWithLatest[];
  onSelectStudent: (id: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  students,
  onSelectStudent,
}) => {
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

  const top3 = sorted.slice(0, 3);
  const remaining = sorted.slice(3);

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
    <div className="space-y-5">
      
      {/* Header & Metric Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">
              Department Performance Leaderboard
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by multi-dimensional practice metrics and departmental engagement indicators
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setSortBy('engagement_score')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              sortBy === 'engagement_score'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Engagement
          </button>
          <button
            onClick={() => setSortBy('total_solved')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              sortBy === 'total_solved'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Total Solved
          </button>
          <button
            onClick={() => setSortBy('medium')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              sortBy === 'medium'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setSortBy('hard')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              sortBy === 'hard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hard
          </button>
          <button
            onClick={() => setSortBy('contest_rating')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              sortBy === 'contest_rating'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contest
          </button>
          <button
            onClick={() => setSortBy('improvement')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              sortBy === 'improvement'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Surge
          </button>
          <button
            onClick={() => setSortBy('streak')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              sortBy === 'streak'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Streak
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
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
      </div>

      {/* TOP 3 PODIUM CARDS */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          {/* 2nd Place (Silver) */}
          <div
            onClick={() => onSelectStudent(top3[1].id)}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between order-2 md:order-1 shadow-2xs relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-3 text-slate-400 font-mono font-black text-3xl opacity-20 group-hover:opacity-40 transition-opacity">
              #2
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-sm mb-2.5 shadow-2xs">
                🥈
              </div>
              <div className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors">
                {top3[1].student_name}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {top3[1].register_no} • Sec {top3[1].section}
              </div>
              <div className="text-xs text-amber-600 mt-1 font-medium">
                @{top3[1].username}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">{getMetricLabel()}</div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {getMetricValue(top3[1])}
              </div>
            </div>
          </div>

          {/* 1st Place (Gold) */}
          <div
            onClick={() => onSelectStudent(top3[0].id)}
            className="p-5 rounded-xl bg-gradient-to-b from-amber-50/40 via-white to-white border-2 border-amber-400 hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between order-1 md:order-2 shadow-xs relative overflow-hidden group -translate-y-1"
          >
            <div className="absolute top-0 right-0 p-3 text-amber-400 font-mono font-black text-4xl opacity-25 group-hover:opacity-40 transition-opacity">
              #1
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 border border-amber-300 flex items-center justify-center font-bold text-base mb-2.5 shadow-xs">
                👑
              </div>
              <div className="font-bold text-lg text-slate-900 group-hover:text-amber-700 transition-colors">
                {top3[0].student_name}
              </div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                {top3[0].register_no} • Sec {top3[0].section} ({top3[0].year} Year)
              </div>
              <div className="text-xs text-amber-600 mt-1 font-bold">
                @{top3[0].username}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between">
              <div className="text-xs text-amber-800 font-semibold">{getMetricLabel()}</div>
              <div className="text-base font-black font-mono text-amber-600">
                {getMetricValue(top3[0])}
              </div>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div
            onClick={() => onSelectStudent(top3[2].id)}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between order-3 shadow-2xs relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-3 text-amber-700 font-mono font-black text-3xl opacity-15 group-hover:opacity-30 transition-opacity">
              #3
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-sm mb-2.5 shadow-2xs">
                🥉
              </div>
              <div className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors">
                {top3[2].student_name}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {top3[2].register_no} • Sec {top3[2].section}
              </div>
              <div className="text-xs text-amber-600 mt-1 font-medium">
                @{top3[2].username}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">{getMetricLabel()}</div>
              <div className="text-sm font-bold font-mono text-slate-800">
                {getMetricValue(top3[2])}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3">LeetCode Handle</th>
                <th className="py-3 px-4 text-right font-bold text-blue-700">{getMetricLabel()}</th>
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
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                      {idx === 0 ? '👑 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      <div>{s.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.register_no}</div>
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

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-black text-sm text-blue-600">
                      {getMetricValue(s)}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap text-slate-800">
                      {snap?.total_solved ?? 0}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        (M: {snap?.medium ?? 0}, H: {snap?.hard ?? 0})
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      {snap?.contest_rating ? (
                        <span className="text-amber-600 font-bold">{snap.contest_rating}</span>
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
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
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
  );
};
