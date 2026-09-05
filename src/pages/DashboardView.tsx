import React from 'react';
import { motion } from 'motion/react';
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
  Beginner: '#6366f1',   // Electric Indigo Blue (High Contrast with Rose Surge)
  Developing: '#06b6d4', // Bright Cyan / Sky Blue
  Proficient: '#f59e0b', // Golden Amber
  Advanced: '#10b981',   // Emerald Green
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Top Banner / Actions Bar with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-black text-slate-900">
              Department of CSBS — LeetCode Algorithmic Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time problem metrics, contest tracking, student mastery progression, and intervention monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={onOpenAddStudent}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-purple-600" />
            <span>Add Student</span>
          </button>
          <button
            onClick={onOpenBatchSync}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-md shadow-purple-600/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Fetch All Data</span>
          </button>
        </div>
      </div>

      {/* 8 TOP KPI CARDS with Glassmorphism and Themed Icons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        
        {/* KPI 1: Total Students */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Students</span>
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:scale-110 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.total_students}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">
            Enrolled CSBS
          </div>
        </div>

        {/* KPI 2: Active Students */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active (14d)</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.active_students}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">
            {Math.round((summary.active_students / (summary.total_students || 1)) * 100)}% active rate
          </div>
        </div>

        {/* KPI 3: Inactive Students */}
        <div 
          onClick={() => onNavigateTab('intervention')}
          className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200/80 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Inactive</span>
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-110 transition-transform">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {summary.inactive_students}
          </div>
          <div className="text-[10px] text-rose-500 font-semibold mt-1">
            &gt;14d inactive
          </div>
        </div>

        {/* KPI 4: Total Solved */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Solved</span>
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform">
              <Code2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.total_problems_solved.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">
            Class Total
          </div>
        </div>

        {/* KPI 5: Average Problems */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Avg Solved</span>
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.avg_problems_per_student}
          </div>
          <div className="text-[10px] text-indigo-600 font-bold mt-1">
            Per Student
          </div>
        </div>

        {/* KPI 6: Average Contest Rating */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Avg Rating</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-110 transition-transform">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.avg_contest_rating || '1350'}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">
            Contestants
          </div>
        </div>

        {/* KPI 7: Most Improved */}
        <div 
          onClick={() => summary.most_improved_student && onSelectStudent(summary.most_improved_student.id)}
          className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">Most Improved</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-black text-slate-900 mt-2 truncate">
            {summary.most_improved_student?.name.split(' ')[0] || 'Aarav'}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">
            +{summary.most_improved_student?.problems_added || 28} this mo
          </div>
        </div>

        {/* KPI 8: Highest Solver */}
        <div 
          onClick={() => summary.highest_problem_solver && onSelectStudent(summary.highest_problem_solver.id)}
          className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">Top Solver</span>
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:scale-110 transition-transform">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-black text-slate-900 mt-2 truncate">
            {summary.highest_problem_solver?.name.split(' ')[0] || 'Siddharth'}
          </div>
          <div className="text-[10px] text-purple-600 font-bold mt-1">
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

      {/* 8 CHARTS GRID WITH ANIMATIONS & ENHANCED VISUALS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Chart 1: Problems Solved by Student (Top Solvers) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
        >
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
                <defs>
                  <linearGradient id="easyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="mediumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="hardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="easy" name="Easy" stackId="a" fill="url(#easyGrad)" isAnimationActive={true} animationDuration={1400} animationEasing="ease-in-out" />
                <Bar dataKey="medium" name="Medium" stackId="a" fill="url(#mediumGrad)" isAnimationActive={true} animationDuration={1400} animationEasing="ease-in-out" />
                <Bar dataKey="hard" name="Hard" stackId="a" fill="url(#hardGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1400} animationEasing="ease-in-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 2: Easy / Medium / Hard Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
        >
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
                  paddingAngle={4}
                  cornerRadius={6}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-out"
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
        </motion.div>

        {/* Chart 3: Problems Solved Over Time */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
        >
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Historical Solved Progression</h3>
            <p className="text-[11px] text-slate-500">Cumulative department problem volume over snapshot capture dates</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorSolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_problems" 
                  name="Total Solved" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSolvedGrad)" 
                  isAnimationActive={true}
                  animationDuration={1600}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 4: Contest Rating Progression Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
        >
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
                <Line 
                  type="monotone" 
                  dataKey="avg_rating" 
                  name="Avg Contest Rating" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_problems" 
                  name="Avg Problems / Student" 
                  stroke="#0284c7" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#0284c7' }}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 5: Section Comparison */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.32 }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
        >
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
                <defs>
                  <linearGradient id="secProblemsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="secEngageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="section" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="avgProblems" name="Avg Problems / Student" fill="url(#secProblemsGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1400} />
                <Bar dataKey="avgEngagement" name="Avg CSBS Engagement" fill="url(#secEngageGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 6: Weekly Activity Level */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
        >
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Student Activity Status</h3>
            <p className="text-[11px] text-slate-500">Distribution of active vs inactive students across sections</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionStats}>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#15803d" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="inactiveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="section" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="active_students" name="Active (≤14d)" fill="url(#activeGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1400} />
                <Bar dataKey="inactive_students" name="Inactive (>14d)" fill="url(#inactiveGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 7: Monthly Improvement (+Problems) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.48 }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
        >
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
                <defs>
                  <linearGradient id="surgeFlameGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="added" name="Problems Added (Month)" fill="url(#surgeFlameGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 8: Students Grouped by Performance Tier */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.56 }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
        >
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Performance Tier Distribution</h3>
            <p className="text-[11px] text-slate-500">Beginner (0-49), Developing (50-99), Proficient (100-199), Advanced (200+)</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  cornerRadius={6}
                  dataKey="count"
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-tier-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Students`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

    </div>
  );
};
