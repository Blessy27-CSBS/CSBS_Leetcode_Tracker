import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  RotateCcw, 
  Trash2, 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  Brain,
  Shield,
  Gauge,
  Clock,
  RefreshCw,
  Zap
} from 'lucide-react';
import { SystemSettings, SchedulerStatus } from '../types';
import { api } from '../services/api';

interface SettingsViewProps {
  settings: SystemSettings;
  onSettingsUpdated: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);

  // Sample student test calculator state
  const [testEasy, setTestEasy] = useState(60);
  const [testMedium, setTestMedium] = useState(45);
  const [testHard, setTestHard] = useState(12);
  const [testActiveDays, setTestActiveDays] = useState(55);
  const [testContestRating, setTestContestRating] = useState(1520);

  useEffect(() => {
    setFormData(settings);
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
    if (!window.confirm('Reset database to the standard CSBS Demo dataset (18 realistic students across Sections A, B, C with rich historical snapshots)?')) {
      return;
    }
    try {
      setResetting(true);
      await api.resetToDemo();
      onSettingsUpdated();
      alert('Database successfully reset to CSBS Demo Dataset.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo dataset');
    } finally {
      setResetting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all historical snapshot time points while keeping the student roster intact?')) {
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

  // Calculate live preview engagement score using current formula weights
  const calcTestScore = () => {
    const w = formData.scoring_weights;
    const pScore = Math.min(100, (testEasy * w.easy_weight + testMedium * w.medium_weight + testHard * w.hard_weight) * 0.8);
    const aScore = Math.min(100, (testActiveDays / 60) * 100);
    const cScore = testContestRating > 0 ? Math.min(100, Math.max(0, ((testContestRating - 1200) / 800) * 100)) : 40;
    const finalScore = Math.round(pScore * 0.55 + aScore * w.active_days_weight + cScore * w.contest_weight);
    return Math.min(100, Math.max(0, finalScore));
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Department Settings & Scoring Formula Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure engagement scoring weights, inactivity alerting thresholds, and academic year settings
          </p>
        </div>

        {saved && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md font-semibold animate-pulse">
            <Check className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 0: AUTOMATED BACKGROUND SYNC (CRON ENGINE) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Automated Scheduled Background Profile Sync</span>
            </div>
            {formData.auto_sync_enabled ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Auto-Sync Active
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                Disabled (Manual Only)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                <input
                  type="checkbox"
                  checked={formData.auto_sync_enabled ?? false}
                  onChange={e => setFormData({ ...formData, auto_sync_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Enable Automatic LeetCode Sync</span>
                  <span className="text-slate-500 text-[11px]">
                    Periodically updates all active student profiles in the background without needing manual sync clicks.
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sync Frequency
                </label>
                <select
                  disabled={!formData.auto_sync_enabled}
                  value={formData.auto_sync_interval_hours || 12}
                  onChange={e => setFormData({ ...formData, auto_sync_interval_hours: parseInt(e.target.value) || 12 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  <option value={6}>Every 6 Hours (4x per day)</option>
                  <option value={12}>Every 12 Hours (Twice daily - Recommended)</option>
                  <option value={24}>Every 24 Hours (Nightly sync)</option>
                </select>
              </div>
            </div>

            {/* Live Telemetry Card */}
            <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs">
              <span className="font-bold text-indigo-900 block text-xs">Background Worker Status</span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Engine State:</span>
                  <span className="font-semibold text-slate-800">
                    {schedulerStatus?.isRunning ? '⚡ Sync In Progress' : formData.auto_sync_enabled ? 'Ready / Scheduled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Last Background Run:</span>
                  <span className="font-mono text-slate-700">
                    {schedulerStatus?.lastRunAt ? new Date(schedulerStatus.lastRunAt).toLocaleTimeString() : 'None since server start'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Next Scheduled Run:</span>
                  <span className="font-mono text-indigo-700 font-bold">
                    {formData.auto_sync_enabled && schedulerStatus?.nextRunAt ? new Date(schedulerStatus.nextRunAt).toLocaleString() : 'Not scheduled'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-indigo-700/80 pt-1 border-t border-indigo-100">
                ✓ Throttled via API delay ({formData.fetch_delay_ms || 1500}ms) to ensure safety against LeetCode limits.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: INACTIVITY THRESHOLD & GENERAL */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2.5">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span>Inactivity Threshold & Department Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Students with no submissions for &gt;{formData.inactivity_threshold_days} days will be flagged in Intervention List.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={e => setFormData({
                  ...formData,
                  academic_year: e.target.value
                })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Default display academic session on reports.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                API Delay Between Students (ms)
              </label>
              <input
                type="number"
                min={500}
                max={5000}
                step={100}
                value={formData.api_delay_ms}
                onChange={e => setFormData({
                  ...formData,
                  api_delay_ms: parseInt(e.target.value) || 1200
                })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-hidden focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Rate limiting buffer to prevent LeetCode 429 throttling.
              </p>
            </div>

          </div>
        </div>

        {/* SECTION 2: CSBS ENGAGEMENT SCORE FORMULA WEIGHTS */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Brain className="w-4 h-4 text-emerald-600" />
              <span>Department Engagement Score Formula Weights</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Score Scale: 0 to 100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Sliders */}
            <div className="space-y-3.5">
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 text-[11px]">Easy Problem Weight</span>
                  <span className="font-mono text-emerald-600 font-bold">{formData.scoring_weights.easy_weight}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={formData.scoring_weights.easy_weight}
                  onChange={e => setFormData({
                    ...formData,
                    scoring_weights: {
                      ...formData.scoring_weights,
                      easy_weight: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 text-[11px]">Medium Problem Weight</span>
                  <span className="font-mono text-amber-600 font-bold">{formData.scoring_weights.medium_weight}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.01}
                  value={formData.scoring_weights.medium_weight}
                  onChange={e => setFormData({
                    ...formData,
                    scoring_weights: {
                      ...formData.scoring_weights,
                      medium_weight: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 text-[11px]">Hard Problem Weight</span>
                  <span className="font-mono text-rose-600 font-bold">{formData.scoring_weights.hard_weight}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.01}
                  value={formData.scoring_weights.hard_weight}
                  onChange={e => setFormData({
                    ...formData,
                    scoring_weights: {
                      ...formData.scoring_weights,
                      hard_weight: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 text-[11px]">Active Consistency Weight</span>
                  <span className="font-mono text-blue-600 font-bold">{formData.scoring_weights.active_days_weight}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={formData.scoring_weights.active_days_weight}
                  onChange={e => setFormData({
                    ...formData,
                    scoring_weights: {
                      ...formData.scoring_weights,
                      active_days_weight: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 text-[11px]">Contest Rating Weight</span>
                  <span className="font-mono text-sky-600 font-bold">{formData.scoring_weights.contest_weight}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={formData.scoring_weights.contest_weight}
                  onChange={e => setFormData({
                    ...formData,
                    scoring_weights: {
                      ...formData.scoring_weights,
                      contest_weight: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

            </div>

            {/* Interactive Preview Calculator */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center justify-between">
                <span>Live Formula Tester</span>
                <span className="font-mono text-emerald-700 text-sm font-bold bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded">
                  Score: {calcTestScore()} / 100
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Adjust test student metrics below to see how current weights calibrate scores:
              </p>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Easy Solved</label>
                  <input
                    type="number"
                    value={testEasy}
                    onChange={e => setTestEasy(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Medium</label>
                  <input
                    type="number"
                    value={testMedium}
                    onChange={e => setTestMedium(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Hard</label>
                  <input
                    type="number"
                    value={testHard}
                    onChange={e => setTestHard(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Active Days</label>
                  <input
                    type="number"
                    value={testActiveDays}
                    onChange={e => setTestActiveDays(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 font-medium">Contest Rating</label>
                  <input
                    type="number"
                    value={testContestRating}
                    onChange={e => setTestContestRating(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 3: PERFORMANCE TIER BOUNDARIES */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2.5">
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>Problem Tier Boundaries (Total Solved Thresholds)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-500 mb-1 text-[11px]">Beginner Level</label>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 font-mono font-medium">
                0 – {formData.performance_tiers.beginner.max} Problems
              </div>
            </div>
            <div>
              <label className="block font-semibold text-sky-600 mb-1 text-[11px]">Developing Level</label>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 font-mono font-medium">
                {formData.performance_tiers.developing.min} – {formData.performance_tiers.developing.max} Problems
              </div>
            </div>
            <div>
              <label className="block font-semibold text-blue-600 mb-1 text-[11px]">Proficient Level</label>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 font-mono font-medium">
                {formData.performance_tiers.proficient.min} – {formData.performance_tiers.proficient.max} Problems
              </div>
            </div>
            <div>
              <label className="block font-semibold text-emerald-600 mb-1 text-[11px]">Advanced Level</label>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 font-mono font-medium">
                {formData.performance_tiers.advanced.min}+ Problems
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Department Configuration'}</span>
          </button>
        </div>

      </form>

      {/* SECTION 4: DANGER ZONE & DEMO MANAGEMENT */}
      <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-3.5">
        <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 border-b border-rose-100 pb-2.5">
          <Shield className="w-4 h-4" />
          <span>Database Administration & Demo Data Reset</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-semibold text-slate-800 text-xs">Reset to Demo CSBS Dataset</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Restores the default 18 CSBS students with multi-week snapshot histories across Sections A, B, and C.
            </p>
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium cursor-pointer border border-amber-200 transition-colors disabled:opacity-50 text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting...' : 'Reset to Demo Dataset'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-semibold text-slate-800 text-xs">Purge Historical Snapshots</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Removes all past progression timepoints while keeping the registered student list intact.
            </p>
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={clearing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium cursor-pointer border border-rose-200 transition-colors disabled:opacity-50 text-xs"
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
