import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Bell, 
  Clock, 
  Calendar, 
  Sparkles, 
  ExternalLink, 
  Flame, 
  Search, 
  Code2,
  Plus,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { StudentWithLatest, ContestItem } from '../types';
import { api } from '../services/api';

interface LeetCodeContestLeaderboardProps {
  students: StudentWithLatest[];
  onSelectStudent?: (id: string) => void;
  currentStudentId?: string; // If in student portal
  isFaculty?: boolean;
  onNavigateContests?: () => void;
}

// Country flags for LeetCode flair
const COUNTRY_FLAGS = ['🇺🇸', '🇮🇳', '🇨🇳', '🇯🇵', '🇩🇪', '🇨🇦', '🇬🇧', '🇫🇷', '🇦🇺', '🇸🇬', '🇰🇷', '🇧🇷'];

export const LeetCodeContestLeaderboard: React.FC<LeetCodeContestLeaderboardProps> = ({
  students,
  onSelectStudent,
  currentStudentId,
  isFaculty = false,
  onNavigateContests,
}) => {
  // Real contests from backend
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loadingContests, setLoadingContests] = useState(false);

  // State for Scope & Metrics (default to solved so leaderboard updates dynamically when students solve)
  const [scope, setScope] = useState<'GLOBAL' | 'CSBS' | 'SECA' | 'SECB' | 'SECC'>('GLOBAL');
  const [metric, setMetric] = useState<'solved' | 'rating' | 'score' | 'streak'>('solved');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContestTab, setActiveContestTab] = useState<'past' | 'my'>('past');
  const [alarmActive, setAlarmActive] = useState<{ [key: string]: boolean }>({});

  // Real-time clock for countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real contests from backend (no fake/demo data)
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoadingContests(true);
        const data = await api.getContests();
        setContests(data || []);
      } catch (e) {
        console.error('Failed to load contests for leaderboard:', e);
      } finally {
        setLoadingContests(false);
      }
    };
    fetchContests();
  }, []);

  // Filter and sort students
  const filteredStudents = students.filter(s => {
    if (scope === 'SECA' && s.section !== 'A') return false;
    if (scope === 'SECB' && s.section !== 'B') return false;
    if (scope === 'SECC' && s.section !== 'C') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.student_name.toLowerCase().includes(q);
      const matchUser = s.username.toLowerCase().includes(q);
      const matchReg = s.register_no.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchReg) return false;
    }
    return true;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const snapA = a.latest_snapshot;
    const snapB = b.latest_snapshot;

    if (metric === 'solved') {
      return (snapB?.total_solved || 0) - (snapA?.total_solved || 0);
    }
    if (metric === 'rating') {
      const ratA = snapA?.contest_rating || 0;
      const ratB = snapB?.contest_rating || 0;
      if (ratB !== ratA) return ratB - ratA;
      // If contest ratings are tied (e.g. 0 because not attended), sort by problems solved
      return (snapB?.total_solved || 0) - (snapA?.total_solved || 0);
    }
    if (metric === 'streak') {
      return (snapB?.streak || 0) - (snapA?.streak || 0);
    }
    // Default: engagement score
    return (snapB?.engagement_score || 0) - (snapA?.engagement_score || 0);
  });

  const top3 = sortedStudents.slice(0, 3);
  const remainingStudents = sortedStudents.slice(3);

  // Helper for displaying rating / metric (strictly dynamic from real student data, zero dummy data)
  const getDisplayRating = (s: StudentWithLatest) => {
    const snap = s.latest_snapshot;
    if (metric === 'solved') {
      return `${snap?.total_solved || 0} Solved`;
    }
    if (metric === 'rating') {
      return snap?.contest_rating ? `${snap.contest_rating} Rating` : '0 Rating';
    }
    if (metric === 'streak') {
      return `${snap?.streak || 0}d Streak`;
    }
    return `${snap?.engagement_score || 0} Score`;
  };

  const getAttendedCount = (s: StudentWithLatest) => {
    const snap = s.latest_snapshot;
    return snap?.contests_attended || 0;
  };

  const getCountryFlag = (idx: number) => {
    return COUNTRY_FLAGS[idx % COUNTRY_FLAGS.length];
  };

  // Countdown formatter
  const formatCountdown = (startTimeStr: string) => {
    const diff = new Date(startTimeStr).getTime() - now;
    if (diff <= 0) {
      return { text: 'LIVE NOW', isLive: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return { text: `${days}d ${hours}h ${minutes}m`, isLive: false };
    }
    return { 
      text: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, 
      isLive: false 
    };
  };

  // Real Upcoming and Past Contests from backend
  const upcomingContests = contests.filter(c => {
    const end = new Date(c.startTime).getTime() + ((c.durationMinutes || 90) * 60000);
    return end >= now;
  });

  const pastContests = contests.filter(c => {
    const end = new Date(c.startTime).getTime() + ((c.durationMinutes || 90) * 60000);
    return end < now;
  });

  // 3D Isometric Cube SVGs with strict size boundaries
  const Weekly3DCube: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
    <svg viewBox="0 0 160 160" className={`${className} block select-none`} fill="none">
      <defs>
        <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="cubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <polygon points="80,25 130,55 80,85 30,55" fill="url(#cubeTop)" stroke="#fff" strokeWidth="2" strokeOpacity="0.6" />
      <polygon points="30,55 80,85 80,135 30,105" fill="url(#cubeLeft)" stroke="#fff" strokeWidth="2" strokeOpacity="0.6" />
      <polygon points="80,85 130,55 130,105 80,135" fill="url(#cubeRight)" stroke="#fff" strokeWidth="2" strokeOpacity="0.6" />
      <polygon points="80,45 110,65 80,85 50,65" fill="#ffffff" opacity="0.4" />
      <polygon points="50,65 80,85 80,115 50,95" fill="#fef08a" opacity="0.5" />
      <polygon points="80,85 110,65 110,95 80,115" fill="#f59e0b" opacity="0.6" />
    </svg>
  );

  const Biweekly3DCube: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
    <svg viewBox="0 0 160 160" className={`${className} block select-none`} fill="none">
      <defs>
        <linearGradient id="purpleTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="purpleLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="purpleRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <g transform="translate(-10, 10) scale(0.75)">
        <polygon points="80,25 130,55 80,85 30,55" fill="url(#purpleTop)" stroke="#fff" strokeWidth="2" strokeOpacity="0.6" />
        <polygon points="30,55 80,85 80,135 30,105" fill="url(#purpleLeft)" stroke="#fff" strokeWidth="2" strokeOpacity="0.6" />
        <polygon points="80,85 130,55 130,105 80,135" fill="url(#purpleRight)" stroke="#fff" strokeWidth="2" strokeOpacity="0.6" />
      </g>
      <g transform="translate(20, -10) scale(0.85)">
        <polygon points="80,25 130,55 80,85 30,55" fill="url(#purpleTop)" stroke="#fff" strokeWidth="2" strokeOpacity="0.7" />
        <polygon points="30,55 80,85 80,135 30,105" fill="url(#purpleLeft)" stroke="#fff" strokeWidth="2" strokeOpacity="0.7" />
        <polygon points="80,85 130,55 130,105 80,135" fill="url(#purpleRight)" stroke="#fff" strokeWidth="2" strokeOpacity="0.7" />
      </g>
    </svg>
  );

  // Top 3 Podium Avatar Icons (matching LeetCode contest champion avatars from Image 1)
  const Rank1KirbyAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full rounded-full select-none" fill="none">
      <circle cx="50" cy="50" r="50" fill="#f472b6" />
      <circle cx="50" cy="50" r="46" fill="#fb7185" />
      <ellipse cx="50" cy="45" rx="42" ry="38" fill="#fda4af" opacity="0.3" />
      {/* Left Eye */}
      <ellipse cx="38" cy="42" rx="5.5" ry="12" fill="#0f172a" />
      <ellipse cx="38" cy="38" rx="3.5" ry="6" fill="#ffffff" />
      <ellipse cx="38" cy="46" rx="4" ry="4.5" fill="#0284c7" />
      <ellipse cx="39" cy="45" rx="2.5" ry="2.5" fill="#38bdf8" />
      {/* Right Eye */}
      <ellipse cx="62" cy="42" rx="5.5" ry="12" fill="#0f172a" />
      <ellipse cx="62" cy="38" rx="3.5" ry="6" fill="#ffffff" />
      <ellipse cx="62" cy="46" rx="4" ry="4.5" fill="#0284c7" />
      <ellipse cx="63" cy="45" rx="2.5" ry="2.5" fill="#38bdf8" />
      {/* Blush Cheeks */}
      <ellipse cx="25" cy="54" rx="7" ry="4.5" fill="#e11d48" opacity="0.75" />
      <ellipse cx="75" cy="54" rx="7" ry="4.5" fill="#e11d48" opacity="0.75" />
      {/* Joyful open mouth */}
      <path d="M43 56 Q50 70 57 56 Z" fill="#881337" />
      <ellipse cx="50" cy="62" rx="4.5" ry="3" fill="#f43f5e" />
    </svg>
  );

  // Rank 2: Cute Blue Mascot Hero Avatar (like the 1st)
  const Rank2CharacterAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full rounded-full select-none" fill="none">
      {/* Blue round face */}
      <circle cx="50" cy="50" r="50" fill="#38bdf8" />
      <circle cx="50" cy="50" r="46" fill="#0ea5e9" />
      <ellipse cx="50" cy="45" rx="42" ry="38" fill="#7dd3fc" opacity="0.3" />
      {/* Cute ears */}
      <ellipse cx="26" cy="20" rx="8" ry="12" fill="#0284c7" transform="rotate(-20, 26, 20)" />
      <ellipse cx="26" cy="20" rx="5" ry="8" fill="#7dd3fc" transform="rotate(-20, 26, 20)" />
      <ellipse cx="74" cy="20" rx="8" ry="12" fill="#0284c7" transform="rotate(20, 74, 20)" />
      <ellipse cx="74" cy="20" rx="5" ry="8" fill="#7dd3fc" transform="rotate(20, 74, 20)" />
      {/* Left Eye */}
      <ellipse cx="38" cy="44" rx="5.5" ry="11" fill="#0f172a" />
      <ellipse cx="38" cy="40" rx="3.5" ry="5.5" fill="#ffffff" />
      <ellipse cx="38" cy="48" rx="4" ry="4" fill="#0284c7" />
      <circle cx="39" cy="47" r="2" fill="#38bdf8" />
      {/* Right Eye */}
      <ellipse cx="62" cy="44" rx="5.5" ry="11" fill="#0f172a" />
      <ellipse cx="62" cy="40" rx="3.5" ry="5.5" fill="#ffffff" />
      <ellipse cx="62" cy="48" rx="4" ry="4" fill="#0284c7" />
      <circle cx="63" cy="47" r="2" fill="#38bdf8" />
      {/* Cute Cyan Blush Cheeks */}
      <ellipse cx="24" cy="56" rx="7" ry="4.5" fill="#0369a1" opacity="0.4" />
      <ellipse cx="76" cy="56" rx="7" ry="4.5" fill="#0369a1" opacity="0.4" />
      {/* Cute Smile */}
      <path d="M42 56 Q46 60 50 56 Q54 60 58 56" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="50" cy="62" rx="4" ry="3" fill="#f43f5e" />
    </svg>
  );

  // Rank 3: Cute Amber Mascot Hero Avatar (like the 1st)
  const Rank3CharacterAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full rounded-full select-none" fill="none">
      {/* Golden round face */}
      <circle cx="50" cy="50" r="50" fill="#f59e0b" />
      <circle cx="50" cy="50" r="46" fill="#fbbf24" />
      <ellipse cx="50" cy="45" rx="42" ry="38" fill="#fef08a" opacity="0.3" />
      {/* Cute Rounded Ears */}
      <circle cx="24" cy="22" r="11" fill="#d97706" />
      <circle cx="24" cy="22" r="6" fill="#fef08a" />
      <circle cx="76" cy="22" r="11" fill="#d97706" />
      <circle cx="76" cy="22" r="6" fill="#fef08a" />
      {/* Left Eye */}
      <ellipse cx="38" cy="44" rx="5.5" ry="11" fill="#451a03" />
      <ellipse cx="38" cy="40" rx="3.5" ry="5.5" fill="#ffffff" />
      <ellipse cx="38" cy="48" rx="4" ry="4" fill="#b45309" />
      <circle cx="39" cy="47" r="2" fill="#fde047" />
      {/* Right Eye */}
      <ellipse cx="62" cy="44" rx="5.5" ry="11" fill="#451a03" />
      <ellipse cx="62" cy="40" rx="3.5" ry="5.5" fill="#ffffff" />
      <ellipse cx="62" cy="48" rx="4" ry="4" fill="#b45309" />
      <circle cx="63" cy="47" r="2" fill="#fde047" />
      {/* Rosy Cheeks */}
      <circle cx="24" cy="56" r="6.5" fill="#ea580c" opacity="0.5" />
      <circle cx="76" cy="56" r="6.5" fill="#ea580c" opacity="0.5" />
      {/* Tiny Nose & Mouth */}
      <ellipse cx="50" cy="52" rx="2" ry="1.5" fill="#78350f" />
      <path d="M44 56 Q50 67 56 56 Z" fill="#991b1b" />
      <ellipse cx="50" cy="61" rx="3.5" ry="2" fill="#f87171" />
    </svg>
  );

  // Illustrated Avatar Icons for All Ranked Students (Cat, Robot, Ninja, Panda, Astro, Wizard, Fox, Bear)
  const ContestStudentAvatar: React.FC<{ index: number }> = ({ index }) => {
    const avatarType = index % 8;

    switch (avatarType) {
      case 0: // Cute Cat (matching LeetCode rank 4 cat icon)
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
            <circle cx="40" cy="40" r="40" fill="#fef3c7" />
            {/* Ears */}
            <polygon points="18,34 26,14 36,28" fill="#f59e0b" />
            <polygon points="21,31 27,17 34,26" fill="#fed7aa" />
            <polygon points="62,34 54,14 44,28" fill="#f59e0b" />
            <polygon points="59,31 53,17 46,26" fill="#fed7aa" />
            {/* Head */}
            <circle cx="40" cy="44" r="26" fill="#ffffff" />
            <path d="M26,26 Q40,32 54,26 Q48,46 40,46 Q32,46 26,26 Z" fill="#f59e0b" opacity="0.35" />
            {/* Eyes */}
            <ellipse cx="32" cy="42" rx="3.5" ry="5" fill="#0f172a" />
            <circle cx="33" cy="40" r="1.5" fill="#ffffff" />
            <ellipse cx="48" cy="42" rx="3.5" ry="5" fill="#0f172a" />
            <circle cx="49" cy="40" r="1.5" fill="#ffffff" />
            {/* Nose & Mouth */}
            <polygon points="38,48 42,48 40,51" fill="#f43f5e" />
            <path d="M37,51 Q40,54 43,51" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            {/* Whiskers */}
            <line x1="18" y1="46" x2="28" y2="47" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="18" y1="51" x2="28" y2="50" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="62" y1="46" x2="52" y2="47" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="62" y1="51" x2="52" y2="50" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 1: // Cyber Visor Robot
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
            <circle cx="40" cy="40" r="40" fill="#0f172a" />
            {/* Antenna */}
            <line x1="40" y1="14" x2="40" y2="24" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="14" r="3" fill="#38bdf8" />
            {/* Robot Head */}
            <rect x="22" y="24" width="36" height="34" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            {/* Glowing Visor */}
            <rect x="26" y="32" width="28" height="9" rx="4.5" fill="#0284c7" />
            <rect x="28" y="34" width="24" height="5" rx="2.5" fill="#38bdf8" />
            {/* Cheeks / Bolts */}
            <circle cx="27" cy="48" r="2" fill="#64748b" />
            <circle cx="53" cy="48" r="2" fill="#64748b" />
            <line x1="34" y1="50" x2="46" y2="50" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 2: // Ninja Coder
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
            <circle cx="40" cy="40" r="40" fill="#312e81" />
            {/* Hood */}
            <circle cx="40" cy="42" r="26" fill="#1e1b4b" />
            {/* Face slit */}
            <rect x="24" y="34" width="32" height="15" rx="5" fill="#fed7aa" />
            {/* Ninja Eyes */}
            <ellipse cx="32" cy="41" rx="4" ry="2.5" fill="#0f172a" />
            <ellipse cx="48" cy="41" rx="4" ry="2.5" fill="#0f172a" />
            <circle cx="33" cy="40" r="1" fill="#38bdf8" />
            <circle cx="49" cy="40" r="1" fill="#38bdf8" />
            {/* Headband with Code Glyph */}
            <rect x="18" y="26" width="44" height="8" rx="2" fill="#4338ca" />
            <path d="M37,28 L34,30 L37,32" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M43,28 L46,30 L43,32" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 3: // Panda Coder
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
            <circle cx="40" cy="40" r="40" fill="#e2e8f0" />
            {/* Black Ears */}
            <circle cx="22" cy="22" r="10" fill="#0f172a" />
            <circle cx="58" cy="22" r="10" fill="#0f172a" />
            {/* White Face */}
            <circle cx="40" cy="44" r="26" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Eye Patches */}
            <ellipse cx="30" cy="42" rx="7" ry="9" fill="#0f172a" transform="rotate(-15, 30, 42)" />
            <circle cx="31" cy="40" r="2.5" fill="#ffffff" />
            <ellipse cx="50" cy="42" rx="7" ry="9" fill="#0f172a" transform="rotate(15, 50, 42)" />
            <circle cx="49" cy="40" r="2.5" fill="#ffffff" />
            {/* Nose & Blush */}
            <ellipse cx="40" cy="50" rx="3.5" ry="2.5" fill="#0f172a" />
            <circle cx="23" cy="51" r="3.5" fill="#fda4af" />
            <circle cx="57" cy="51" r="3.5" fill="#fda4af" />
          </svg>
        );

      case 4: // Astronaut Explorer
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
            <circle cx="40" cy="40" r="40" fill="#0369a1" />
            {/* Helmet */}
            <circle cx="40" cy="42" r="26" fill="#f8fafc" />
            <rect x="23" y="28" width="34" height="24" rx="12" fill="#0f172a" />
            {/* Gold Reflective Visor */}
            <rect x="25" y="30" width="30" height="20" rx="10" fill="url(#astroVisor)" />
            <defs>
              <linearGradient id="astroVisor" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
            </defs>
            {/* Visor Glare */}
            <ellipse cx="32" cy="36" rx="4" ry="2" fill="#ffffff" opacity="0.6" transform="rotate(-20, 32, 36)" />
          </svg>
        );

      case 5: // Magic Wizard
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
            <circle cx="40" cy="40" r="40" fill="#581c87" />
            {/* Wizard Hat */}
            <polygon points="40,8 18,36 62,36" fill="#7e22ce" />
            <ellipse cx="40" cy="36" rx="26" ry="5" fill="#6b21a8" />
            {/* Star on Hat */}
            <path d="M40,18 L41.5,22 L45.5,22 L42.5,24.5 L43.5,28.5 L40,26 L36.5,28.5 L37.5,24.5 L34.5,22 L38.5,22 Z" fill="#facc15" />
            {/* Face */}
            <circle cx="40" cy="48" r="16" fill="#fed7aa" />
            {/* Beard */}
            <path d="M26,50 Q40,68 54,50 Q40,58 26,50 Z" fill="#f8fafc" />
            {/* Eyes */}
            <circle cx="35" cy="45" r="2" fill="#1e1b4b" />
            <circle cx="45" cy="45" r="2" fill="#1e1b4b" />
          </svg>
        );

      case 6: // Kitsune Fox
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
            <circle cx="40" cy="40" r="40" fill="#ffedd5" />
            {/* Pointy Ears */}
            <polygon points="20,38 18,12 36,26" fill="#ea580c" />
            <polygon points="22,34 21,17 33,25" fill="#f8fafc" />
            <polygon points="60,38 62,12 44,26" fill="#ea580c" />
            <polygon points="58,34 59,17 47,25" fill="#f8fafc" />
            {/* Fox Face */}
            <circle cx="40" cy="44" r="24" fill="#f97316" />
            {/* White Cheeks */}
            <path d="M18,48 Q28,62 40,62 Q52,62 62,48 Q40,56 18,48 Z" fill="#ffffff" />
            {/* Eyes */}
            <ellipse cx="31" cy="42" rx="3.5" ry="4" fill="#0f172a" />
            <circle cx="32" cy="41" r="1" fill="#ffffff" />
            <ellipse cx="49" cy="42" rx="3.5" ry="4" fill="#0f172a" />
            <circle cx="50" cy="41" r="1" fill="#ffffff" />
            {/* Black Nose */}
            <ellipse cx="40" cy="55" rx="3" ry="2" fill="#0f172a" />
          </svg>
        );

      case 7: // Gaming Bear
      default:
        return (
          <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
            <circle cx="40" cy="40" r="40" fill="#f1f5f9" />
            {/* Bear Ears */}
            <circle cx="22" cy="24" r="8" fill="#78350f" />
            <circle cx="22" cy="24" r="4.5" fill="#fcd34d" />
            <circle cx="58" cy="24" r="8" fill="#78350f" />
            <circle cx="58" cy="24" r="4.5" fill="#fcd34d" />
            {/* Bear Head */}
            <circle cx="40" cy="44" r="25" fill="#92400e" />
            {/* Snout */}
            <ellipse cx="40" cy="52" rx="10" ry="8" fill="#fde68a" />
            <ellipse cx="40" cy="49" rx="3.5" ry="2.5" fill="#451a03" />
            {/* Eyes */}
            <circle cx="31" cy="42" r="3" fill="#0f172a" />
            <circle cx="32" cy="41" r="1" fill="#ffffff" />
            <circle cx="49" cy="42" r="3" fill="#0f172a" />
            <circle cx="50" cy="41" r="1" fill="#ffffff" />
            {/* Gaming Headset */}
            <path d="M16,42 C16,22 64,22 64,42" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" fill="none" />
            <rect x="13" y="38" width="6" height="14" rx="3" fill="#7c3aed" />
            <rect x="61" y="38" width="6" height="14" rx="3" fill="#7c3aed" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-8 font-sans antialiased text-slate-800">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER SECTION (Luck += 10, Gold Trophy, Subtitle) */}
      {/* ========================================================= */}
      <div className="flex flex-col items-center justify-center text-center relative pt-2 pb-2">
        
        {/* Luck += 10 Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-2xs text-[11px] font-bold text-emerald-800 mb-4 transition-transform hover:scale-105">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
          <span>Luck += 10</span>
        </div>

        {/* 3D Gold Trophy Icon */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute w-28 h-28 bg-amber-400/20 rounded-full blur-2xl -z-10 animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-20 h-20 drop-shadow-lg filter" fill="none">
            <defs>
              <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#facc15" />
                <stop offset="70%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>
            <path d="M42 98 L78 98 L74 90 L46 90 Z" fill="#ca8a04" />
            <rect x="36" y="98" width="48" height="10" rx="3" fill="#a16207" />
            <rect x="40" y="102" width="40" height="4" rx="2" fill="#eab308" />
            <path d="M54 75 L66 75 L64 90 L56 90 Z" fill="url(#trophyGold)" />
            <path d="M32 24 C32 24 30 65 60 76 C90 65 88 24 88 24 Z" fill="url(#trophyGold)" />
            <ellipse cx="60" cy="24" rx="28" ry="8" fill="#fef08a" />
            <ellipse cx="60" cy="24" rx="24" ry="5" fill="#ca8a04" />
            <path d="M33 30 C18 30 18 52 35 58" stroke="url(#trophyGold)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M87 30 C102 30 102 52 85 58" stroke="url(#trophyGold)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="60" cy="46" r="11" fill="#78350f" opacity="0.3" />
            <path d="M57 41 L63 46 L57 51" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          LeetCode Contest
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Contest every week. Compete and see your ranking!
        </p>
      </div>

      {/* ========================================================= */}
      {/* 2. FEATURED CONTEST CARDS (UPDATED ONLY WHEN POSTED)       */}
      {/* ========================================================= */}
      {upcomingContests.length === 0 ? (
        /* Empty State when faculty has NOT posted any contest */
        <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto shadow-2xs">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              No Active Contests Scheduled
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-md mx-auto">
              {isFaculty 
                ? 'Weekly and biweekly contests will be displayed here once scheduled by faculty in the Contest Arena.'
                : 'Contests scheduled by your faculty will appear here with live countdown timers and direct challenge links.'}
            </p>
          </div>
          {isFaculty && (
            <div className="pt-2">
              <a
                href="https://leetcode.com/contest/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Explore & Post Contests</span>
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Real Scheduled Contests from Backend */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {upcomingContests.slice(0, 2).map((c, cIdx) => {
            const isWeekly = c.type === 'Weekly Contest' || cIdx === 0;
            const { text: countdown, isLive } = formatCountdown(c.startTime);
            const isAlarm = alarmActive[c.id];

            return isWeekly ? (
              /* CARD 1: Warm Amber / Gold 3D Card */
              <div 
                key={c.id}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-100/90 via-amber-200/70 to-amber-300/80 p-5 sm:p-6 border border-amber-300/60 shadow-lg shadow-amber-500/10 flex flex-col justify-between group hover:shadow-xl transition-all min-h-[210px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/60 bg-amber-400/30 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {c.type}
                  </span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border shadow-2xs ${
                    isLive 
                      ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse' 
                      : 'bg-black/15 backdrop-blur-md text-slate-900 border-black/10'
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-amber-900" />
                    <span>{countdown}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center my-2 transform group-hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                    <Weekly3DCube className="w-24 h-24" />
                  </div>
                </div>

                <div className="flex items-end justify-between pt-2 border-t border-amber-400/30">
                  <div className="min-w-0 pr-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {c.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-700 font-medium truncate">
                      {new Date(c.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.durationMinutes || 90}m)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={c.contestUrl || 'https://leetcode.com/contest/'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                    </a>
                    <button
                      onClick={() => setAlarmActive(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                      title="Set Contest Reminder"
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        isAlarm 
                          ? 'bg-amber-600 text-white border-amber-700 shadow-md' 
                          : 'bg-white/60 hover:bg-white text-slate-700 border-amber-300/60 shadow-2xs'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* CARD 2: Indigo / Purple 3D Card */
              <div 
                key={c.id}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 p-5 sm:p-6 border border-purple-500/30 shadow-lg shadow-purple-900/20 flex flex-col justify-between group hover:shadow-xl transition-all text-white min-h-[210px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {c.type}
                  </span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border shadow-2xs ${
                    isLive 
                      ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse' 
                      : 'bg-white/15 backdrop-blur-md text-white border-white/20'
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-purple-300" />
                    <span>{countdown}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center my-2 transform group-hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                    <Biweekly3DCube className="w-24 h-24" />
                  </div>
                </div>

                <div className="flex items-end justify-between pt-2 border-t border-purple-500/30">
                  <div className="min-w-0 pr-2">
                    <h3 className="text-base sm:text-lg font-black text-white truncate">
                      {c.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-purple-200 font-medium truncate">
                      {new Date(c.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.durationMinutes || 90}m)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={c.contestUrl || 'https://leetcode.com/contest/'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-purple-900 text-xs font-black rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3 text-purple-600" />
                    </a>
                    <button
                      onClick={() => setAlarmActive(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                      title="Set Contest Reminder"
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        isAlarm 
                          ? 'bg-purple-500 text-white border-purple-400 shadow-md' 
                          : 'bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-2xs'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini Link Below Cards */}
      <div className="text-center">
        <a 
          href="https://leetcode.com/contest/" 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
        >
          <span>☕ Explore Official LeetCode Contests</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN SECTION: PODIUM LEADERBOARD (LEFT) & CONTESTS (RIGHT) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto items-start">
        
        {/* ======================================================= */}
        {/* LEFT COLUMN: LEETCODE CONTEST LEADERBOARD (Cols: 6 / 12) */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 bg-slate-50/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          
          {/* Header Controls: Scope Pills & Metric Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Scope Pill Switcher */}
            <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-full border border-slate-300/60 shadow-2xs">
              <button
                onClick={() => setScope('GLOBAL')}
                className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  scope === 'GLOBAL'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                GLOBAL
              </button>
              <button
                onClick={() => setScope('CSBS')}
                className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  scope === 'CSBS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CSBS
              </button>
              <button
                onClick={() => setScope('SECA')}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  scope === 'SECA'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sec A
              </button>
              <button
                onClick={() => setScope('SECB')}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  scope === 'SECB'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sec B
              </button>
              <button
                onClick={() => setScope('SECC')}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  scope === 'SECC'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sec C
              </button>
            </div>

            {/* Metric Select */}
            <select
              value={metric}
              onChange={e => setMetric(e.target.value as any)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs cursor-pointer"
            >
              <option value="solved">📊 Problems Solved</option>
              <option value="rating">🏆 Contest Rating</option>
              <option value="score">⚡ Engagement Score</option>
              <option value="streak">🔥 Active Streak</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leaderboard by student or handle..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
            />
          </div>

          {/* ===================================================== */}
          {/* TOP 3 PODIUM                                          */}
          {/* ===================================================== */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-4 pb-2">
              
              {/* RANK #2 (Silver - Left) */}
              {top3[1] ? (
                <div 
                  onClick={() => onSelectStudent?.(top3[1].id)}
                  className="flex flex-col items-center text-center cursor-pointer group transition-transform hover:-translate-y-1"
                >
                  <div className="relative mb-1 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-black border border-slate-400 shadow-xs mb-1">
                      2
                    </div>
                  </div>

                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center relative overflow-hidden">
                    <Rank2CharacterAvatar />
                  </div>

                  <div className="mt-2 w-full bg-white rounded-xl py-1.5 px-1.5 border border-slate-200 shadow-2xs text-center">
                    <div className="font-extrabold text-xs text-slate-800 truncate px-1 group-hover:text-blue-600 transition-colors">
                      {top3[1].student_name}
                    </div>
                    <div className="text-[11px] font-mono font-black text-slate-500 mt-0.5">
                      {getDisplayRating(top3[1])}
                    </div>
                  </div>
                </div>
              ) : <div />}

              {/* RANK #1 (Gold - Center, Elevated) */}
              {top3[0] ? (
                <div 
                  onClick={() => onSelectStudent?.(top3[0].id)}
                  className="flex flex-col items-center text-center cursor-pointer group -translate-y-2 transition-transform hover:-translate-y-3"
                >
                  <div className="relative mb-1 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-amber-500 fill-amber-400 drop-shadow-sm animate-bounce" style={{ animationDuration: '2s' }} />
                  </div>

                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-pink-500 p-1 shadow-lg shadow-amber-500/20 flex items-center justify-center relative ring-2 ring-amber-300 overflow-hidden">
                    <Rank1KirbyAvatar />
                  </div>

                  <div className="mt-2 w-full bg-white rounded-xl py-2 px-1.5 border-2 border-amber-300 shadow-xs text-center">
                    <div className="font-black text-xs sm:text-sm text-slate-900 truncate px-1 group-hover:text-amber-600 transition-colors">
                      {top3[0].student_name}
                    </div>
                    <div className="text-xs font-mono font-black text-amber-600 mt-0.5">
                      {getDisplayRating(top3[0])}
                    </div>
                  </div>
                </div>
              ) : <div />}

              {/* RANK #3 (Bronze - Right) */}
              {top3[2] ? (
                <div 
                  onClick={() => onSelectStudent?.(top3[2].id)}
                  className="flex flex-col items-center text-center cursor-pointer group transition-transform hover:-translate-y-1"
                >
                  <div className="relative mb-1 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center text-[10px] font-black border border-amber-800 shadow-xs mb-1">
                      3
                    </div>
                  </div>

                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-orange-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center relative overflow-hidden">
                    <Rank3CharacterAvatar />
                  </div>

                  <div className="mt-2 w-full bg-white rounded-xl py-1.5 px-1.5 border border-slate-200 shadow-2xs text-center">
                    <div className="font-extrabold text-xs text-slate-800 truncate px-1 group-hover:text-amber-700 transition-colors">
                      {top3[2].student_name}
                    </div>
                    <div className="text-[11px] font-mono font-black text-slate-500 mt-0.5">
                      {getDisplayRating(top3[2])}
                    </div>
                  </div>
                </div>
              ) : <div />}

            </div>
          )}

          {/* ===================================================== */}
          {/* RANKED LIST ROWS (Rank #4+)                           */}
          {/* ===================================================== */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {remainingStudents.map((s, idx) => {
              const rank = idx + 4;
              const isCurrent = currentStudentId === s.id;
              const rating = getDisplayRating(s);
              const attended = getAttendedCount(s);

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectStudent?.(s.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    isCurrent 
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400 shadow-xs' 
                      : 'bg-white hover:bg-slate-100/80 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="w-6 text-center font-mono font-bold text-xs text-slate-500">
                      {rank}
                    </span>

                    <div className="w-8 h-8 rounded-full overflow-hidden shadow-2xs border border-slate-200 shrink-0 group-hover:border-amber-400 transition-colors">
                      <ContestStudentAvatar index={rank} />
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 truncate flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                        <span>{s.student_name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-black">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        @{s.username} • Sec {s.section}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-slate-800">
                      <span className="text-[10px] text-slate-400 font-normal mr-1">
                        {metric === 'solved' ? 'Solved:' : metric === 'rating' ? 'Rating:' : metric === 'streak' ? 'Streak:' : 'Score:'}
                      </span>
                      <span className="text-amber-600 font-black">{rating}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Attended: {attended}
                    </div>
                  </div>

                </div>
              );
            })}

            {sortedStudents.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No students found matching your criteria.
              </div>
            )}
          </div>

        </div>

        {/* ======================================================= */}
        {/* RIGHT COLUMN: PAST CONTESTS / MY CONTESTS (Cols: 6 / 12) */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          
          {/* Tabs & Action Icon */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveContestTab('past')}
                className={`text-xs sm:text-sm font-extrabold relative pb-1 transition-colors cursor-pointer ${
                  activeContestTab === 'past' 
                    ? 'text-slate-900 border-b-2 border-purple-600' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Past Contests
              </button>
              <button
                onClick={() => setActiveContestTab('my')}
                className={`text-xs sm:text-sm font-extrabold relative pb-1 transition-colors cursor-pointer ${
                  activeContestTab === 'my' 
                    ? 'text-slate-900 border-b-2 border-purple-600' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                My Contests
              </button>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Code2 className="w-4 h-4" />
            </div>
          </div>

          {/* List of Real Past Contests */}
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {pastContests.length === 0 ? (
              <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Past Contests Recorded</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  When faculty schedules and completes official weekly or department contests, past challenge records will appear here.
                </p>
              </div>
            ) : (
              pastContests.map(c => {
                const isWeekly = c.type === 'Weekly Contest';
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                  >
                    {/* Left: Contained 3D Thumbnail + Title + Date */}
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Fully constrained 3D Thumbnail - No Overflow */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden relative shadow-2xs ${
                        isWeekly 
                          ? 'bg-gradient-to-br from-amber-100 to-amber-300 border-amber-300/60' 
                          : 'bg-gradient-to-br from-indigo-900 to-purple-950 border-purple-500/30'
                      }`}>
                        {isWeekly ? (
                          <Weekly3DCube className="w-7 h-7" />
                        ) : (
                          <Biweekly3DCube className="w-7 h-7" />
                        )}
                      </div>

                      {/* Contest Name & Date */}
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                          {c.title}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                          {new Date(c.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Right: Score Badge & Virtual Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                        {c.problems?.length || 4} Qs
                      </span>

                      <a
                        href={c.contestUrl || 'https://leetcode.com/contest/'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-full text-[11px] font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 transition-all cursor-pointer shadow-2xs"
                      >
                        Virtual
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
