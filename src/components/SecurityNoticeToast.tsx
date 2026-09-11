import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, EyeOff, Copy, Printer, CameraOff } from 'lucide-react';
import { onSecurityAlert, SecurityAlert } from '../utils/securityShield';

export function SecurityNoticeToast() {
  const [currentAlert, setCurrentAlert] = useState<SecurityAlert | null>(null);

  useEffect(() => {
    const unsubscribe = onSecurityAlert((alert) => {
      setCurrentAlert(alert);
      const timer = setTimeout(() => {
        setCurrentAlert((prev) => (prev?.id === alert.id ? null : prev));
      }, 2800);
      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  if (!currentAlert) return null;

  const getIcon = () => {
    switch (currentAlert.type) {
      case 'screenshot':
        return <CameraOff className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'contextmenu':
        return <EyeOff className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'shortcut':
        return <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'copy':
        return <Copy className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'print':
        return <Printer className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'devtools':
        return <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999999] pointer-events-none transition-all duration-300 transform animate-bounce-short">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-xl shadow-2xl max-w-md pointer-events-auto">
        <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/50">
          {getIcon()}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Security Shield Active
          </span>
          <span className="text-sm font-medium text-slate-100">
            {currentAlert.message}
          </span>
        </div>
      </div>
    </div>
  );
}
