import React from 'react';
import { 
  GraduationCap, 
  RefreshCw, 
  Download, 
  Activity,
  LogOut,
  User,
  Menu
} from 'lucide-react';
import { BatchFetchProgress, AuthUser } from '../types';

interface HeaderProps {
  onOpenBatchSync: () => void;
  onOpenPrivacy?: () => void;
  batchProgress?: BatchFetchProgress;
  onRefreshCurrentView?: () => void;
  isRefreshing?: boolean;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBatchSync,
  onOpenPrivacy,
  batchProgress,
  onRefreshCurrentView,
  isRefreshing,
  currentUser,
  onLogout,
  onToggleSidebar,
}) => {
  const isStaff = currentUser?.role === 'staff';

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 text-slate-800 sticky top-0 z-30 flex items-center px-3 sm:px-6 shadow-2xs">
      <div className="w-full flex items-center justify-between min-w-0">
        
        {/* Portal Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden transition-colors cursor-pointer shrink-0"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              {isStaff ? 'Faculty Dashboard' : 'Student Portal'}
            </h1>
            <span className="hidden sm:inline text-xs text-slate-400 font-semibold truncate">
              • KGiSL Institute of Technology (CSBS)
            </span>
          </div>
        </div>

        {/* Right side: User & Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {isStaff && batchProgress?.is_running && (
            <button
              onClick={onOpenBatchSync}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse hover:bg-amber-100 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing ({batchProgress.processed}/{batchProgress.total})</span>
            </button>
          )}

          {isStaff && onRefreshCurrentView && (
            <button
              onClick={onRefreshCurrentView}
              disabled={isRefreshing}
              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
            </button>
          )}

          {isStaff && (
            <>
              <button
                onClick={onOpenBatchSync}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer"
                title="Synchronize public LeetCode profiles"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${batchProgress?.is_running ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Fetch All Data</span>
                <span className="sm:hidden">Fetch</span>
              </button>

              <a
                href="/api/reports/excel"
                download="CSBS_LeetCode_Master_Report.xlsx"
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
                title="Download Excel Report"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export XLS</span>
              </a>
            </>
          )}



          {/* User Profile Badge */}
          {currentUser && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {currentUser.role === 'staff' ? 'Faculty Staff' : `Student (${currentUser.student?.register_no || currentUser.username})`}
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

