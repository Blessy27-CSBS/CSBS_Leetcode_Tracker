import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  StopCircle, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Layers 
} from 'lucide-react';
import { api } from '../services/api';
import { BatchFetchProgress } from '../types';

interface BatchFetchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const BatchFetchModal: React.FC<BatchFetchModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [progress, setProgress] = useState<BatchFetchProgress>({
    is_running: false,
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    logs: [],
  });
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Poll progress while modal is open or when running
  useEffect(() => {
    let timer: any = null;
    const fetchStatus = async () => {
      try {
        const p = await api.getBatchProgress();
        setProgress(p);
      } catch (err) {
        // ignore poll error
      }
    };

    if (isOpen) {
      fetchStatus();
      timer = setInterval(fetchStatus, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = async () => {
    try {
      setErrorMsg('');
      setIsStarting(true);
      await api.startBatchFetch({
        section: selectedSection,
        year: selectedYear,
      });
      const p = await api.getBatchProgress();
      setProgress(p);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start batch sync');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.cancelBatchFetch();
      const p = await api.getBatchProgress();
      setProgress(p);
    } catch (err) {
      // ignore
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <RefreshCw className={`w-5 h-5 ${progress.is_running ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                LeetCode Batch Data Synchronization
              </h2>
              <p className="text-xs text-slate-500">
                Fetch public statistics, problem solved counts, and active streaks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Filter options if not running */}
          {!progress.is_running && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Section
                </label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="ALL">All Sections (A, B, C)</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Year
                </label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="ALL">All Academic Years (I - IV)</option>
                  <option value="I">I Year</option>
                  <option value="II">II Year</option>
                  <option value="III">III Year</option>
                  <option value="IV">IV Year</option>
                </select>
              </div>
            </div>
          )}

          {/* Progress Bar and Stats */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {progress.is_running ? 'Synchronization In Progress' : progress.total > 0 ? 'Last Synchronization Status' : 'Ready to Synchronize'}
              </span>
              <span className="font-mono font-bold text-blue-600">{pct}%</span>
            </div>

            {/* Progress track */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progress.is_running ? 'bg-blue-600' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[10px] uppercase font-medium">Processed</div>
                <div className="font-mono font-bold text-slate-800">
                  {progress.processed} / {progress.total}
                </div>
              </div>
              <div className="p-2.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                <div className="text-emerald-600 text-[10px] uppercase font-medium">Successful</div>
                <div className="font-mono font-bold text-emerald-700">{progress.successful}</div>
              </div>
              <div className="p-2.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                <div className="text-amber-600 text-[10px] uppercase font-medium">Failed / Warn</div>
                <div className="font-mono font-bold text-amber-700">{progress.failed}</div>
              </div>
            </div>

            {progress.current_student && (
              <div className="text-xs text-blue-700 font-mono flex items-center space-x-1.5 truncate pt-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                <span>Currently fetching: {progress.current_student}</span>
              </div>
            )}
          </div>

          {/* Console Log Terminal */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Real-Time Operation Feed</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-44 overflow-y-auto font-mono text-[11px] space-y-1 text-slate-300">
              {progress.logs.length === 0 ? (
                <div className="text-slate-500 italic">No activity logs yet. Click Start Batch Fetch to begin.</div>
              ) : (
                progress.logs.slice().reverse().map((log, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : log.type === 'error'
                        ? 'text-red-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 mr-2">[{log.timestamp.split('T')[1]?.split('.')[0] || 'LOG'}]</span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {progress.is_running ? 'Rate limited to ~1.5s per student' : 'Data is stored as immutable snapshots'}
          </div>

          <div className="flex items-center space-x-2.5">
            {progress.is_running ? (
              <button
                onClick={handleCancel}
                className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors shadow-2xs"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop Batch</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={isStarting}
                className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors disabled:opacity-50 shadow-2xs"
              >
                <Play className="w-4 h-4" />
                <span>{isStarting ? 'Starting...' : 'Start Batch Fetch'}</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                if (onCompleted) onCompleted();
              }}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
