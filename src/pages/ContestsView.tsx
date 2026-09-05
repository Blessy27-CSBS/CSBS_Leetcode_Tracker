import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  ChevronRight, 
  Timer,
  Globe,
  Share2,
  Code2,
  BookmarkPlus
} from 'lucide-react';
import { ContestItem, ContestProblemLink, StudentWithLatest } from '../types';
import { api } from '../services/api';

interface ContestsViewProps {
  isFaculty?: boolean;
  students?: StudentWithLatest[];
}

export const ContestsView: React.FC<ContestsViewProps> = ({ isFaculty = true, students = [] }) => {
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    titleSlug: string;
    type: 'Weekly Contest' | 'Biweekly Contest' | 'Department Contest' | 'Virtual Contest';
    contestUrl: string;
    startTime: string;
    durationMinutes: number;
    description: string;
    problems: ContestProblemLink[];
  }>({
    title: '',
    titleSlug: '',
    type: 'Weekly Contest',
    contestUrl: '',
    startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: 90,
    description: '',
    problems: [
      { title: 'Q1: Easy Problem', difficulty: 'Easy', leetcodeUrl: '' },
      { title: 'Q2: Medium Problem', difficulty: 'Medium', leetcodeUrl: '' },
      { title: 'Q3: Medium Problem', difficulty: 'Medium', leetcodeUrl: '' },
      { title: 'Q4: Hard Problem', difficulty: 'Hard', leetcodeUrl: '' },
    ],
  });

  // Countdown timer clock
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await api.getContests();
      setContests(list || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  const handleOpenAdd = () => {
    setEditingContestId(null);
    setFormData({
      title: '',
      titleSlug: '',
      type: 'Weekly Contest',
      contestUrl: 'https://leetcode.com/contest/',
      startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      durationMinutes: 90,
      description: '',
      problems: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ContestItem) => {
    setEditingContestId(c.id);
    setFormData({
      title: c.title,
      titleSlug: c.titleSlug,
      type: c.type,
      contestUrl: c.contestUrl,
      startTime: c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      durationMinutes: c.durationMinutes || 90,
      description: c.description || '',
      problems: c.problems || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove contest "${title}"?`)) return;
    try {
      await api.deleteContest(id);
      loadContests();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contest');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        problems: [],
      };

      if (editingContestId) {
        await api.updateContest(editingContestId, payload);
      } else {
        await api.createContest(payload);
      }

      setIsModalOpen(false);
      loadContests();
    } catch (err: any) {
      alert(err.message || 'Failed to save contest');
    }
  };

  const formatCountdown = (startTimeStr: string) => {
    const diff = new Date(startTimeStr).getTime() - now;
    if (diff <= 0) {
      return { text: 'LIVE NOW', isLive: true, isPast: false };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return { text: `${days}d ${hours}h left`, isLive: false, isPast: false };
    }
    return { 
      text: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, 
      isLive: false, 
      isPast: false 
    };
  };

  const upcomingContests = contests.filter(c => new Date(c.startTime).getTime() + (c.durationMinutes * 60000) >= now);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-purple-600" /> Contest Arena
            </span>
            <span className="text-xs text-slate-400 font-semibold">LeetCode Integration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            LeetCode Weekly & Department Contests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Participate in real-time speed coding challenges. Direct single link to enter each contest.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isFaculty && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Contest</span>
            </button>
          )}

          <a
            href="https://leetcode.com/contest/"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Globe className="w-4 h-4 text-purple-600" />
            <span>LeetCode Official</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. CONTESTS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-600" />
            <span>Active & Upcoming Contests ({upcomingContests.length})</span>
          </h2>
        </div>

        {upcomingContests.length === 0 ? (
          <div className="p-10 bg-white/80 backdrop-blur-md border border-dashed border-slate-300 rounded-2xl text-center space-y-3 shadow-xs">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Scheduled Contests Currently</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Faculty can post upcoming weekly or biweekly contest links. Click the button above to add a contest.
            </p>
            {isFaculty && (
              <button
                onClick={handleOpenAdd}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule a Contest</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {upcomingContests.map(c => {
              const { text: countdown, isLive } = formatCountdown(c.startTime);

              return (
                <div
                  key={c.id}
                  className="bg-white/90 backdrop-blur-md border border-slate-200/80 hover:border-purple-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    
                    {/* Top Type & Countdown Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-extrabold rounded-lg">
                        <Trophy className="w-3.5 h-3.5 text-purple-600" />
                        <span>{c.type}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        isLive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <Timer className="w-3.5 h-3.5 text-amber-600" />
                        <span>{countdown}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {c.description}
                        </p>
                      )}
                    </div>

                    {/* Contest Meta Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(c.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.durationMinutes}m)</span>
                      </div>
                    </div>

                  </div>

                  {/* Single Action Button: Enter Contest Link */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={c.contestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Enter Contest on LeetCode</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {isFaculty && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Contest"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.title)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Contest"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. MODAL: SCHEDULE / ADD CONTEST (Single Link) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingContestId ? 'Edit Contest' : 'Schedule Contest'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter direct contest link and schedule time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              {/* Title */}
              <div>
                <label className="block mb-1 font-bold">Contest Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Weekly Contest 438 or CSBS Speed Sprint"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Contest Link (Single Link) */}
              <div>
                <label className="block mb-1 font-bold">LeetCode Contest URL *</label>
                <input
                  type="url"
                  value={formData.contestUrl}
                  onChange={e => setFormData({ ...formData, contestUrl: e.target.value })}
                  placeholder="https://leetcode.com/contest/weekly-contest-438/"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Direct link where students will compete on LeetCode.</span>
              </div>

              {/* Contest Type & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold">Contest Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Weekly Contest">Weekly Contest</option>
                    <option value="Biweekly Contest">Biweekly Contest</option>
                    <option value="Department Contest">Department Contest</option>
                    <option value="Virtual Contest">Virtual Contest</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Start Time */}
              <div>
                <label className="block mb-1 font-bold">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 font-bold">Instructions / Guidance (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Instructions or department goals for students..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingContestId ? 'Save Changes' : 'Publish Contest'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
