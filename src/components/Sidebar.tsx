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
    { id: 'tracks', label: 'Daily POTD & Tracks', icon: Flame, badge: '🔥', badgeColor: 'bg-orange-500/20 text-orange-400' },
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
    <aside className="w-full md:w-56 bg-[#0f172a] text-white flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 hidden md:block">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-xs">
            L
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-tight text-white">CSBS Tracker</div>
            <div className="text-[10px] text-slate-400 font-medium">KGiSL Institute of Tech</div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        
        {/* Analytics Group */}
        <div>
          <div className="text-[10px] uppercase text-slate-500 font-bold px-2 py-1">
            Analytics
          </div>
          <div className="space-y-0.5 mt-1">
            {analyticsItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Management Group */}
        <div>
          <div className="text-[10px] uppercase text-slate-500 font-bold px-2 py-1">
            Management
          </div>
          <div className="space-y-0.5 mt-1">
            {managementItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </nav>

      {/* Connection / Status Footer */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[11px] font-medium">API: Connected</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">v2.1</span>
      </div>
    </aside>
  );
};
