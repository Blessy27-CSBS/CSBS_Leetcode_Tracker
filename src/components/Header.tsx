import React from 'react';
import { 
  GraduationCap, 
  RefreshCw, 
  ShieldCheck, 
  Download, 
  Activity,
  Layers
} from 'lucide-react';
import { BatchFetchProgress } from '../types';

interface HeaderProps {
  onOpenBatchSync: () => void;
  onOpenPrivacy: () => void;
  batchProgress?: BatchFetchProgress;
  onRefreshCurrentView?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBatchSync,
  onOpenPrivacy,
  batchProgress,
  onRefreshCurrentView,
  isRefreshing,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 flex items-center px-4 sm:px-6 shadow-2xs">
      <div className="w-full mx-auto flex items-center justify-between">
        
        {/* Institution & Dept branding */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
              Faculty Dashboard
            </h1>
            <div className="hidden sm:flex items-center space-x-1.5">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-600 border border-slate-200">
                CSBS • AY 2024-25
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                KGiSL Institute of Technology
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {batchProgress?.is_running && (
            <button
              onClick={onOpenBatchSync}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse hover:bg-amber-100 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing ({batchProgress.processed}/{batchProgress.total})</span>
            </button>
          )}

          {onRefreshCurrentView && (
            <button
              onClick={onRefreshCurrentView}
              disabled={isRefreshing}
              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          )}

          <button
            onClick={onOpenBatchSync}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
            title="Synchronize public LeetCode profiles"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${batchProgress?.is_running ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Fetch All Data</span>
            <span className="sm:hidden">Fetch</span>
          </button>

          <a
            href="/api/reports/excel"
            download="CSBS_LeetCode_Master_Report.xlsx"
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs transition-all"
            title="Download 9-Sheet Excel Master Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export XLS</span>
          </a>

          <button
            onClick={onOpenPrivacy}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title="Data Privacy & Compliance Notice"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
