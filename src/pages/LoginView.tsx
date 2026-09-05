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
  Flame,
  Zap,
  Trophy,
  Sparkles,
  Code2,
  Cpu,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import { AuthUser, UserRole } from '../types';
import { CodexLogo } from '../components/CodexLogo';

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
      setError(activeRole === 'student' ? 'Please enter your mail id and password.' : 'Please enter your faculty username and password.');
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

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center md:items-end p-4 sm:p-6 lg:p-8 lg:pr-6 xl:pr-10 font-sans antialiased text-slate-100 relative overflow-hidden selection:bg-purple-600 selection:text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/login-bg-kgisl.jpg')` }}
    >
      {/* Subtle Overlay for perfect contrast while keeping full background photo visible */}
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] pointer-events-none -z-10" />

      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '4s' }} />

      {/* ========================================================= */}
      {/* TWO-COLUMN LAYOUT: LEFT SIDE HERO & RIGHT SIDE LOGIN CARD */}
      {/* ========================================================= */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 z-10 my-auto">

        {/* LEFT SIDE BRANDING PRESENTATION (SENIOR UI/UX PERFECT ARCHITECTURAL ALIGNMENT) */}
        <div className="hidden md:flex flex-col items-center text-center space-y-1.5 z-10 max-w-md my-auto pt-16 md:pt-20 lg:pt-24 xl:pt-28">

          {/* Department of CSBS */}
          <h2 className="text-xs lg:text-sm font-bold text-white/95 drop-shadow-md tracking-wider">
            Department of CSBS
          </h2>

          {/* Nexora Association */}
          <h1 className="text-sm lg:text-base font-black text-purple-300 drop-shadow-md tracking-widest uppercase">
            Nexora Association
          </h1>

          {/* ─── Presents ─── Divider */}
          <div className="flex items-center justify-center gap-2 w-full py-0.5 opacity-90">
            <div className="h-[1px] w-6 lg:w-10 bg-gradient-to-r from-transparent to-purple-300/70"></div>
            <span className="text-[10px] lg:text-[11px] font-semibold text-slate-200 tracking-[0.2em] uppercase drop-shadow-xs">
              Presents
            </span>
            <div className="h-[1px] w-6 lg:w-10 bg-gradient-to-l from-transparent to-purple-300/70"></div>
          </div>

          {/* Horizontal CODEX Logo (Subtitle removed per request) */}
          <div className="pt-0.5">
            <CodexLogo
              size="sm"
              layout="horizontal"
              showSubtitle={false}
              animated={true}
              textColor="#ffffff"
            />
          </div>

        </div>

        {/* RIGHT SIDE LOGIN CARD */}
        <div className="w-full max-w-[440px] shrink-0 md:ml-auto">
          {/* UNIFIED SINGLE CARD: Logo, Subtitle, Role Switcher & Login Form */}
          <div className="bg-slate-900/20 backdrop-blur-md border border-white/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-white transition-all hover:bg-slate-900/30">

            {/* Logo & Subtitle Section */}
            <div className="text-center space-y-2">
              <CodexLogo size="md" showSubtitle={true} animated={true} textColor="#ffffff" subtitleClassName="text-white font-extrabold drop-shadow-sm" />

              <div className="pt-0.5">
                <p className="text-[11px] text-white/95 font-bold drop-shadow-sm">
                  KGiSL Institute of Technology • Computer Science & Business Systems
                </p>
              </div>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-black/50 backdrop-blur-md rounded-2xl border border-white/20 relative">
              <button
                type="button"
                onClick={() => {
                  setActiveRole('student');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeRole === 'student'
                  ? 'bg-white text-purple-700 shadow-lg border border-white/80'
                  : 'text-white/90 hover:text-white'
                  }`}
              >
                <GraduationCap className={`w-4 h-4 transition-transform ${activeRole === 'student' ? 'text-purple-600 scale-110' : 'text-slate-200'}`} />
                <span>Student Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole('staff');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeRole === 'staff'
                  ? 'bg-white text-purple-700 shadow-lg border border-white/80'
                  : 'text-white/90 hover:text-white'
                  }`}
              >
                <UserCheck className={`w-4 h-4 transition-transform ${activeRole === 'staff' ? 'text-purple-600 scale-110' : 'text-slate-200'}`} />
                <span>Faculty Portal</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/25 backdrop-blur-md border border-rose-400/50 rounded-2xl p-3 text-xs text-rose-100 flex items-center gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0" />
                <span className="font-bold">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-white drop-shadow-sm">
                  {activeRole === 'student' ? 'Student Mail ID (Username)' : 'Faculty Username'}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-purple-300 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={activeRole === 'student' ? 'Enter your mail id' : 'Enter your username'}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/45 backdrop-blur-md border border-white/30 rounded-xl text-sm text-white placeholder-slate-300 focus:bg-black/65 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 font-semibold transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-white drop-shadow-sm">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-purple-300 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-black/45 backdrop-blur-md border border-white/30 rounded-xl text-sm text-white placeholder-slate-300 focus:bg-black/65 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 font-semibold transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.99] group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In as {activeRole === 'student' ? 'Student' : 'Faculty'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

          </div>

        </div>
      </div>
    </div>
  );
};
