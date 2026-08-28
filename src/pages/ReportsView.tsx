import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  FileText, 
  Layers, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Building,
  GraduationCap
} from 'lucide-react';
import { DashboardSummary, SectionStat, StudentWithLatest } from '../types';

interface ReportsViewProps {
  summary: DashboardSummary;
  sectionStats: SectionStat[];
  students: StudentWithLatest[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  summary,
  sectionStats,
  students,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Department Reports & Comprehensive Data Exports
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Download institutional accreditation spreadsheets, monthly progress summaries, and mentor intervention sheets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: 9-Sheet Master Excel */}
        <div className="p-4 rounded-xl bg-white border border-emerald-300 hover:border-emerald-500 transition-all shadow-2xs flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              Complete 9-Sheet Master Workbook
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Includes KPI Summary, Student Master, Leaderboard, Section Stats, Batch Stats, Intervention Queue, Most Improved, Topic Skills Matrix, and Historical Timeline.
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                .XLSX Format (Microsoft Excel)
              </span>
            </div>
          </div>

          <a
            href="/api/reports/excel"
            download="CSBS_LeetCode_Master_Report.xlsx"
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Master Excel</span>
          </a>
        </div>

        {/* Card 2: Student Master CSV */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-2xs flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              Student Master Record (CSV)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lightweight comma-separated file with all current student data, latest problem counts (Easy/Medium/Hard), CSBS scores, and mentor allocations.
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                .CSV Format (Universal)
              </span>
            </div>
          </div>

          <a
            href="/api/reports/csv"
            download="CSBS_Student_Master.csv"
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Roster</span>
          </a>
        </div>

        {/* Card 3: Bulk Import Blank Template */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 transition-all shadow-2xs flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              Roster Import Template
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pre-formatted Excel sheet with column headers and sample data for bulk-uploading new student cohorts and register numbers.
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                Blank Roster Blueprint
              </span>
            </div>
          </div>

          <a
            href="/api/students/template?format=xlsx"
            download="CSBS_Student_Import_Template.xlsx"
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Blank Template</span>
          </a>
        </div>

      </div>

      {/* PRINTABLE EXECUTIVE SUMMARY */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-5 print:border-none print:shadow-none print:p-0">
        <div className="border-b border-slate-200 pb-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-8 h-8 text-amber-500" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600">
                  KGiSL Institute of Technology
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Department of Computer Science and Business Systems (CSBS)
                </h3>
                <p className="text-xs text-slate-500">
                  Official Academic Coding Progress & LeetCode Practice Assessment
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>Academic Year: 2024-2025</div>
            </div>
          </div>
        </div>

        {/* Executive summary KPI table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Total CSBS Enrolled</div>
            <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">{summary.total_students}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Active Practice Rate</div>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
              {Math.round((summary.active_students / (summary.total_students || 1)) * 100)}% ({summary.active_students} students)
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Cumulative Solved</div>
            <div className="text-xl font-bold font-mono text-blue-600 mt-0.5">{summary.total_problems_solved.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Average Solved / Student</div>
            <div className="text-xl font-bold font-mono text-sky-600 mt-0.5">{summary.avg_problems_per_student}</div>
          </div>
        </div>

        {/* Section Snapshot Table */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Classroom Section Benchmarks
          </h4>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Enrolled</th>
                <th className="py-2.5 px-3">Active (≤14d)</th>
                <th className="py-2.5 px-3">Total Solved</th>
                <th className="py-2.5 px-3">Avg Solved</th>
                <th className="py-2.5 px-3">Avg CSBS Score</th>
                <th className="py-2.5 px-3">Top Solver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {sectionStats.map(s => (
                <tr key={s.section} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-semibold text-slate-800">Section {s.section}</td>
                  <td className="py-2 px-3 font-mono">{s.total_students}</td>
                  <td className="py-2 px-3 font-mono text-emerald-600 font-semibold">{s.active_students}</td>
                  <td className="py-2 px-3 font-mono">{s.total_problems}</td>
                  <td className="py-2 px-3 font-mono">{s.avg_problems}</td>
                  <td className="py-2 px-3 font-mono text-blue-600 font-semibold">{s.avg_engagement}/100</td>
                  <td className="py-2 px-3">{s.top_performer?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
