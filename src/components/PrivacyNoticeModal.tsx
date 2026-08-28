import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Server, Trash2, CheckCircle2 } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Department Data Privacy & Compliance Notice
              </h2>
              <p className="text-xs text-slate-500">
                KGiSL Institute of Technology — CSBS LeetCode Tracker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-600 max-h-[75vh] overflow-y-auto">
          
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
            <div className="text-slate-800 font-semibold text-sm flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Public-Only Data Acquisition</span>
            </div>
            <p className="text-slate-600">
              The CSBS LeetCode Tracker only accesses publicly available profile metrics via LeetCode's public GraphQL endpoint. It acts strictly as an analytical tool for college faculty to review coding progression and practice regularity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-rose-700">
                <Lock className="w-4 h-4" />
                <span>Zero Password Storage</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                The application NEVER requests, collects, or stores student passwords, authentication tokens, session cookies, or private credentials.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-blue-700">
                <EyeOff className="w-4 h-4" />
                <span>No Private Submission Code</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Private source code or proprietary contest submissions are never downloaded or stored. Only aggregate question counts and public timestamps are tracked.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-amber-700">
                <Server className="w-4 h-4" />
                <span>Faculty-Controlled Records</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Student rosters, section allocations, and mentor assignments remain strictly within institutional storage and can be updated at any time.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-emerald-700">
                <Trash2 className="w-4 h-4" />
                <span>Data Deletion & Purging</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Faculty administrators have one-click controls in the Settings view to wipe historical snapshots or delete individual student records upon graduation.
              </p>
            </div>

          </div>

          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
            For academic inquiries or updates regarding student registration details, please reach out to the CSBS Academic Coordinator at <span className="text-blue-600 font-mono">csbs.coordinator@kgisl.ac.in</span>.
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-2xs"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
