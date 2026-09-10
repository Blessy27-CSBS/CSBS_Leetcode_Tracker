import React, { useState, useEffect } from 'react';
import { 
  StudentQuestProgress, 
  QuestNode, 
  QuestNodeStatus,
  AuthUser 
} from '../types';
import { api } from '../services/api';
import { 
  Trophy, 
  Lock, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  ChevronLeft,
  X
} from 'lucide-react';

interface StudentQuestViewProps {
  currentUser: AuthUser;
}

export const StudentQuestView: React.FC<StudentQuestViewProps> = ({ currentUser }) => {
  const [questData, setQuestData] = useState<StudentQuestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState<(QuestNode & { status: QuestNodeStatus; userSolvedCount: number }) | null>(null);

  const questUrl = 'https://leetcode.com/quest/data-structures-and-algorithms-quest/';

  useEffect(() => {
    loadQuestData();
  }, [currentUser]);

  const loadQuestData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getQuestStudentProgress(currentUser.student_id);
      setQuestData(res.questProgress);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load quest data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLeetCode = async () => {
    try {
      setSyncing(true);
      await api.syncMyLeetCode(currentUser.student_id);
      await loadQuestData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !questData) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-sm font-semibold text-slate-600">Loading Data Structures & Algorithms Quest Canvas...</p>
      </div>
    );
  }

  if (error && !questData) {
    return (
      <div className="p-6 max-w-md mx-auto bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3 my-12 font-sans">
        <p className="text-sm text-rose-700 font-medium">{error}</p>
        <button
          onClick={loadQuestData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // Helper to retrieve node data
  const getNode = (id: string) => questData?.nodes.find(n => n.id === id);

  const array1 = getNode('array-1');
  const array2 = getNode('array-2');
  const stack1 = getNode('stack-1');
  const monoStack1 = getNode('monotonic-stack-1');
  const monoStack2 = getNode('monotonic-stack-2');

  const completedCount = questData?.completedNodesCount || 0;
  const totalCount = 35; // LeetCode scale

  // Helper for dynamic node styling based on completion state
  const getNodeContainerStyle = (node?: any, defaultGold: boolean = false) => {
    if (!node) return 'bg-[#f1f3f5] text-[#495057] border-[#dee2e6]';
    if (node.status === 'COMPLETED') {
      return 'bg-gradient-to-b from-emerald-50 to-teal-50 text-emerald-800 border-2 border-emerald-400 ring-4 ring-emerald-100 shadow-md shadow-emerald-200/50';
    }
    if (node.status === 'IN_PROGRESS') {
      return 'bg-gradient-to-b from-[#ffebeb] to-[#ffe5e5] text-[#ff5252] border-2 border-[#ff8a80] ring-4 ring-[#ffcdd2] shadow-lg shadow-rose-200/50 font-black';
    }
    if (defaultGold) {
      return 'bg-gradient-to-b from-white to-[#fffcf5] text-[#d97706] border border-[#fde68a] shadow-xs';
    }
    return 'bg-gradient-to-b from-white to-[#f4f5f7] text-[#546e7a] border border-[#cfd8dc] shadow-xs';
  };

  const getNodeIcon = (node?: any, fallbackEmoji: string = '🏠') => {
    if (!node) return fallbackEmoji;
    if (node.status === 'COMPLETED') return '✓';
    if (node.status === 'IN_PROGRESS') return fallbackEmoji;
    return '🔒';
  };

  const getNodeIconStyle = (node?: any) => {
    if (!node) return 'bg-[#ced4da] text-slate-700';
    if (node.status === 'COMPLETED') return 'bg-emerald-600 text-white font-black';
    if (node.status === 'IN_PROGRESS') return 'bg-[#ff5252] text-white shadow-xs';
    return 'bg-[#90a4ae] text-white';
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>CSBS Student Quest Module</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                {questData?.year} Year • Sec {questData?.section}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Personalized LeetCode Quest Map for {currentUser.name} (@{questData?.username})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncLeetCode}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-rose-500' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync LeetCode'}</span>
          </button>

          <a
            href={questUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>Open on LeetCode</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </a>
        </div>
      </div>

      {/* Main LeetCode Style Canvas Window Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        
        {/* LeetCode Header Nav Bar */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-md">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Data Structures and Algorithms
            </h2>
          </div>

          {/* Top Right Progress Tracker */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-600">
              {completedCount}/{totalCount}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 12 }).map((_, idx) => {
                const isDone = idx < completedCount;
                return (
                  <span
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      isDone
                        ? 'bg-rose-500 ring-2 ring-rose-200'
                        : idx === completedCount
                        ? 'bg-slate-300 ring-2 ring-slate-200 animate-pulse'
                        : 'bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* LeetCode Checkerboard 2D Grid Canvas Workspace */}
        <div 
          className="relative min-h-[720px] p-8 select-none overflow-x-auto flex flex-col justify-between"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: `
              linear-gradient(to right, #f4f4f6 1px, transparent 1px),
              linear-gradient(to bottom, #f4f4f6 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px'
          }}
        >
          
          {/* SECTION 1: LINEAR SHOAL */}
          <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8">
            
            {/* Region Label */}
            <div className="text-xs font-semibold text-slate-500 font-mono tracking-wide">
              Linear Shoal
            </div>

            {/* Canvas Node Graph Layout */}
            <div className="relative w-full h-[540px] flex flex-col items-center">
              
              {/* SVG 100:100 viewBox Scaling Layer - Guarantees 100% Dead-Center Alignment */}
              <svg 
                viewBox="0 0 100 100" 
                className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Flow 1: Array I (54, 9.5) -> Array II (47, 26) */}
                <path
                  d="M 54 9.5 C 54 18, 47 18, 47 26"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />

                {/* Flow 2: Array II (47, 32.5) -> Stack (54, 46.5) */}
                <path
                  d="M 47 32.5 C 47 40, 54 40, 54 46.5"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />

                {/* Flow 3: Stack (54, 53) -> Monotonic Stack II (36, 67) */}
                <path
                  d="M 54 53 C 54 60, 36 60, 36 67"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />

                {/* Flow 4: Stack (54, 53) -> Monotonic Stack (62, 67) */}
                <path
                  d="M 54 53 C 54 60, 62 60, 62 67"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />

                {/* Flow 5: Left Chest (22) -> Monotonic Stack II (28) */}
                <path
                  d="M 22 71.5 L 28 71.5"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />

                {/* Flow 6: Monotonic Stack II (45) -> Monotonic Stack (53) */}
                <path
                  d="M 44 71.5 L 53 71.5"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />

                {/* Flow 7: Monotonic Stack (71) -> Right Chest (77) */}
                <path
                  d="M 71 71.5 L 77 71.5"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />

                {/* Flow 8: Monotonic Stack II (36, 75) -> Left Mystery Node (36, 84) */}
                <path
                  d="M 36 75 L 36 84"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />

                {/* Flow 9: Monotonic Stack (62, 75) -> Right Mystery Node (62, 84) */}
                <path
                  d="M 62 75 L 62 84"
                  stroke="#94a3b8"
                  strokeWidth="0.6"
                  strokeDasharray="1.2 1.2"
                  fill="none"
                />
              </svg>

              {/* NODE 1: Array I */}
              <div className="absolute top-[20px] left-[54%] -translate-x-1/2 z-20">
                <div className="relative group">
                  <div className="p-1.5 rounded-[22px] bg-[#ffecb3]/0 ring-4 ring-[#ffcdd2] border border-[#ff8a80] shadow-[0_8px_25px_rgba(239,83,80,0.25)]">
                    <button
                      onClick={() => setSelectedNode(array1 || null)}
                      className={`px-5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer text-sm whitespace-nowrap ${getNodeContainerStyle(array1)}`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${getNodeIconStyle(array1)}`}>
                        {getNodeIcon(array1, '🏠')}
                      </span>
                      <span>{array1?.title || 'Array I'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* NODE 2: Array II */}
              <div className="absolute top-[140px] left-[47%] -translate-x-1/2 z-20">
                <button
                  onClick={() => setSelectedNode(array2 || null)}
                  className={`px-5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer text-sm whitespace-nowrap ${getNodeContainerStyle(array2)}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${getNodeIconStyle(array2)}`}>
                    {getNodeIcon(array2, '🏠')}
                  </span>
                  <span>{array2?.title || 'Array II'}</span>
                </button>
              </div>

              {/* NODE 3: Stack */}
              <div className="absolute top-[250px] left-[54%] -translate-x-1/2 z-20">
                <button
                  onClick={() => setSelectedNode(stack1 || null)}
                  className={`px-5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer text-sm whitespace-nowrap ${getNodeContainerStyle(stack1)}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${getNodeIconStyle(stack1)}`}>
                    {getNodeIcon(stack1, '🏠')}
                  </span>
                  <span>{stack1?.title || 'Stack'}</span>
                </button>
              </div>

              {/* BOTTOM LEVEL NODES */}
              <div className="absolute top-[360px] w-full z-20">
                {/* Left Chest (20%) */}
                <div 
                  className="absolute left-[20%] -translate-x-1/2 top-0 w-11 h-11 rounded-xl bg-gradient-to-b from-[#fef3c7] to-[#fde68a] border border-[#f59e0b]/40 flex items-center justify-center shadow-md text-2xl cursor-pointer hover:scale-110 transition-transform"
                  title="Reward Chest"
                >
                  🧰
                </div>

                {/* Monotonic Stack II (36%) */}
                <div className="absolute left-[36%] -translate-x-1/2 top-0">
                  <button
                    onClick={() => setSelectedNode(monoStack2 || null)}
                    className={`px-5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer text-sm whitespace-nowrap ${getNodeContainerStyle(monoStack2, true)}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${getNodeIconStyle(monoStack2)}`}>
                      {getNodeIcon(monoStack2, '💼')}
                    </span>
                    <span>{monoStack2?.title || 'Monotonic Stack II'}</span>
                  </button>
                </div>

                {/* Monotonic Stack (62%) */}
                <div className="absolute left-[62%] -translate-x-1/2 top-0">
                  <button
                    onClick={() => setSelectedNode(monoStack1 || null)}
                    className={`px-5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer text-sm whitespace-nowrap ${getNodeContainerStyle(monoStack1)}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${getNodeIconStyle(monoStack1)}`}>
                      {getNodeIcon(monoStack1, '🏠')}
                    </span>
                    <span>{monoStack1?.title || 'Monotonic Stack'}</span>
                  </button>
                </div>

                {/* Right Chest (79%) */}
                <div 
                  className="absolute left-[79%] -translate-x-1/2 top-0 w-11 h-11 rounded-xl bg-gradient-to-b from-[#fef3c7] to-[#fde68a] border border-[#f59e0b]/40 flex items-center justify-center shadow-md text-2xl cursor-pointer hover:scale-110 transition-transform"
                  title="Reward Chest"
                >
                  🧰
                </div>
              </div>

              {/* Mystery Question Marks aligned directly underneath Monotonic Stack nodes (36% and 62%) */}
              <div className="absolute top-[455px] left-[36%] -translate-x-1/2 z-20">
                <div 
                  className="text-3xl font-black bg-gradient-to-tr from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent filter drop-shadow-[0_4px_10px_rgba(216,180,254,0.6)] select-none cursor-pointer"
                  title="Mystery Reward Node"
                >
                  ❓
                </div>
              </div>

              <div className="absolute top-[455px] left-[62%] -translate-x-1/2 z-20">
                <div 
                  className="text-3xl font-black bg-gradient-to-tr from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent filter drop-shadow-[0_4px_10px_rgba(216,180,254,0.6)] select-none cursor-pointer"
                  title="Mystery Reward Node"
                >
                  ❓
                </div>
              </div>

            </div>

          </div>

          {/* SECTION 2: SEQUENCE VALLEY */}
          <div className="relative z-10 max-w-4xl mx-auto w-full pt-16 border-t border-slate-200/80 mt-12 text-center space-y-4">
            <div className="text-xs font-semibold text-slate-500 font-mono tracking-wide text-left">
              Sequence Valley
            </div>

            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-500">
                Complete the units above to unlock
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Selected Node Popover Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden space-y-4 p-6 relative">
            
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-6">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Level {selectedNode.levelNumber} • {selectedNode.region}
              </span>
              <h3 className="text-xl font-black text-slate-900">{selectedNode.title}</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedNode.description}
            </p>

            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Topics Covered</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.topics.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800">Quest Target Problems</div>
              <div className="space-y-1.5">
                {selectedNode.sampleProblems.map((prob, pIdx) => (
                  <a
                    key={pIdx}
                    href={prob.leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-rose-600 truncate">
                        {prob.title}
                      </div>
                      <span className={`text-[10px] font-semibold ${
                        prob.difficulty === 'Easy' ? 'text-emerald-600' : prob.difficulty === 'Medium' ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {prob.difficulty}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <a
              href={questUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer mt-4"
            >
              <span>Solve Stage on LeetCode</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </a>

          </div>
        </div>
      )}

    </div>
  );
};
