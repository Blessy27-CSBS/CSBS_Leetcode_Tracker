import React from 'react';
import {
  BarChart3,
  Trophy,
  Flame,
  Award,
  BookOpen,
  KeyRound,
  Circle,
  Disc,
  User,
  GraduationCap
} from 'lucide-react';

export type StudentNavTab = 'overview' | 'contests' | 'potd_tracks' | 'leaderboard' | 'submissions' | 'profile';

interface StudentSidebarProps {
  activeTab: StudentNavTab;
  setActiveTab: (tab: StudentNavTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
  student?: any;
  snapshot?: any;
  potdCount?: number;
  recentCount?: number;
  contestCount?: number;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen = true,
  onClose,
  student,
  snapshot,
  potdCount = 0,
  recentCount = 0,
  contestCount = 0,
}) => {
  const mainItems: { id: StudentNavTab; label: string; badge: string | null; badgeColor?: string }[] = [
    { id: 'overview', label: 'My Dashboard', badge: null },
    { id: 'contests', label: 'LeetCode Contests', badge: contestCount > 0 ? `${contestCount}` : null, badgeColor: 'bg-purple-600 text-white' },
    { id: 'potd_tracks', label: 'POTD & Practice Tracks', badge: potdCount > 0 ? `${potdCount}` : null, badgeColor: 'bg-orange-500 text-white' },
    { id: 'leaderboard', label: 'Class Leaderboard', badge: null },
    { id: 'submissions', label: 'Recent Submissions', badge: recentCount > 0 ? `${recentCount}` : null, badgeColor: 'bg-slate-700 text-slate-200' },
  ];

  const accountItems: { id: StudentNavTab; label: string; badge: string | null; badgeColor?: string }[] = [
    { id: 'profile', label: 'Account & Security', badge: null },
  ];

  const handleSelectTab = (tab: StudentNavTab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const formatName = (str?: string): string => {
    if (!str) return 'Student';
    return str
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Advanced': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Proficient': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Developing': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
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
      <aside className={`w-64 bg-[#1e293b] text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none z-20 sticky top-14 h-[calc(100vh-3.5rem)] transition-all duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Sidebar Header */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
              Student Navigation
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 overflow-y-auto flex flex-col gap-4 scrollbar-thin">

          {/* Main Modules Group */}
          <div className="flex flex-col items-stretch gap-1">
            <div className="text-[10px] uppercase text-slate-400 font-bold px-2 py-1 tracking-wider">
              Main Modules
            </div>
            <div className="flex flex-col gap-1">
              {mainItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap group ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <Disc className="w-3.5 h-3.5 text-white shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive 
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

          {/* My Account Group */}
          <div className="flex flex-col items-stretch gap-1">
            <div className="text-[10px] uppercase text-slate-400 font-bold px-2 py-1 tracking-wider">
              My Account
            </div>
            <div className="flex flex-col gap-1">
              {accountItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap group ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <Disc className="w-3.5 h-3.5 text-white shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </nav>

        {/* Sidebar Footer: Student Profile Card */}
        {student && (
          <div className="p-3 border-t border-slate-800 bg-[#0f172a] flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {student.student_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-100 truncate">
                  {formatName(student.student_name)}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {student.register_no} • Sec {student.section}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold border uppercase tracking-wider ${getTierColor(snapshot?.performance_tier)}`}>
                {snapshot?.performance_tier || 'Beginner'} Tier
              </span>
              <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                <span>CSBS Year {student.year}</span>
              </span>
            </div>
          </div>
        )}

      </aside>
    </>
  );
};
