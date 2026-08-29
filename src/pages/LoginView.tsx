import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Code2, 
  Award, 
  CheckCircle2, 
  Flame, 
  Zap, 
  Trophy, 
  Target, 
  Terminal, 
  Compass, 
  Cpu,
  Binary
} from 'lucide-react';
import { api } from '../services/api';
import { AuthUser, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(activeRole === 'student' ? 'Please enter your College Mail ID and Register Number.' : 'Please enter your username and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const session = await api.login({
        identifier: identifier.trim(),
        password: password.trim(),
        role: activeRole,
      });

      if (session && session.user) {
        onLoginSuccess(session.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStaff = () => {
    setActiveRole('staff');
    setIdentifier('staff');
    setPassword('staff123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-50/40 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800 relative overflow-hidden selection:bg-blue-500 selection:text-white">
      
      {/* Decorative Animated LeetCode Badges in Background */}
      
      {/* Top Left Floating Badge: Daily Streak */}
      <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-orange-200/80 shadow-lg shadow-orange-500/10 text-xs font-bold text-orange-800 absolute top-16 left-12 animate-bounce [animation-duration:4s]">
        <div className="p-1.5 bg-orange-500 text-white rounded-lg shadow-xs animate-pulse">
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-orange-600 uppercase tracking-wider font-extrabold">Streak Tracker</div>
          <div className="text-slate-800">Maintain Daily Habits</div>
        </div>
      </div>

      {/* Top Right Floating Badge: Live Sync */}
      <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-blue-200/80 shadow-lg shadow-blue-500/10 text-xs font-bold text-blue-800 absolute top-20 right-14 animate-bounce [animation-duration:5s]">
        <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs animate-pulse">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-blue-600 uppercase tracking-wider font-extrabold">GraphQL Engine</div>
          <div className="text-slate-800">Live LeetCode Sync</div>
        </div>
      </div>

      {/* Bottom Left Floating Badge: Department Leaderboard */}
      <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-amber-200/80 shadow-lg shadow-amber-500/10 text-xs font-bold text-amber-800 absolute bottom-16 left-16 animate-bounce [animation-duration:4.5s]">
        <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-amber-600 uppercase tracking-wider font-extrabold">CSBS Leaderboard</div>
          <div className="text-slate-800">Engagement Rankings</div>
        </div>
      </div>

      {/* Bottom Right Floating Badge: Problem of the Day */}
      <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-200/80 shadow-lg shadow-emerald-500/10 text-xs font-bold text-emerald-800 absolute bottom-20 right-16 animate-bounce [animation-duration:5.5s]">
        <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs animate-spin [animation-duration:12s]">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-emerald-600 uppercase tracking-wider font-extrabold">Daily Practice</div>
          <div className="text-slate-800">Curated POTD Challenges</div>
        </div>
      </div>

      {/* Subtle background blur gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-300/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Department / Institution Header with LeetCode Accent */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            {/* Animated glowing ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 rounded-3xl blur-sm opacity-70 animate-pulse" />
            
            <div className="relative p-3.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white ring-4 ring-white">
              <Code2 className="w-8 h-8" />
            </div>

            {/* Small icon badge overlay */}
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-white rounded-full shadow-md border-2 border-white animate-bounce [animation-duration:2s]">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
              <span>CSBS LeetCode Tracker</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              KGiSL Institute of Technology • Computer Science & Business Systems
            </p>
          </div>

          {/* Mini Feature Badges Row */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/90 border border-slate-200 rounded-full shadow-2xs">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>Daily POTD</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/90 border border-slate-200 rounded-full shadow-2xs">
              <Zap className="w-3 h-3 text-blue-500" />
              <span>Live Sync</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/90 border border-slate-200 rounded-full shadow-2xs">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span>Leaderboard</span>
            </span>
          </div>
        </div>

        {/* Auth Card (Light Theme) */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/60 p-6 sm:p-8 space-y-6 transition-all">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 relative">
            <button
              type="button"
              onClick={() => {
                setActiveRole('student');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'student'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <GraduationCap className={`w-4 h-4 transition-transform ${activeRole === 'student' ? 'text-blue-600 scale-110' : 'text-slate-500'}`} />
              <span>Student Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('staff');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'staff'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserCheck className={`w-4 h-4 transition-transform ${activeRole === 'staff' ? 'text-blue-600 scale-110' : 'text-slate-500'}`} />
              <span>Staff / Faculty</span>
            </button>
          </div>

          {/* Role Description Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200/80 rounded-xl p-3.5 text-xs text-blue-950 flex items-start gap-2.5 shadow-2xs">
            <div className="p-1 bg-blue-600 text-white rounded-md shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="leading-relaxed">
              {activeRole === 'student' ? (
                <span>
                  <strong>Student Login:</strong> Sign in with your <strong>College Mail ID</strong> as username and your <strong>Register Number</strong> as default password (or updated password).
                </span>
              ) : (
                <span>
                  <strong>Staff Login:</strong> Access complete department analytics, student progress tracking, Problem of the Day management, and system tools.
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{activeRole === 'student' ? 'Student Mail ID (Username)' : 'Staff Username / Email'}</span>
                {activeRole === 'student' && (
                  <span className="text-[10px] text-blue-600 font-normal">@kgkite.ac.in</span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeRole === 'student' ? 'e.g. 720723115001@kgkite.ac.in' : 'e.g. staff or faculty email'}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>
              {activeRole === 'student' && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-slate-400" />
                  <span>Tip: You can also use your Register No or LeetCode handle.</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {activeRole === 'student' ? 'Password (Default: Register Number)' : 'Password'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeRole === 'student' ? 'Enter password (default: Register Number)' : 'Enter staff password'}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.99] group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as {activeRole === 'student' ? 'Student' : 'Staff'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access (Staff only) */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold text-center">
              Testing & Evaluation
            </div>
            <button
              type="button"
              onClick={handleDemoStaff}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
            >
              <Award className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
              <span>One-Click Faculty Demo Login</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-slate-500 font-medium">
            Secure Authentication • Zero Private LeetCode Passwords Required
          </p>
          <p className="text-[10px] text-slate-400">
            KGiSL Institute of Technology • Department of Computer Science & Business Systems
          </p>
        </div>

      </div>
    </div>
  );
};
