import React from 'react';
import {
  Circle,
  Disc
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'quest'
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
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  interventionCount = 0,
  totalStudents = 0,
  isOpen = true,
  onClose,
}) => {
  const analyticsItems: { id: NavTab; label: string; badge: string | null; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', badge: null },
    { id: 'quest', label: 'DSA Quest Tracker', badge: null, badgeColor: 'bg-emerald-600 text-white' },
    { id: 'contests', label: 'LeetCode Contests', badge: null },
    { id: 'tracks', label: 'Daily POTD & Tracks', badge: null },
    { id: 'leaderboard', label: 'Leaderboard', badge: null },
    { id: 'progress', label: 'Most Improved', badge: null },
    { id: 'sections', label: 'Academic Years', badge: null },
  ];

  const managementItems: { id: NavTab; label: string; badge: string | null; badgeColor?: string }[] = [
    { id: 'students', label: 'Students', badge: totalStudents ? `${totalStudents}` : null, badgeColor: 'bg-slate-700 text-slate-200' },
    {
      id: 'intervention',
      label: 'Intervention',
      badge: interventionCount > 0 ? `${interventionCount}` : null,
      badgeColor: 'bg-rose-600 text-white'
    },
    { id: 'reports', label: 'Reports', badge: null },
    { id: 'settings', label: 'Settings', badge: null },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Main Sidebar Container */}
      <aside className={`w-64 bg-[#1e293b] text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none z-50 fixed inset-y-0 left-0 md:sticky md:top-14 md:z-20 md:h-[calc(100vh-3.5rem)] transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>

        {/* Sidebar Header */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
              CSBS Navigation
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
              title="Close Menu"
            >
              <span className="text-xs font-bold font-mono">✕</span>
            </button>
          )}
        </div>

        {/* Navigation Links with Radio Bullet Style */}
        <nav className="flex-1 p-3 overflow-y-auto flex flex-col gap-4 scrollbar-thin">

          {/* Analytics Group */}
          <div className="flex flex-col items-stretch gap-1">
            <div className="text-[10px] uppercase text-slate-400 font-bold px-2 py-1 tracking-wider">
              Main Modules
            </div>
            <div className="flex flex-col gap-1">
              {analyticsItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id as NavTab)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap group ${isActive
                        ? 'bg-purple-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio Circle Bullet */}
                      {isActive ? (
                        <Disc className="w-3.5 h-3.5 text-white shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive
                          ? 'bg-white/20 text-white'
                          : (item.badgeColor || 'bg-slate-800 text-slate-300')
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Management Group */}
          <div className="flex flex-col items-stretch gap-1">
            <div className="text-[10px] uppercase text-slate-400 font-bold px-2 py-1 tracking-wider">
              Administration
            </div>
            <div className="flex flex-col gap-1">
              {managementItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id as NavTab)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap group ${isActive
                        ? 'bg-purple-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio Circle Bullet */}
                      {isActive ? (
                        <Disc className="w-3.5 h-3.5 text-white shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive
                          ? 'bg-white/20 text-white'
                          : (item.badgeColor || 'bg-slate-800 text-slate-300')
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

        {/* Connection / Status Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-[#0f172a] text-xs text-slate-400 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-300">System Connected</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-bold">CSBS Tracker</span>
        </div>
      </aside>
    </>
  );
};
