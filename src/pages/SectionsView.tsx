import React from 'react';
import { motion } from 'motion/react';
import { 
  Grid, 
  Users, 
  Award,
  GraduationCap,
  Trophy,
  Activity,
  Flame
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { SectionStat, BatchStat, StudentWithLatest } from '../types';

interface SectionsViewProps {
  sectionStats?: SectionStat[];
  batchStats: BatchStat[];
  students?: StudentWithLatest[];
  onSelectStudent: (id: string) => void;
}

export const SectionsView: React.FC<SectionsViewProps> = ({
  batchStats,
  students = [],
  onSelectStudent,
}) => {
  // Aggregate Cohort Stats by Academic Year (II Year, III Year, IV Year)
  const academicYears = ['II', 'III', 'IV'];

  const normalizeYear = (yr?: string): string => {
    const clean = (yr || '').toUpperCase().trim();
    if (clean === '1' || clean === '1ST' || clean === 'I' || clean === 'I YEAR') return 'I';
    if (clean === '2' || clean === '2ND' || clean === 'II' || clean === 'II YEAR') return 'II';
    if (clean === '3' || clean === '3RD' || clean === 'III' || clean === 'III YEAR') return 'III';
    if (clean === '4' || clean === '4TH' || clean === 'IV' || clean === 'IV YEAR') return 'IV';
    return clean;
  };

  const yearCohortStats = academicYears.map(yr => {
    const yrStudents = students.filter(s => normalizeYear(s.year) === yr);
    const batchInfo = batchStats.find(b => normalizeYear(b.year) === yr);

    const totalStudents = yrStudents.length || batchInfo?.total_students || 0;
    const activeStudents = yrStudents.length > 0 
      ? yrStudents.filter(s => s.days_inactive !== undefined ? s.days_inactive <= 14 : (s.latest_snapshot?.activity_status === 'Active')).length
      : batchInfo?.active_students || 0;

    const totalSolved = yrStudents.reduce((acc, s) => acc + (s.latest_snapshot?.total_solved || 0), 0);
    const avgProblems = totalStudents > 0 ? Math.round(totalSolved / totalStudents) : (batchInfo?.avg_problems || 0);
    
    const avgEngagement = totalStudents > 0
      ? Math.round(yrStudents.reduce((acc, s) => acc + (s.latest_snapshot?.engagement_score || 0), 0) / totalStudents)
      : (batchInfo?.avg_engagement || 0);

    const ratedStudents = yrStudents.filter(s => (s.latest_snapshot?.contest_rating || 0) > 0);
    const avgRating = ratedStudents.length > 0
      ? Math.round(ratedStudents.reduce((acc, s) => acc + (s.latest_snapshot?.contest_rating || 0), 0) / ratedStudents.length)
      : (batchInfo?.avg_rating || 0);

    const topStudent = [...yrStudents].sort((a, b) => (b.latest_snapshot?.total_solved || 0) - (a.latest_snapshot?.total_solved || 0))[0];
    const hasTopSolver = topStudent && (topStudent.latest_snapshot?.total_solved || 0) > 0;

    return {
      year: yr,
      yearLabel: `${yr} Year Cohort`,
      totalStudents,
      activeStudents,
      activePct: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
      avgProblems,
      avgEngagement,
      totalSolved,
      avgRating,
      topPerformer: hasTopSolver ? {
        id: topStudent.id,
        name: topStudent.student_name,
        total_solved: topStudent.latest_snapshot?.total_solved || 0
      } : null,
    };
  });

  // Chart data for Academic Year Benchmarks
  const batchChartData = yearCohortStats.map(b => ({
    batch: `${b.year} Year`,
    avgProblems: b.avgProblems,
    avgEngagement: b.avgEngagement,
    avgRating: b.avgRating,
    totalSolved: b.totalSolved,
    students: b.totalStudents,
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
      >
        <div>
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-black text-slate-900">
              Academic Years Benchmark & Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Comparative analysis of problem practice, contest ratings, and engagement across Academic Years (II Year, III Year, IV Year)
          </p>
        </div>
      </motion.div>

      {/* ACADEMIC YEAR COHORT BENCHMARK CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {yearCohortStats.map((s, idx) => {
          return (
            <motion.div
              key={s.year}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-black text-sm shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base tracking-tight">{s.yearLabel}</h3>
                    <p className="text-xs text-slate-500 font-medium">{s.totalStudents} Enrolled Students</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  {s.activePct}% Active
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Avg Solved</div>
                  <div className="text-xl font-black font-mono text-blue-600 mt-0.5">{s.avgProblems}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Avg CSBS Score</div>
                  <div className="text-xl font-black font-mono text-emerald-600 mt-0.5">{s.avgEngagement}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Solved</div>
                  <div className="text-xl font-black font-mono text-slate-800 mt-0.5">{s.totalSolved}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Avg Rating</div>
                  <div className="text-xl font-black font-mono text-amber-600 mt-0.5">{s.avgRating || 'N/A'}</div>
                </div>
              </div>

              {/* Year Top Solver */}
              {s.topPerformer ? (
                <div
                  onClick={() => onSelectStudent(s.topPerformer!.id)}
                  className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between cursor-pointer hover:bg-purple-100/60 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Year Top Solver</div>
                      <div className="text-xs font-black text-slate-900">{s.topPerformer.name}</div>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xs text-purple-700 bg-white border border-purple-200 px-2.5 py-1 rounded-lg shadow-2xs">
                    {s.topPerformer.total_solved} Solved
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Award className="w-4 h-4 text-slate-300 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year Top Solver</div>
                      <div className="text-xs font-medium text-slate-400 italic">No solver records yet</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    0 Solved
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Academic Year Performance Benchmark */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 hover:shadow-md transition-shadow"
        >
          <div>
            <h3 className="text-sm font-black text-slate-900">Academic Year Performance Benchmark</h3>
            <p className="text-xs text-slate-500 font-medium">Average problems solved vs CSBS Engagement Score across class cohorts</p>
          </div>
          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchChartData}>
                <defs>
                  <linearGradient id="batchAvgProbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="batchAvgEngGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="batch" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="avgProblems" name="Avg Problems / Student" fill="url(#batchAvgProbGrad)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                <Bar dataKey="avgEngagement" name="Avg CSBS Score" fill="url(#batchAvgEngGrad)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Academic Year Contest & Total Solved Benchmark */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 hover:shadow-md transition-shadow"
        >
          <div>
            <h3 className="text-sm font-black text-slate-900">Academic Year Rating & Output Benchmark</h3>
            <p className="text-xs text-slate-500 font-medium">Total problems solved & average contest rating progression</p>
          </div>
          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchChartData}>
                <defs>
                  <linearGradient id="batchTotalSolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="batchRatingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="batch" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="totalSolved" name="Total Problems Solved" fill="url(#batchTotalSolvedGrad)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                <Bar dataKey="avgRating" name="Avg Contest Rating" fill="url(#batchRatingGrad)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

    </div>
  );
};
