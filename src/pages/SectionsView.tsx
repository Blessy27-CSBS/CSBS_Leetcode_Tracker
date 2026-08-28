import React from 'react';
import { 
  Grid, 
  Users, 
  UserCheck, 
  Code2, 
  Trophy, 
  TrendingUp, 
  Award,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { SectionStat, BatchStat } from '../types';

interface SectionsViewProps {
  sectionStats: SectionStat[];
  batchStats: BatchStat[];
  onSelectStudent: (id: string) => void;
}

export const SectionsView: React.FC<SectionsViewProps> = ({
  sectionStats,
  batchStats,
  onSelectStudent,
}) => {
  const chartData = sectionStats.map(s => ({
    section: `Section ${s.section}`,
    avgProblems: s.avg_problems,
    avgEngagement: s.avg_engagement,
    avgRating: s.avg_rating,
    activePct: Math.round((s.active_students / (s.total_students || 1)) * 100),
  }));

  const batchChartData = batchStats.map(b => ({
    batch: `${b.year} Year (${b.batch})`,
    avgProblems: b.avg_problems,
    avgEngagement: b.avg_engagement,
    students: b.total_students,
  }));

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Classroom Sections & Academic Batches Comparison
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-sectional analysis of CSBS problem practice, average rating benchmarks, and classroom engagement
          </p>
        </div>
      </div>

      {/* SECTION COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sectionStats.map(s => {
          const activePct = Math.round((s.active_students / (s.total_students || 1)) * 100);
          return (
            <div
              key={s.section}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-2xs space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-sm">
                    {s.section}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Section {s.section}</h3>
                    <p className="text-[10px] text-slate-400">{s.total_students} Enrolled Students</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                  {activePct}% Active
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-medium">Avg Problems</div>
                  <div className="text-lg font-bold font-mono text-blue-600 mt-0.5">{s.avg_problems}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-medium">Avg CSBS Score</div>
                  <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">{s.avg_engagement}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-medium">Total Solved</div>
                  <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">{s.total_problems}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-medium">Avg Rating</div>
                  <div className="text-lg font-bold font-mono text-amber-600 mt-0.5">{s.avg_rating || 'N/A'}</div>
                </div>
              </div>

              {/* Top Performer */}
              {s.top_performer && (
                <div
                  onClick={() => onSelectStudent(s.top_performer!.id)}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400">Section Top Solver</div>
                      <div className="text-xs font-semibold text-slate-800">{s.top_performer.name}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-blue-600">
                    {s.top_performer.total_solved} Solved
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Section Comparison Chart */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Section Performance Benchmark</h3>
            <p className="text-[11px] text-slate-500">Average problems solved vs CSBS Engagement Score</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="section" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="avgProblems" name="Avg Problems / Student" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgEngagement" name="Avg CSBS Score" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Batch / Year Comparison Chart */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Academic Year Benchmark</h3>
            <p className="text-[11px] text-slate-500">Progression across class cohorts (II Year vs III Year vs IV Year)</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="batch" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="avgProblems" name="Avg Solved" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgEngagement" name="Avg CSBS Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
