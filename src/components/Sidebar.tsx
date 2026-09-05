import React from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  TrendingUp,
  Grid,
  AlertCircle,
  FileSpreadsheet,
  Sliders,
  Sparkles,
  Flame
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'contests'
  | 'tracks'
  | 'students'
  | 'leaderboard'
  | 'progress'
  | 'sections'
  | 'intervention'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  interventionCount?: number;
  totalStudents?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  interventionCount = 0,
  totalStudents = 0,
}) => {
  const analyticsItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'contests', label: 'LeetCode Contests', icon: Trophy, badge: null, badgeColor: 'bg-purple-500/20 text-purple-300' },
    { id: 'tracks', label: 'Daily POTD & Tracks', icon: Flame, badge: null, badgeColor: 'bg-orange-500/20 text-orange-400' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, badge: null },
    { id: 'progress', label: 'Most Improved', icon: TrendingUp, badge: null },
    { id: 'sections', label: 'Sections', icon: Grid, badge: null },
  ];

  const managementItems = [
    { id: 'students', label: 'Students', icon: Users, badge: totalStudents ? `${totalStudents}` : null, badgeColor: 'bg-slate-800 text-slate-300' },
    {
      id: 'intervention',
      label: 'Intervention',
      icon: AlertCircle,
      badge: interventionCount > 0 ? `${interventionCount}` : null,
      badgeColor: 'bg-red-500 text-white'
    },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet, badge: null },
    { id: 'settings', label: 'Settings', icon: Sliders, badge: null },
  ];

  return (
    <aside className="w-full md:w-64 bg-white text-slate-800 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-200/90 select-none shadow-2xs z-20 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)]">
      {/* Sidebar Header Badge (Desktop) */}
      <div className="px-4 py-3.5 border-b border-slate-100 hidden md:flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
            CSBS Navigation
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded-md shadow-2xs">
          v2.1
        </span>
      </div>

      {/* Navigation Groups - Vertical on Desktop, Horizontal Scroll on Mobile */}
      <nav className="flex-1 p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-3 md:gap-5 scrollbar-thin">

        {/* Analytics Group */}
        <div className="flex md:flex-col items-center md:items-stretch gap-1 shrink-0">
          <div className="text-[10px] uppercase text-slate-400 font-bold px-2 py-1 tracking-wider hidden md:block">
            Analytics
          </div>
          <div className="flex md:flex-col gap-1">
            {analyticsItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavTab)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 group ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/25'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : (item.badgeColor || 'bg-slate-100 text-slate-600')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider for Mobile */}
        <div className="h-6 w-px bg-slate-200 self-center md:hidden shrink-0" />

        {/* Management Group */}
        <div className="flex md:flex-col items-center md:items-stretch gap-1 shrink-0">
          <div className="text-[10px] uppercase text-slate-400 font-bold px-2 py-1 tracking-wider hidden md:block">
            Management
          </div>
          <div className="flex md:flex-col gap-1">
            {managementItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavTab)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 group ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/25'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : (item.badgeColor || 'bg-slate-100 text-slate-600')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </nav>

      {/* Connection / Status Footer (Desktop only) */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500 hidden md:flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[11px] font-bold text-slate-600">System Online</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono font-bold">API Connected</span>
      </div>
    </aside>
  );
};
