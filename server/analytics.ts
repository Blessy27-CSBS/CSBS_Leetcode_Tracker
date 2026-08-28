import { 
  Student, 
  Snapshot, 
  StudentWithLatest, 
  DashboardSummary, 
  SectionStat, 
  BatchStat, 
  SystemSettings,
  PerformanceTier,
  RiskLevel,
  ActivityStatus
} from '../src/types.js';

export function calculateEngagementScore(
  snapshot: {
    total_solved: number;
    medium: number;
    hard: number;
    streak: number;
    contest_rating: number;
    contests_attended: number;
    days_inactive?: number;
    improvement_rate?: number;
  },
  settings: SystemSettings
): number {
  const w = settings.weights;
  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0) || 100;

  // Normalized metrics (0 - 1)
  const totalSolvedScore = Math.min(1, snapshot.total_solved / 300);
  const mediumScore = Math.min(1, snapshot.medium / 120);
  const hardScore = Math.min(1, snapshot.hard / 40);
  
  const inactivityDays = snapshot.days_inactive !== undefined ? snapshot.days_inactive : 0;
  const threshold = settings.inactivity_threshold_days || 14;
  const recencyScore = Math.max(0, Math.min(1, (threshold - inactivityDays) / threshold));
  
  const streakScore = Math.min(1, snapshot.streak / 30);
  const contestScore = snapshot.contest_rating > 1100 
    ? Math.min(1, (snapshot.contest_rating - 1100) / 800)
    : Math.min(1, snapshot.contests_attended / 10);
  
  const impRate = snapshot.improvement_rate || 0;
  const improvementScore = Math.min(1, Math.max(0, impRate / 30));

  const weightedSum = 
    (totalSolvedScore * w.total_solved) +
    (mediumScore * w.medium_solved) +
    (hardScore * w.hard_solved) +
    (recencyScore * w.recent_activity) +
    (streakScore * w.streak) +
    (contestScore * w.contest_participation) +
    (improvementScore * w.improvement_rate);

  const rawScore = (weightedSum / totalWeight) * 100;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

export function getPerformanceTier(totalSolved: number, settings: SystemSettings): PerformanceTier {
  if (totalSolved > settings.tier_proficient_max) return 'Advanced';
  if (totalSolved > settings.tier_developing_max) return 'Proficient';
  if (totalSolved > settings.tier_beginner_max) return 'Developing';
  return 'Beginner';
}

export function getDaysInactive(lastActiveDate?: string): number {
  if (!lastActiveDate) return 999;
  const last = new Date(lastActiveDate).getTime();
  if (isNaN(last)) return 999;
  const now = new Date().getTime();
  const diffDays = Math.floor((now - last) / 86400000);
  return Math.max(0, diffDays);
}

export function getActivityStatus(daysInactive: number, threshold: number): ActivityStatus {
  if (daysInactive >= 990) return 'No Data';
  return daysInactive <= threshold ? 'Active' : 'Inactive';
}

export function getRiskLevel(daysInactive: number, threshold: number): RiskLevel {
  if (daysInactive >= 990) return 'Unknown';
  if (daysInactive <= threshold / 2) return 'Low';
  if (daysInactive <= threshold * 1.5) return 'Moderate';
  return 'High';
}

export function enrichStudentWithSnapshots(
  student: Student,
  snapshots: Snapshot[],
  settings: SystemSettings
): StudentWithLatest {
  const studentSnaps = snapshots
    .filter(s => s.student_id === student.id)
    .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());

  const latest = studentSnaps.length > 0 ? studentSnaps[studentSnaps.length - 1] : undefined;
  const prev = studentSnaps.length > 1 ? studentSnaps[studentSnaps.length - 2] : undefined;

  let problemsAddedWeek = 0;
  let problemsAddedMonth = 0;
  let problemsAddedSemester = 0;
  let impPctMonth = 0;
  let daysInactive = 999;
  let riskLevel: RiskLevel = 'Unknown';

  if (latest) {
    daysInactive = getDaysInactive(latest.last_active);
    riskLevel = getRiskLevel(daysInactive, settings.inactivity_threshold_days);

    const nowTime = new Date(latest.captured_at).getTime();
    
    // Find snapshot ~7 days ago
    const snap7Days = studentSnaps.find(s => {
      const diff = (nowTime - new Date(s.captured_at).getTime()) / 86400000;
      return diff >= 5 && diff <= 10;
    }) || prev;

    // Find snapshot ~30 days ago
    const snap30Days = studentSnaps.find(s => {
      const diff = (nowTime - new Date(s.captured_at).getTime()) / 86400000;
      return diff >= 20 && diff <= 40;
    }) || (studentSnaps.length > 0 ? studentSnaps[0] : undefined);

    // Find earliest snapshot for semester
    const snapEarliest = studentSnaps.length > 0 ? studentSnaps[0] : undefined;

    if (snap7Days && snap7Days.id !== latest.id) {
      problemsAddedWeek = Math.max(0, latest.total_solved - snap7Days.total_solved);
    }
    if (snap30Days && snap30Days.id !== latest.id) {
      problemsAddedMonth = Math.max(0, latest.total_solved - snap30Days.total_solved);
      const baseline = snap30Days.total_solved || 1;
      impPctMonth = Math.round((problemsAddedMonth / baseline) * 100);
    }
    if (snapEarliest && snapEarliest.id !== latest.id) {
      problemsAddedSemester = Math.max(0, latest.total_solved - snapEarliest.total_solved);
    }
  }

  return {
    ...student,
    latest_snapshot: latest,
    previous_snapshot: prev,
    problems_added_week: problemsAddedWeek,
    problems_added_month: problemsAddedMonth,
    problems_added_semester: problemsAddedSemester,
    improvement_pct_month: impPctMonth,
    days_inactive: daysInactive,
    risk_level: riskLevel,
  };
}

export function computeDashboardSummary(
  students: StudentWithLatest[],
  settings: SystemSettings
): DashboardSummary {
  const totalStudents = students.length;
  let activeCount = 0;
  let inactiveCount = 0;
  let noDataCount = 0;
  let totalProblems = 0;
  let totalRatingSum = 0;
  let ratedCount = 0;
  let totalEngagementSum = 0;
  let engagementCount = 0;

  const difficultyDist = { easy: 0, medium: 0, hard: 0 };
  const tierDist = { Beginner: 0, Developing: 0, Proficient: 0, Advanced: 0 };

  let highestSolver: DashboardSummary['highest_problem_solver'] = undefined;
  let mostImproved: DashboardSummary['most_improved_student'] = undefined;

  let maxSolved = -1;
  let maxImprovement = -1;

  students.forEach(s => {
    const snap = s.latest_snapshot;
    if (!snap) {
      noDataCount++;
      tierDist.Beginner++;
      return;
    }

    if (s.days_inactive! <= settings.inactivity_threshold_days) {
      activeCount++;
    } else if (s.days_inactive! >= 990) {
      noDataCount++;
    } else {
      inactiveCount++;
    }

    totalProblems += snap.total_solved;
    difficultyDist.easy += snap.easy;
    difficultyDist.medium += snap.medium;
    difficultyDist.hard += snap.hard;

    if (snap.contest_rating > 0) {
      totalRatingSum += snap.contest_rating;
      ratedCount++;
    }

    totalEngagementSum += snap.engagement_score;
    engagementCount++;

    const tier = snap.performance_tier || getPerformanceTier(snap.total_solved, settings);
    tierDist[tier] = (tierDist[tier] || 0) + 1;

    if (snap.total_solved > maxSolved) {
      maxSolved = snap.total_solved;
      highestSolver = {
        id: s.id,
        name: s.student_name,
        register_no: s.register_no,
        section: s.section,
        total_solved: snap.total_solved,
        username: s.username,
      };
    }

    const monthAdded = s.problems_added_month || 0;
    if (monthAdded > maxImprovement) {
      maxImprovement = monthAdded;
      mostImproved = {
        id: s.id,
        name: s.student_name,
        register_no: s.register_no,
        section: s.section,
        problems_added: monthAdded,
        improvement_pct: s.improvement_pct_month || 0,
      };
    }
  });

  const avgProblems = totalStudents > 0 ? Math.round((totalProblems / totalStudents) * 10) / 10 : 0;
  const avgRating = ratedCount > 0 ? Math.round(totalRatingSum / ratedCount) : 0;
  const avgEngagement = engagementCount > 0 ? Math.round(totalEngagementSum / engagementCount) : 0;

  // Generate automated faculty factual insights
  const insights: string[] = [];
  insights.push(`${activeCount} of ${totalStudents} students (${Math.round((activeCount / (totalStudents || 1)) * 100)}%) were active within the last ${settings.inactivity_threshold_days} days.`);
  
  if (inactiveCount > 0) {
    insights.push(`${inactiveCount} students have not recorded practice activity for more than ${settings.inactivity_threshold_days} days and may benefit from mentor check-ins.`);
  }

  if (mostImproved && mostImproved.problems_added > 0) {
    insights.push(`${mostImproved.name} (Sec ${mostImproved.section}) achieved the highest monthly surge with +${mostImproved.problems_added} solved (+${mostImproved.improvement_pct}% growth).`);
  }

  const advancedCount = tierDist.Advanced;
  const proficientCount = tierDist.Proficient;
  if (advancedCount + proficientCount > 0) {
    insights.push(`${advancedCount + proficientCount} students are in Advanced or Proficient tiers (100+ problems solved).`);
  }

  return {
    total_students: totalStudents,
    active_students: activeCount,
    inactive_students: inactiveCount,
    no_data_students: noDataCount,
    total_problems_solved: totalProblems,
    avg_problems_per_student: avgProblems,
    avg_contest_rating: avgRating,
    avg_engagement_score: avgEngagement,
    most_improved_student: mostImproved,
    highest_problem_solver: highestSolver,
    difficulty_distribution: difficultyDist,
    tier_distribution: tierDist,
    insights,
  };
}

export function computeSectionStats(
  students: StudentWithLatest[],
  settings: SystemSettings
): SectionStat[] {
  const sectionsMap = new Map<string, StudentWithLatest[]>();

  students.forEach(s => {
    const sec = s.section || 'Unassigned';
    if (!sectionsMap.has(sec)) {
      sectionsMap.set(sec, []);
    }
    sectionsMap.get(sec)!.push(s);
  });

  const results: SectionStat[] = [];

  sectionsMap.forEach((secStudents, secName) => {
    const total = secStudents.length;
    let active = 0;
    let inactive = 0;
    let totalProblems = 0;
    let ratingSum = 0;
    let ratedCount = 0;
    let engagementSum = 0;
    let topPerformer = '';
    let topProblems = -1;

    secStudents.forEach(s => {
      const snap = s.latest_snapshot;
      if (s.days_inactive! <= settings.inactivity_threshold_days) {
        active++;
      } else {
        inactive++;
      }

      if (snap) {
        totalProblems += snap.total_solved;
        if (snap.contest_rating > 0) {
          ratingSum += snap.contest_rating;
          ratedCount++;
        }
        engagementSum += snap.engagement_score;

        if (snap.total_solved > topProblems) {
          topProblems = snap.total_solved;
          topPerformer = s.student_name;
        }
      }
    });

    results.push({
      section: secName,
      total_students: total,
      active_students: active,
      inactive_students: inactive,
      avg_problems: total > 0 ? Math.round(totalProblems / total) : 0,
      total_problems: totalProblems,
      avg_rating: ratedCount > 0 ? Math.round(ratingSum / ratedCount) : 0,
      avg_engagement: total > 0 ? Math.round(engagementSum / total) : 0,
      top_performer: topPerformer || 'None',
      top_performer_problems: topProblems >= 0 ? topProblems : 0,
    });
  });

  return results.sort((a, b) => a.section.localeCompare(b.section));
}

export function computeBatchStats(
  students: StudentWithLatest[],
  settings: SystemSettings
): BatchStat[] {
  const map = new Map<string, StudentWithLatest[]>();

  students.forEach(s => {
    const key = `${s.year}_${s.batch || 'General'}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  });

  const results: BatchStat[] = [];
  map.forEach((bStudents, key) => {
    const [year, batch] = key.split('_');
    const total = bStudents.length;
    let active = 0;
    let totalProblems = 0;
    let engagementSum = 0;
    let ratingSum = 0;
    let ratedCount = 0;

    bStudents.forEach(s => {
      if (s.days_inactive! <= settings.inactivity_threshold_days) active++;
      if (s.latest_snapshot) {
        totalProblems += s.latest_snapshot.total_solved;
        engagementSum += s.latest_snapshot.engagement_score;
        if (s.latest_snapshot.contest_rating > 0) {
          ratingSum += s.latest_snapshot.contest_rating;
          ratedCount++;
        }
      }
    });

    results.push({
      year,
      batch,
      total_students: total,
      active_students: active,
      avg_problems: total > 0 ? Math.round(totalProblems / total) : 0,
      avg_engagement: total > 0 ? Math.round(engagementSum / total) : 0,
      avg_rating: ratedCount > 0 ? Math.round(ratingSum / ratedCount) : 0,
    });
  });

  return results.sort((a, b) => a.year.localeCompare(b.year));
}
