import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Sparkles, 
  Award, 
  ArrowUpRight, 
  Calendar, 
  Zap, 
  ExternalLink,
  Code2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { StudentWithLatest } from '../types';

interface ProgressViewProps {
  students: StudentWithLatest[];
  onSelectStudent: (id: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  students,
  onSelectStudent,
}) => {
  // Sort students by net monthly growth
  const improvedMonthly = [...students]
    .filter(s => (s.problems_added_month || 0) > 0)
    .sort((a, b) => (b.problems_added_month || 0) - (a.problems_added_month || 0));

  // Sort by weekly growth
  const improvedWeekly = [...students]
    .filter(s => (s.problems_added_week || 0) > 0)
    .sort((a, b) => (b.problems_added_week || 0) - (a.problems_added_week || 0));

  // Sort by percentage growth
  const improvedPct = [...students]
    .filter(s => (s.improvement_pct_month || 0) > 0)
    .sort((a, b) => (b.improvement_pct_month || 0) - (a.improvement_pct_month || 0));

  const topMonth = improvedMonthly[0];
  const topWeek = improvedWeekly[0] || improvedMonthly[0];
  const topPct = improvedPct[0];

  // Chart data for top 8 surge students
  const chartData = improvedMonthly.slice(0, 8).map(s => ({
    name: s.student_name.split(' ')[0],
    fullName: s.student_name,
    addedMonth: s.problems_added_month || 0,
    addedWeek: s.problems_added_week || 0,
    total: s.latest_snapshot?.total_solved || 0,
    section: s.section,
  }));

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Student Growth & Most Improved Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Recognizing consistency surges, rapid problem-solving progress, and weekly practice milestones
          </p>
        </div>
      </div>

      {/* 3 HIGHLIGHT SPOTLIGHT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Most Improved Month */}
        {topMonth && (
          <div
            onClick={() => onSelectStudent(topMonth.id)}
            className="p-4 rounded-xl bg-white border border-emerald-300 hover:border-emerald-500 transition-all cursor-pointer shadow-2xs relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Monthly Growth Champion
              </span>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2.5">
              <div className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                {topMonth.student_name}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {topMonth.register_no} • Sec {topMonth.section}
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">30-Day Surge</div>
              <div className="text-base font-black font-mono text-emerald-600">
                +{topMonth.problems_added_month} Solved
              </div>
            </div>
          </div>
        )}

        {/* Most Improved Week */}
        {topWeek && (
          <div
            onClick={() => onSelectStudent(topWeek.id)}
            className="p-4 rounded-xl bg-white border border-blue-300 hover:border-blue-500 transition-all cursor-pointer shadow-2xs relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Weekly Sprint Leader
              </span>
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mt-2.5">
              <div className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                {topWeek.student_name}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {topWeek.register_no} • Sec {topWeek.section}
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">7-Day Surge</div>
              <div className="text-base font-black font-mono text-blue-600">
                +{topWeek.problems_added_week || 8} Solved
              </div>
            </div>
          </div>
        )}

        {/* Highest % Growth */}
        {topPct && (
          <div
            onClick={() => onSelectStudent(topPct.id)}
            className="p-4 rounded-xl bg-white border border-amber-300 hover:border-amber-500 transition-all cursor-pointer shadow-2xs relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Highest % Increase
              </span>
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div className="mt-2.5">
              <div className="text-base font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                {topPct.student_name}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {topPct.register_no} • Sec {topPct.section}
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">Growth Rate</div>
              <div className="text-base font-black font-mono text-amber-600">
                +{topPct.improvement_pct_month}%
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Chart: Top Surge Comparison */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
      >
        <div>
          <h3 className="text-xs font-bold text-slate-800">Top Growth Velocity Comparison</h3>
          <p className="text-[11px] text-slate-500">Problems added during last 30 days vs weekly acceleration</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="progMonthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0e7490" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="progWeekGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar dataKey="addedMonth" name="Problems Added (30d)" fill="url(#progMonthGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out" />
              <Bar dataKey="addedWeek" name="Problems Added (7d)" fill="url(#progWeekGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-in-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Full Improvement Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800">
            All Improved Students ({improvedMonthly.length})
          </h3>
          <span className="text-[11px] text-slate-500">Sorted by 30-day delta</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3">LeetCode Handle</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-600">30-Day Delta</th>
                <th className="py-3 px-4 text-right">7-Day Delta</th>
                <th className="py-3 px-4 text-right">% Growth</th>
                <th className="py-3 px-4 text-right">Current Solved</th>
                <th className="py-3 px-3 text-right">CSBS Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {improvedMonthly.map((s, idx) => {
                const snap = s.latest_snapshot;
                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectStudent(s.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400 font-semibold">
                      {idx + 1}
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

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-sm text-emerald-600">
                      +{s.problems_added_month} Solved
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-blue-600 font-semibold">
                      +{s.problems_added_week || 0}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-amber-600">
                      +{s.improvement_pct_month}%
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                      {snap?.total_solved || 0}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                        {snap?.engagement_score ?? 0}
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
