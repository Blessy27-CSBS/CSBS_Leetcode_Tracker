import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Flame, 
  Compass, 
  Zap, 
  ArrowUpRight, 
  BarChart2,
  ChevronRight,
  Award,
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { DashboardSummary, SectionStat, BatchStat, StudentWithLatest } from '../types';
import { formatSectionName } from '../utils/formatters';

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

const formatName = (str?: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary: rawSummary,
  sectionStats: rawSectionStats,
  batchStats,
  timeline: rawTimeline,
  students,
  onOpenBatchSync,
  onOpenAddStudent,
  onSelectStudent,
  onNavigateTab,
}) => {
  // Resilient Metric Calculations (Prevents blank/0 charts on Vercel cold starts or refresh)
  const totalStudents = Math.max(rawSummary.total_students || 0, students.length);
  
  const computedTotalSolved = Math.max(
    rawSummary.total_problems_solved || 0,
    students.reduce((acc, s) => acc + (s.latest_snapshot?.total_solved || 0), 0)
  );

  const computedActiveStudents = Math.max(
    rawSummary.active_students || 0,
    students.filter(s => (s.latest_snapshot?.total_solved || 0) > 0 || (s.latest_snapshot?.streak || 0) > 0 || (s.latest_snapshot?.engagement_score || 0) > 0).length
  );

  const activeRate = totalStudents > 0 ? Math.round((computedActiveStudents / totalStudents) * 100) : 0;
  const targetCompletion = totalStudents > 0 ? Math.min(100, Math.round((computedTotalSolved / (totalStudents * 50)) * 100)) : 0;
  const improvedStudentsCount = students.filter(s => (s.problems_added_month || 0) > 0 || (s.latest_snapshot?.total_solved || 0) > 0).length;
  const growthRate = totalStudents > 0 ? Math.round((improvedStudentsCount / totalStudents) * 100) : 0;

  const totalEngagementScoreSum = students.reduce((acc, s) => acc + (s.latest_snapshot?.engagement_score || 0), 0);
  const avgEngagementScore = students.length > 0 ? Math.min(100, Math.round(totalEngagementScoreSum / students.length)) : 0;

  // Dynamic Section Stats (Section A: II Year, B: III Year, C: IV Year)
  const sectionStats: SectionStat[] = ['A', 'B', 'C'].map(sec => {
    const secStudents = students.filter(s => s.section === sec);
    const existing = rawSectionStats.find(s => s.section === sec);
    if (existing && existing.total_students > 0 && existing.avg_problems > 0) return existing;

    const totalSolvedSec = secStudents.reduce((acc, s) => acc + (s.latest_snapshot?.total_solved || 0), 0);
    const activeCountSec = secStudents.filter(s => (s.latest_snapshot?.total_solved || 0) > 0).length;
    const avgProblems = secStudents.length > 0 ? Math.round(totalSolvedSec / secStudents.length) : 0;
    const avgRating = secStudents.length > 0 ? Math.round(secStudents.reduce((acc, s) => acc + (s.latest_snapshot?.contest_rating || 0), 0) / secStudents.length) : 0;
    const avgEngagement = secStudents.length > 0 ? Math.round(secStudents.reduce((acc, s) => acc + (s.latest_snapshot?.engagement_score || 0), 0) / secStudents.length) : 0;

    return {
      section: sec,
      total_students: secStudents.length > 0 ? secStudents.length : (existing?.total_students || 0),
      active_students: activeCountSec,
      avg_problems: avgProblems,
      avg_rating: avgRating,
      avg_engagement: avgEngagement,
      highest_solved: Math.max(0, ...secStudents.map(s => s.latest_snapshot?.total_solved || 0)),
    };
  });

  const secA = sectionStats.find(s => s.section === 'A');
  const secB = sectionStats.find(s => s.section === 'B');
  const secC = sectionStats.find(s => s.section === 'C');

  const maxAvgProblems = Math.max(1, ...sectionStats.map(s => s.avg_problems || 0));

  const getActivePct = (s?: SectionStat) => s && s.total_students > 0 ? Math.round((s.active_students / s.total_students) * 100) : 0;
  const getRatingPct = (s?: SectionStat) => s && s.total_students > 0 ? Math.min(100, Math.round(((s.avg_rating || 0) / 2000) * 100)) : 0;
  const getEngageScore = (s?: SectionStat) => s && s.total_students > 0 ? Math.min(100, Math.round(s.avg_engagement || 0)) : 0;
  const getAvgProblemsPct = (s?: SectionStat) => s && s.total_students > 0 ? Math.min(100, Math.round((s.avg_problems / maxAvgProblems) * 100)) : 0;

  const radarData = [
    { metric: 'Avg Problems', 'II Year': getAvgProblemsPct(secA), 'III Year': getAvgProblemsPct(secB), 'IV Year': getAvgProblemsPct(secC) },
    { metric: 'Active Rate', 'II Year': getActivePct(secA), 'III Year': getActivePct(secB), 'IV Year': getActivePct(secC) },
    { metric: 'Contest Rating', 'II Year': getRatingPct(secA), 'III Year': getRatingPct(secB), 'IV Year': getRatingPct(secC) },
    { metric: 'Engagement', 'II Year': getEngageScore(secA), 'III Year': getEngageScore(secB), 'IV Year': getEngageScore(secC) },
  ];

  // Tier distribution (dynamic fallback from students array)
  const denom = totalStudents || 1;
  const tierCounts = {
    Advanced: students.filter(s => (s.latest_snapshot?.total_solved || 0) >= 200).length || rawSummary.tier_distribution?.Advanced || 0,
    Proficient: students.filter(s => (s.latest_snapshot?.total_solved || 0) >= 100 && (s.latest_snapshot?.total_solved || 0) < 200).length || rawSummary.tier_distribution?.Proficient || 0,
    Developing: students.filter(s => (s.latest_snapshot?.total_solved || 0) >= 50 && (s.latest_snapshot?.total_solved || 0) < 100).length || rawSummary.tier_distribution?.Developing || 0,
    Beginner: students.filter(s => (s.latest_snapshot?.total_solved || 0) < 50).length || rawSummary.tier_distribution?.Beginner || 0,
  };

  const pyramidData = [
    { name: 'Advanced (200+)', pct: Math.round((tierCounts.Advanced / denom) * 100), count: tierCounts.Advanced, color: '#7c3aed' },
    { name: 'Proficient (100-199)', pct: Math.round((tierCounts.Proficient / denom) * 100), count: tierCounts.Proficient, color: '#8b5cf6' },
    { name: 'Developing (50-99)', pct: Math.round((tierCounts.Developing / denom) * 100), count: tierCounts.Developing, color: '#ec4899' },
    { name: 'Beginner (0-49)', pct: Math.round((tierCounts.Beginner / denom) * 100), count: tierCounts.Beginner, color: '#f43f5e' },
  ];

  // Top Solvers Data: Sort descending by solved count so top problem solvers (e.g. Abirami, Maria, etc.) appear first
  const topSolversData = [...students]
    .sort((a, b) => {
      const solvedA = a.latest_snapshot?.total_solved || 0;
      const solvedB = b.latest_snapshot?.total_solved || 0;
      if (solvedB !== solvedA) return solvedB - solvedA;
      return (b.latest_snapshot?.engagement_score || 0) - (a.latest_snapshot?.engagement_score || 0);
    })
    .slice(0, 7)
    .map(s => ({
      name: formatName(s.student_name.split(' ')[0]),
      fullName: formatName(s.student_name),
      id: s.id,
      solved: s.latest_snapshot?.total_solved || 0,
      easy: s.latest_snapshot?.easy || 0,
      medium: s.latest_snapshot?.medium || 0,
      hard: s.latest_snapshot?.hard || 0,
      section: formatSectionName(s.section),
    }));

  // Top overall student leader
  const topStudentLeader = [...students].sort((a, b) => (b.latest_snapshot?.total_solved || 0) - (a.latest_snapshot?.total_solved || 0))[0];

  // Difficulty distribution
  const easyCount = Math.max(rawSummary.difficulty_distribution?.easy || 0, students.reduce((sum, s) => sum + (s.latest_snapshot?.easy || 0), 0));
  const mediumCount = Math.max(rawSummary.difficulty_distribution?.medium || 0, students.reduce((sum, s) => sum + (s.latest_snapshot?.medium || 0), 0));
  const hardCount = Math.max(rawSummary.difficulty_distribution?.hard || 0, students.reduce((sum, s) => sum + (s.latest_snapshot?.hard || 0), 0));

  const difficultyPieData = [
    { name: 'Easy', value: easyCount, color: '#7c3aed' },
    { name: 'Medium', value: mediumCount, color: '#ec4899' },
    { name: 'Hard', value: hardCount, color: '#f43f5e' },
  ];

  // Timeline fallback
  const timeline = rawTimeline && rawTimeline.length > 0 ? rawTimeline : [
    { date: new Date().toISOString().split('T')[0], total_problems: computedTotalSolved, avg_problems: totalStudents > 0 ? Math.round(computedTotalSolved / totalStudents) : 0, avg_rating: 1400 }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      
      {/* Top Page Header (Clean, unboxed & natural layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Faculty Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Overview of student practice activity across II Year, III Year, and IV Year cohorts.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-slate-100/80 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{totalStudents} Enrolled Students</span>
          </div>
        </div>
      </div>

      {/* Empty State warning if no students uploaded */}
      {totalStudents === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-2xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Student Data Uploaded Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload student roster details via Excel sheet in the Students section to view live analytics.
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* SECTION 1: TOP 4 STAT SUMMARY GAUGES (100% Dynamic)       */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Ring 1: Active Rate */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{activeRate}%</div>
                <div className="text-xs font-bold text-slate-600 mt-0.5">Active Cohort Rate</div>
                <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{computedActiveStudents} Active Solvers</span>
                </div>
              </div>
              <div className="w-14 h-14 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: activeRate, fill: '#7c3aed' }, { value: 100 - activeRate, fill: '#f1f5f9' }]} cx="50%" cy="50%" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      <Cell fill="#7c3aed" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute text-[10px] font-black text-purple-700">{activeRate}%</span>
              </div>
            </motion.div>

            {/* Ring 2: Target Completion Rate */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{targetCompletion}%</div>
                <div className="text-xs font-bold text-slate-600 mt-0.5">Target Progress</div>
                <div className="text-[10px] text-purple-600 font-bold flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{computedTotalSolved} Total Solved</span>
                </div>
              </div>
              <div className="w-14 h-14 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: targetCompletion, fill: '#8b5cf6' }, { value: 100 - targetCompletion, fill: '#f1f5f9' }]} cx="50%" cy="50%" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute text-[10px] font-black text-purple-700">{targetCompletion}%</span>
              </div>
            </motion.div>

            {/* Ring 3: Growth Surge Rate */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{growthRate}%</div>
                <div className="text-xs font-bold text-slate-600 mt-0.5">Monthly Growth</div>
                <div className="text-[10px] text-pink-600 font-bold flex items-center gap-1 mt-1">
                  <Flame className="w-3 h-3" />
                  <span>{improvedStudentsCount} Growing Solvers</span>
                </div>
              </div>
              <div className="w-14 h-14 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: growthRate, fill: '#ec4899' }, { value: 100 - growthRate, fill: '#f1f5f9' }]} cx="50%" cy="50%" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      <Cell fill="#ec4899" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute text-[10px] font-black text-pink-700">{growthRate}%</span>
              </div>
            </motion.div>

            {/* Ring 4: Engagement Index */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{avgEngagementScore}%</div>
                <div className="text-xs font-bold text-slate-600 mt-0.5">CSBS Engagement</div>
                <div className="text-[10px] text-cyan-600 font-bold flex items-center gap-1 mt-1">
                  <Zap className="w-3 h-3" />
                  <span>Live Score Index</span>
                </div>
              </div>
              <div className="w-14 h-14 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: avgEngagementScore, fill: '#06b6d4' }, { value: Math.max(0, 100 - avgEngagementScore), fill: '#f1f5f9' }]} cx="50%" cy="50%" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      <Cell fill="#06b6d4" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute text-[10px] font-black text-cyan-700">{avgEngagementScore}%</span>
              </div>
            </motion.div>

          </div>

          {/* ========================================================= */}
          {/* SECTION 2: HERO CHARTS (PROGRESSION WAVE & TOP SOLVERS BAR) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* HERO CHART 1: Cumulative Solved Progression Area Wave (Cols 7) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <h3 className="text-sm font-extrabold text-slate-900">Cumulative Solved Progression & Benchmark Wave</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Dual-tone wave chart tracking student solved volume vs benchmark curve</p>
                </div>
                <span className="text-[11px] font-black text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
                  {computedTotalSolved} Total Solved
                </span>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="wavePurpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="wavePinkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.15)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total_problems" 
                      name="Total Solved Wave" 
                      stroke="#7c3aed" 
                      strokeWidth={3.5} 
                      fillOpacity={1} 
                      fill="url(#wavePurpleGrad)" 
                      isAnimationActive={true}
                      animationDuration={1800}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avg_rating" 
                      name="Class Target Wave" 
                      stroke="#ec4899" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#wavePinkGrad)" 
                      isAnimationActive={true}
                      animationDuration={1800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* HERO CHART 2: Top Problem Solvers Stacked Bar Graph (Cols 5) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    <h3 className="text-sm font-extrabold text-slate-900">Top Problem Solvers Breakdown</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Verified easy, medium & hard problem counts</p>
                </div>
                <button
                  onClick={() => onNavigateTab('leaderboard')}
                  className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center space-x-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <span>Full Board</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSolversData}>
                    <defs>
                      <linearGradient id="easyGradBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                        <stop offset="100%" stopColor="#5b21b6" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="medGradBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                        <stop offset="100%" stopColor="#be185d" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="hardGradBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                        <stop offset="100%" stopColor="#9f1239" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.15)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="easy" name="Easy" stackId="a" fill="url(#easyGradBar)" isAnimationActive={true} animationDuration={1600} />
                    <Bar dataKey="medium" name="Medium" stackId="a" fill="url(#medGradBar)" isAnimationActive={true} animationDuration={1600} />
                    <Bar dataKey="hard" name="Hard" stackId="a" fill="url(#hardGradBar)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1600} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>

          {/* ========================================================= */}
          {/* SECTION 3: RADAR COMPARISON & TIER DISTRIBUTION           */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* CHART 3: Multi-Axis Radar Graph */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">Academic Year Multi-Axis Radar Graph</h3>
                </div>
                <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  II Year vs III Year vs IV Year
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={9} />
                    <Radar name="II Year" dataKey="II Year" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} isAnimationActive={true} animationDuration={1700} />
                    <Radar name="III Year" dataKey="III Year" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} isAnimationActive={true} animationDuration={1700} />
                    <Radar name="IV Year" dataKey="IV Year" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} isAnimationActive={true} animationDuration={1700} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* CHART 4: Performance Tier Pyramid & Difficulty Donut */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-pink-500" />
                  <h3 className="text-sm font-extrabold text-slate-900">Performance Tier Distribution</h3>
                </div>
                <span className="text-xs font-bold text-slate-500">{totalStudents} Total Solvers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Donut Chart (5 cols) */}
                <div className="sm:col-span-5 h-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={difficultyPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value" stroke="none">
                        {difficultyPieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <div className="text-base font-black text-slate-900">{computedTotalSolved}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Solved</div>
                  </div>
                </div>

                {/* Tier Bars (7 cols) */}
                <div className="sm:col-span-7 space-y-3">
                  {pyramidData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>{item.name}</span>
                        <span className="font-mono text-purple-700 font-extrabold">{item.count} ({item.pct}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 1.2, delay: idx * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs font-semibold text-purple-900 flex items-center justify-between mt-2">
                <span>Cohort Active Efficiency</span>
                <span className="font-mono font-black text-purple-700">{activeRate}%</span>
              </div>
            </motion.div>

          </div>

          {/* ========================================================= */}
          {/* SECTION 4: YEAR GROUP PROGRESS & TOP SOLVER SPOTLIGHT      */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Academic Year Group Progress Meters (Cols 7) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Academic Year Group Progress Meters</h3>
                <p className="text-[11px] text-slate-500 font-medium">Completion rates for uploaded II Year, III Year, and IV Year cohorts</p>
              </div>

              <div className="space-y-4 pt-1">
                {sectionStats.map((s, idx) => {
                  const yearLabel = formatSectionName(s.section);
                  const pct = maxAvgProblems > 0 ? Math.min(100, Math.round((s.avg_problems / maxAvgProblems) * 100)) : 0;
                  const color = idx === 0 ? 'from-purple-600 to-indigo-600' : idx === 1 ? 'from-pink-500 to-rose-500' : 'from-cyan-500 to-blue-600';
                  return (
                    <div key={s.section} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-800">{yearLabel} Cohort ({s.total_students} Students)</span>
                        <span className="font-mono font-black text-purple-700">{pct}% Relative Solved Rate</span>
                      </div>
                      <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.4, delay: idx * 0.15 }}
                          className={`h-full rounded-full bg-gradient-to-r ${color}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clean White Stat Card (Cols 5) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 text-slate-800 p-5 rounded-2xl shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md">
                    Top Department Solver
                  </span>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-3">
                  {formatName(topStudentLeader?.student_name || rawSummary.highest_problem_solver?.name) || 'Student Leader'}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Verified {topStudentLeader?.latest_snapshot?.total_solved || rawSummary.highest_problem_solver?.total_solved || 0} Total Solved Questions
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500">Easy</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{easyCount}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500">Medium</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{mediumCount}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500">Hard</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{hardCount}</div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
