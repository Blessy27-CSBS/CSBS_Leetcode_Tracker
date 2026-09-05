import React from 'react';
import { 
  GraduationCap, 
  RefreshCw, 
  ShieldCheck, 
  Download, 
  Activity,
  Layers,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';
import { BatchFetchProgress, AuthUser } from '../types';

interface HeaderProps {
  onOpenBatchSync: () => void;
  onOpenPrivacy: () => void;
  batchProgress?: BatchFetchProgress;
  onRefreshCurrentView?: () => void;
  isRefreshing?: boolean;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBatchSync,
  onOpenPrivacy,
  batchProgress,
  onRefreshCurrentView,
  isRefreshing,
  currentUser,
  onLogout,
}) => {
  const isStaff = currentUser?.role === 'staff';

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 text-slate-800 sticky top-0 z-30 flex items-center px-4 sm:px-6 shadow-2xs">
      <div className="w-full flex items-center justify-between">
        
        {/* Institution & Dept branding */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-xs shadow-purple-600/20">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
              {isStaff ? 'Faculty Dashboard' : 'Student Portal'}
            </h1>
            <div className="hidden sm:flex items-center space-x-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">
                • &nbsp; KGiSL Institute of Technology (CSBS)
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isStaff && batchProgress?.is_running && (
            <button
              onClick={onOpenBatchSync}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse hover:bg-amber-100 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing ({batchProgress.processed}/{batchProgress.total})</span>
            </button>
          )}

          {isStaff && onRefreshCurrentView && (
            <button
              onClick={onRefreshCurrentView}
              disabled={isRefreshing}
              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
            </button>
          )}

          {isStaff && (
            <>
              <button
                onClick={onOpenBatchSync}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-600/20 transition-all cursor-pointer"
                title="Synchronize public LeetCode profiles"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${batchProgress?.is_running ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Fetch All Data</span>
                <span className="sm:hidden">Fetch</span>
              </button>

              <a
                href="/api/reports/excel"
                download="CSBS_LeetCode_Master_Report.xlsx"
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
                title="Download 9-Sheet Excel Master Report"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export XLS</span>
              </a>
            </>
          )}

          <button
            onClick={onOpenPrivacy}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title="Data Privacy & Compliance Notice"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* User Profile / Logout badge */}
          {currentUser && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {currentUser.role === 'staff' ? '👨‍🏫 Staff' : `🎓 Student (${currentUser.student?.register_no || currentUser.username})`}
                </span>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

