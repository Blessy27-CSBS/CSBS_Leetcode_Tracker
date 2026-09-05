import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  RotateCcw, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Brain,
  Shield,
  Gauge,
  Clock,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import { SystemSettings, SchedulerStatus } from '../types';
import { api } from '../services/api';

interface SettingsViewProps {
  settings: SystemSettings;
  onSettingsUpdated: () => void;
}

const DEFAULT_FALLBACK_SETTINGS: SystemSettings = {
  inactivity_threshold_days: 14,
  academic_year: '2024-2025',
  fetch_delay_ms: 1500,
  api_timeout_seconds: 25,
  tier_beginner_max: 49,
  tier_developing_max: 99,
  tier_proficient_max: 199,
  auto_sync_enabled: false,
  auto_sync_interval_hours: 12,
  weights: {
    total_solved: 25,
    medium_solved: 20,
    hard_solved: 15,
    recent_activity: 15,
    streak: 10,
    contest_participation: 10,
    improvement_rate: 5,
  },
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(() => ({
    ...DEFAULT_FALLBACK_SETTINGS,
    ...(settings || {}),
    weights: {
      ...DEFAULT_FALLBACK_SETTINGS.weights,
      ...(settings?.weights || {}),
    },
  }));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);

  // Live tester state
  const [testTotal, setTestTotal] = useState(120);
  const [testMedium, setTestMedium] = useState(45);
  const [testHard, setTestHard] = useState(12);
  const [testDaysInactive, setTestDaysInactive] = useState(2);
  const [testStreak, setTestStreak] = useState(15);
  const [testContestRating, setTestContestRating] = useState(1450);
  const [testContestsAttended, setTestContestsAttended] = useState(6);
  const [testImprovementRate, setTestImprovementRate] = useState(8);

  // Faculty Password State
  const [facultyOldPassword, setFacultyOldPassword] = useState('');
  const [facultyNewPassword, setFacultyNewPassword] = useState('');
  const [facultyConfirmPassword, setFacultyConfirmPassword] = useState('');
  const [facultyPwdLoading, setFacultyPwdLoading] = useState(false);
  const [facultyPwdMsg, setFacultyPwdMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFacultyPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (facultyNewPassword !== facultyConfirmPassword) {
      setFacultyPwdMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (facultyNewPassword.length < 4) {
      setFacultyPwdMsg({ text: 'Password must be at least 4 characters long.', type: 'error' });
      return;
    }

    try {
      setFacultyPwdLoading(true);
      setFacultyPwdMsg(null);
      await api.changePassword(facultyNewPassword, facultyOldPassword);
      setFacultyPwdMsg({ text: 'Faculty password updated successfully!', type: 'success' });
      setFacultyOldPassword('');
      setFacultyNewPassword('');
      setFacultyConfirmPassword('');
    } catch (err: any) {
      setFacultyPwdMsg({ text: err.message || 'Failed to update faculty password.', type: 'error' });
    } finally {
      setFacultyPwdLoading(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setFormData({
        ...DEFAULT_FALLBACK_SETTINGS,
        ...settings,
        weights: {
          ...DEFAULT_FALLBACK_SETTINGS.weights,
          ...(settings.weights || {}),
        },
      });
    }
    loadSchedulerStatus();
  }, [settings]);

  const loadSchedulerStatus = async () => {
    try {
      const status = await api.getSchedulerStatus();
      setSchedulerStatus(status);
    } catch (e) {
      // ignore
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.updateSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSettingsUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database to the standard CSBS student dataset with fresh profiles and metrics?')) {
      return;
    }
    try {
      setResetting(true);
      await api.resetToDemo();
      onSettingsUpdated();
      alert('Database successfully reset to CSBS Student Dataset.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo dataset');
    } finally {
      setResetting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all historical snapshot progression records while keeping students intact?')) {
      return;
    }
    try {
      setClearing(true);
      await api.clearHistory();
      onSettingsUpdated();
      alert('Snapshot history cleared.');
    } catch (err: any) {
      alert(err.message || 'Failed to clear snapshots');
    } finally {
      setClearing(false);
    }
  };

  // Accurate formula calculator replicating server/analytics.ts
  const calcTestScore = () => {
    const w = formData.weights || DEFAULT_FALLBACK_SETTINGS.weights;
    const totalWeight = (Object.values(w) as number[]).reduce((a, b) => a + b, 0) || 100;

    const totalSolvedScore = Math.min(1, testTotal / 300);
    const mediumScore = Math.min(1, testMedium / 120);
    const hardScore = Math.min(1, testHard / 40);
    
    const threshold = formData.inactivity_threshold_days || 14;
    const recencyScore = Math.max(0, Math.min(1, (threshold - testDaysInactive) / threshold));
    
    const streakScore = Math.min(1, testStreak / 30);
    const contestScore = testContestRating > 1100 
      ? Math.min(1, (testContestRating - 1100) / 800)
      : Math.min(1, testContestsAttended / 10);
    
    const improvementScore = Math.min(1, Math.max(0, testImprovementRate / 30));

    const weightedSum = 
      (totalSolvedScore * (w.total_solved || 0)) +
      (mediumScore * (w.medium_solved || 0)) +
      (hardScore * (w.hard_solved || 0)) +
      (recencyScore * (w.recent_activity || 0)) +
      (streakScore * (w.streak || 0)) +
      (contestScore * (w.contest_participation || 0)) +
      (improvementScore * (w.improvement_rate || 0));

    const rawScore = (weightedSum / totalWeight) * 100;
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  };

  const getCalculatedTier = (total: number) => {
    if (total > (formData.tier_proficient_max || 199)) return { label: 'Advanced', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (total > (formData.tier_developing_max || 99)) return { label: 'Proficient', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (total > (formData.tier_beginner_max || 49)) return { label: 'Developing', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Beginner', color: 'text-slate-700 bg-slate-100 border-slate-200' };
  };

  const totalSumWeights = (Object.values(formData.weights || {}) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-2xl shadow-xs">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Department Tracker & Scoring Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Customize CSBS engagement weights, inactivity alerting thresholds, API pacing, and performance tiers
            </p>
          </div>
        </div>

        {saved && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl font-bold animate-pulse shadow-xs">
            <Check className="w-4 h-4" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 0: AUTOMATED BACKGROUND SYNC */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5 text-sm font-bold text-slate-900">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Automated Background Sync Worker</span>
            </div>
            {formData.auto_sync_enabled ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Auto-Sync Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                Disabled (Manual Sync Only)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3.5">
              <label className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.auto_sync_enabled ?? false}
                  onChange={e => setFormData({ ...formData, auto_sync_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Enable Automated LeetCode Profile Synchronization</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    Periodically updates active student metrics directly from LeetCode GraphQL in the background.
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sync Interval (Hours)
                </label>
                <select
                  disabled={!formData.auto_sync_enabled}
                  value={formData.auto_sync_interval_hours || 12}
                  onChange={e => setFormData({ ...formData, auto_sync_interval_hours: parseInt(e.target.value) || 12 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-500 disabled:opacity-50 cursor-pointer"
                >
                  <option value={6}>Every 6 Hours (4 times daily)</option>
                  <option value={12}>Every 12 Hours (Twice daily — Recommended)</option>
                  <option value={24}>Every 24 Hours (Nightly sync)</option>
                </select>
              </div>
            </div>

            {/* Live Telemetry Card */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-purple-900 font-bold">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Background Worker Telemetry</span>
              </div>
              <div className="space-y-2 text-[11px] pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Engine State:</span>
                  <span className="font-bold text-slate-800">
                    {schedulerStatus?.isRunning ? '⚡ Sync in progress...' : formData.auto_sync_enabled ? 'Ready / Scheduled' : 'Standby'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Last Background Run:</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {schedulerStatus?.lastRunAt ? new Date(schedulerStatus.lastRunAt).toLocaleTimeString() : 'None since server boot'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Next Scheduled Sync:</span>
                  <span className="font-mono text-purple-700 font-bold">
                    {formData.auto_sync_enabled && schedulerStatus?.nextRunAt ? new Date(schedulerStatus.nextRunAt).toLocaleString() : 'Auto-sync disabled'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-purple-800 pt-2 border-t border-purple-200/60 font-medium">
                ✓ Paced with a {formData.fetch_delay_ms || 1500}ms request throttle to ensure safety against LeetCode rate limits.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: INACTIVITY THRESHOLD & GENERAL PARAMETERS */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Gauge className="w-4 h-4 text-purple-600" />
            <span>General Department Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Inactivity Alert Threshold (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={formData.inactivity_threshold_days}
                onChange={e => setFormData({
                  ...formData,
                  inactivity_threshold_days: parseInt(e.target.value) || 14
                })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono font-semibold focus:outline-hidden focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Flag students as "Inactive" in Intervention if inactive &gt;{formData.inactivity_threshold_days} days.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Academic Session
              </label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={e => setFormData({
                  ...formData,
                  academic_year: e.target.value
                })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Active department academic year on reports (e.g. 2024-2025).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Profile Fetch Delay (ms)
              </label>
              <input
                type="number"
                min={500}
                max={5000}
                step={100}
                value={formData.fetch_delay_ms}
                onChange={e => setFormData({
                  ...formData,
                  fetch_delay_ms: parseInt(e.target.value) || 1500
                })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono font-semibold focus:outline-hidden focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Delay between student requests to avoid rate limits (Default: 1500ms).
              </p>
            </div>

          </div>
        </div>

        {/* SECTION 2: CSBS ENGAGEMENT SCORE FORMULA WEIGHTS */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2.5 text-sm font-bold text-slate-900">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>CSBS Engagement Score Formula Weights</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Total Sum:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${totalSumWeights === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {totalSumWeights}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weight Sliders */}
            <div className="space-y-4">
              
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Total Solved Weight</span>
                  <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{formData.weights.total_solved}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={formData.weights.total_solved}
                  onChange={e => setFormData({
                    ...formData,
                    weights: { ...formData.weights, total_solved: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Medium Difficulty Solved Weight</span>
                  <span className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{formData.weights.medium_solved}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={formData.weights.medium_solved}
                  onChange={e => setFormData({
                    ...formData,
                    weights: { ...formData.weights, medium_solved: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Hard Difficulty Solved Weight</span>
                  <span className="font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{formData.weights.hard_solved}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={formData.weights.hard_solved}
                  onChange={e => setFormData({
                    ...formData,
                    weights: { ...formData.weights, hard_solved: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Recent Activity & Recency Weight</span>
                  <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{formData.weights.recent_activity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={formData.weights.recent_activity}
                  onChange={e => setFormData({
                    ...formData,
                    weights: { ...formData.weights, recent_activity: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Streak & Regularity Weight</span>
                  <span className="font-mono text-orange-700 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">{formData.weights.streak}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={formData.weights.streak}
                  onChange={e => setFormData({
                    ...formData,
                    weights: { ...formData.weights, streak: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Contest Participation & Rating Weight</span>
                  <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{formData.weights.contest_participation}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={formData.weights.contest_participation}
                  onChange={e => setFormData({
                    ...formData,
                    weights: { ...formData.weights, contest_participation: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Improvement Rate Weight</span>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{formData.weights.improvement_rate}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={formData.weights.improvement_rate}
                  onChange={e => setFormData({
                    ...formData,
                    weights: { ...formData.weights, improvement_rate: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

            </div>

            {/* Live Preview Calculator */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-600" />
                  Live Formula Simulator
                </span>
                <span className="font-mono text-purple-700 text-sm font-black bg-purple-100 border border-purple-300 px-3 py-1 rounded-xl shadow-2xs">
                  Score: {calcTestScore()} / 100
                </span>
              </div>
              
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tweak test student inputs to see how current weight configuration generates score results in real-time:
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 font-bold block mb-1">Total Solved</label>
                  <input
                    type="number"
                    value={testTotal}
                    onChange={e => setTestTotal(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold block mb-1">Medium Solved</label>
                  <input
                    type="number"
                    value={testMedium}
                    onChange={e => setTestMedium(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold block mb-1">Hard Solved</label>
                  <input
                    type="number"
                    value={testHard}
                    onChange={e => setTestHard(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold block mb-1">Days Inactive</label>
                  <input
                    type="number"
                    value={testDaysInactive}
                    onChange={e => setTestDaysInactive(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold block mb-1">Streak (Days)</label>
                  <input
                    type="number"
                    value={testStreak}
                    onChange={e => setTestStreak(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-bold block mb-1">Contest Rating</label>
                  <input
                    type="number"
                    value={testContestRating}
                    onChange={e => setTestContestRating(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Assigned Tier:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${getCalculatedTier(testTotal).color}`}>
                  {getCalculatedTier(testTotal).label}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 3: PERFORMANCE TIER BOUNDARIES */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Performance Tier Thresholds (Total Problems Solved)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Beginner Max Solved</label>
              <input
                type="number"
                min={10}
                max={150}
                value={formData.tier_beginner_max}
                onChange={e => setFormData({ ...formData, tier_beginner_max: parseInt(e.target.value) || 49 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-800 focus:outline-hidden focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Beginner: 0 to {formData.tier_beginner_max} problems
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Developing Max Solved</label>
              <input
                type="number"
                min={formData.tier_beginner_max + 1}
                max={300}
                value={formData.tier_developing_max}
                onChange={e => setFormData({ ...formData, tier_developing_max: parseInt(e.target.value) || 99 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-800 focus:outline-hidden focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Developing: {formData.tier_beginner_max + 1} to {formData.tier_developing_max} problems
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Proficient Max Solved</label>
              <input
                type="number"
                min={formData.tier_developing_max + 1}
                max={600}
                value={formData.tier_proficient_max}
                onChange={e => setFormData({ ...formData, tier_proficient_max: parseInt(e.target.value) || 199 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-800 focus:outline-hidden focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Proficient: {formData.tier_developing_max + 1} to {formData.tier_proficient_max} (Advanced: &gt;{formData.tier_proficient_max})
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: FACULTY ACCOUNT SECURITY & PASSWORD UPDATE */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Faculty Account Security & Password</span>
          </div>

          {facultyPwdMsg && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              facultyPwdMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {facultyPwdMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{facultyPwdMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={facultyOldPassword}
                onChange={e => setFacultyOldPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">New Password</label>
              <input
                type="password"
                placeholder="Minimum 4 characters"
                value={facultyNewPassword}
                onChange={e => setFacultyNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Confirm New Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={facultyConfirmPassword}
                onChange={e => setFacultyConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleFacultyPasswordChange}
              disabled={facultyPwdLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{facultyPwdLoading ? 'Updating Password...' : 'Update Faculty Password'}</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Department Configuration'}</span>
          </button>
        </div>

      </form>

      {/* SECTION 5: DANGER ZONE & DATA ADMINISTRATION */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 text-xs font-bold text-rose-700 border-b border-rose-100 pb-3">
          <Shield className="w-4 h-4" />
          <span>Database Administration & Reset Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="font-bold text-slate-900 text-xs">Reset CSBS Student Dataset</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Restores default student roster metrics across CSBS Sections.
            </p>
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold cursor-pointer border border-amber-200 transition-colors disabled:opacity-50 text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting...' : 'Reset Student Dataset'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="font-bold text-slate-900 text-xs">Purge Historical Snapshots</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Removes past progression records while keeping registered student entries intact.
            </p>
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={clearing}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer border border-rose-200 transition-colors disabled:opacity-50 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearing ? 'Clearing...' : 'Clear All Snapshots'}</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
