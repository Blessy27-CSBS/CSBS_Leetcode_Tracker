import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Code2, 
  Trophy, 
  TrendingUp, 
  Award, 
  Flame, 
  RefreshCw, 
  Download, 
  Plus, 
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { DashboardSummary, SectionStat, BatchStat, StudentWithLatest } from '../types';

interface DashboardViewProps {
  summary: DashboardSummary;
  sectionStats: SectionStat[];
  batchStats: BatchStat[];
  timeline: { date: string; total_problems: number; avg_problems: number; avg_rating: number }[];
  students: StudentWithLatest[];
  onOpenBatchSync: () => void;
  onOpenAddStudent: () => void;
  onSelectStudent: (id: string) => void;
  onNavigateTab: (tab: any) => void;
}

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#818cf8', '#06b6d4', '#a855f7'];
const TIER_COLORS: Record<string, string> = {
  Beginner: '#94a3b8',
  Developing: '#38bdf8',
  Proficient: '#818cf8',
  Advanced: '#10b981',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  sectionStats,
  batchStats,
  timeline,
  students,
  onOpenBatchSync,
  onOpenAddStudent,
  onSelectStudent,
  onNavigateTab,
}) => {
  // Chart 1: Top 7 Problems Solved
  const topSolversData = [...students]
    .sort((a, b) => (b.latest_snapshot?.total_solved || 0) - (a.latest_snapshot?.total_solved || 0))
    .slice(0, 7)
    .map(s => ({
      name: s.student_name.split(' ')[0],
      fullName: s.student_name,
      id: s.id,
      solved: s.latest_snapshot?.total_solved || 0,
      easy: s.latest_snapshot?.easy || 0,
      medium: s.latest_snapshot?.medium || 0,
      hard: s.latest_snapshot?.hard || 0,
      section: s.section,
    }));

  // Chart 2: Difficulty distribution
  const difficultyData = [
    { name: 'Easy', value: summary.difficulty_distribution.easy, color: '#10b981' },
    { name: 'Medium', value: summary.difficulty_distribution.medium, color: '#f59e0b' },
    { name: 'Hard', value: summary.difficulty_distribution.hard, color: '#ef4444' },
  ];

  // Chart 5: Section comparison
  const sectionChartData = sectionStats.map(s => ({
    section: `Sec ${s.section}`,
    avgProblems: s.avg_problems,
    totalProblems: s.total_problems,
    avgRating: s.avg_rating,
    avgEngagement: s.avg_engagement,
    students: s.total_students,
  }));

  // Chart 7: Monthly improvement top students
  const monthlyImpData = [...students]
    .filter(s => (s.problems_added_month || 0) > 0)
    .sort((a, b) => (b.problems_added_month || 0) - (a.problems_added_month || 0))
    .slice(0, 6)
    .map(s => ({
      name: s.student_name.split(' ')[0],
      added: s.problems_added_month || 0,
      pct: s.improvement_pct_month || 0,
      section: s.section,
    }));

  // Chart 8: Performance Tier Distribution
  const tierData = Object.entries(summary.tier_distribution).map(([tier, count]) => ({
    name: tier,
    count,
    color: TIER_COLORS[tier] || '#3b82f6',
  }));

  return (
    <div className="space-y-5">
      
      {/* Top Banner / Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
              Academic Year 2024-25
            </span>
            <h2 className="text-sm font-bold text-slate-800">
              Department of CSBS — Student LeetCode Activity & Practice Benchmarks
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous algorithmic problem solving analytics, contest tracking, and intervention monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenAddStudent}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
          <button
            onClick={onOpenBatchSync}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Fetch All Data</span>
          </button>
        </div>
      </div>

      {/* 8 TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        
        {/* KPI 1: Total Students */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Students</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {summary.total_students}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Enrolled CSBS
          </div>
        </div>

        {/* KPI 2: Active Students */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active (14d)</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {summary.active_students}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            {Math.round((summary.active_students / (summary.total_students || 1)) * 100)}% active rate
          </div>
        </div>

        {/* KPI 3: Inactive Students */}
        <div 
          onClick={() => onNavigateTab('intervention')}
          className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200 hover:border-red-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inactive</span>
            <UserX className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">
            {summary.inactive_students}
          </div>
          <div className="text-[10px] text-red-500/80 font-medium mt-0.5">
            &gt;14d no practice
          </div>
        </div>

        {/* KPI 4: Total Solved */}
        <div className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Solved</span>
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {summary.total_problems_solved.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Dept Solved
          </div>
        </div>

        {/* KPI 5: Average Problems */}
        <div className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Solved</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {summary.avg_problems_per_student}
          </div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">
            Target: 150+
          </div>
        </div>

        {/* KPI 6: Average Contest Rating */}
        <div className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Rating</span>
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {summary.avg_contest_rating || '1350'}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Participants
          </div>
        </div>

        {/* KPI 7: Most Improved */}
        <div 
          onClick={() => summary.most_improved_student && onSelectStudent(summary.most_improved_student.id)}
          className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider truncate">Most Improved</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 mt-1 truncate">
            {summary.most_improved_student?.name.split(' ')[0] || 'Aarav'}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            +{summary.most_improved_student?.problems_added || 28} this mo
          </div>
        </div>

        {/* KPI 8: Highest Solver */}
        <div 
          onClick={() => summary.highest_problem_solver && onSelectStudent(summary.highest_problem_solver.id)}
          className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider truncate">Top Solver</span>
            <Award className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 mt-1 truncate">
            {summary.highest_problem_solver?.name.split(' ')[0] || 'Siddharth'}
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
            {summary.highest_problem_solver?.total_solved || 308} Solved
          </div>
        </div>

      </div>

      {/* FACULTY INSIGHTS CARD */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-700">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Faculty Automated Analytics & Insights</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {summary.insights.map((insight, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2 leading-relaxed font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 8 CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Chart 1: Problems Solved by Student (Top Solvers) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top Problem Solvers</h3>
              <p className="text-[11px] text-slate-500">Department leaders by verified total solved</p>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Full Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSolversData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="easy" name="Easy" stackId="a" fill="#10b981" />
                <Bar dataKey="medium" name="Medium" stackId="a" fill="#f59e0b" />
                <Bar dataKey="hard" name="Hard" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Easy / Medium / Hard Distribution */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Difficulty Distribution</h3>
            <p className="text-[11px] text-slate-500">Total department questions solved by difficulty tier</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Problems Solved Over Time */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Historical Solved Progression</h3>
            <p className="text-[11px] text-slate-500">Cumulative department problem volume over snapshot capture dates</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="total_problems" name="Total Solved" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Contest Rating Progression Trend */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Contest Rating Progression</h3>
            <p className="text-[11px] text-slate-500">Average department contest rating benchmark over time</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line type="monotone" dataKey="avg_rating" name="Avg Contest Rating" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                <Line type="monotone" dataKey="avg_problems" name="Avg Problems / Student" stroke="#0284c7" strokeWidth={2} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Section Comparison */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Section Comparison (A vs B vs C)</h3>
              <p className="text-[11px] text-slate-500">Average problems and engagement by classroom section</p>
            </div>
            <button
              onClick={() => onNavigateTab('sections')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="section" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="avgProblems" name="Avg Problems / Student" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgEngagement" name="Avg CSBS Engagement" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Weekly Activity Level */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Student Activity Status</h3>
            <p className="text-[11px] text-slate-500">Distribution of active vs inactive students across sections</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="section" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="active_students" name="Active (≤14d)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inactive_students" name="Inactive (>14d)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: Monthly Improvement (+Problems) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Surge Leaders</h3>
              <p className="text-[11px] text-slate-500">Students with the highest 30-day problem count increase</p>
            </div>
            <button
              onClick={() => onNavigateTab('progress')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Most Improved</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyImpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="added" name="Problems Added (Month)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 8: Students Grouped by Performance Tier */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Performance Tier Distribution</h3>
            <p className="text-[11px] text-slate-500">Beginner (0-49), Developing (50-99), Proficient (100-199), Advanced (200+)</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" name="Students in Tier" fill="#2563eb" radius={[4, 4, 0, 0]}>
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
