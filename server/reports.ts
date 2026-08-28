import * as XLSX from 'xlsx';
import { StudentWithLatest, Snapshot, SystemSettings, DashboardSummary, SectionStat } from '../src/types.js';

export function generateExcelReport(
  students: StudentWithLatest[],
  allSnapshots: Snapshot[],
  summary: DashboardSummary,
  sectionStats: SectionStat[],
  settings: SystemSettings,
  logs: { timestamp: string; level: string; message: string }[]
): Buffer {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryRows = [
    ['KGiSL Institute of Technology - Department of Computer Science & Business Systems'],
    ['CSBS LeetCode Student Progress Analytics Report'],
    ['Generated At', new Date().toLocaleString()],
    ['Academic Year', settings.academic_year],
    [''],
    ['KEY PERFORMANCE INDICATORS', 'VALUE'],
    ['Total Students Enrolled', summary.total_students],
    ['Active Students (Last ' + settings.inactivity_threshold_days + ' Days)', summary.active_students],
    ['Inactive Students', summary.inactive_students],
    ['Total Problems Solved (All Students)', summary.total_problems_solved],
    ['Average Problems per Student', summary.avg_problems_per_student],
    ['Average Contest Rating', summary.avg_contest_rating || 'N/A'],
    ['Average Department Engagement Score', summary.avg_engagement_score + '/100'],
    ['Highest Problem Solver', summary.highest_problem_solver ? `${summary.highest_problem_solver.name} (${summary.highest_problem_solver.total_solved} solved)` : 'N/A'],
    ['Most Improved Student (30 Days)', summary.most_improved_student ? `${summary.most_improved_student.name} (+${summary.most_improved_student.problems_added} solved)` : 'N/A'],
    [''],
    ['DIFFICULTY DISTRIBUTION', 'COUNT'],
    ['Easy Problems', summary.difficulty_distribution.easy],
    ['Medium Problems', summary.difficulty_distribution.medium],
    ['Hard Problems', summary.difficulty_distribution.hard],
    [''],
    ['PERFORMANCE TIER DISTRIBUTION', 'COUNT'],
    ['Beginner (0-' + settings.tier_beginner_max + ')', summary.tier_distribution.Beginner],
    ['Developing (' + (settings.tier_beginner_max + 1) + '-' + settings.tier_developing_max + ')', summary.tier_distribution.Developing],
    ['Proficient (' + (settings.tier_developing_max + 1) + '-' + settings.tier_proficient_max + ')', summary.tier_distribution.Proficient],
    ['Advanced (' + (settings.tier_proficient_max + 1) + '+)', summary.tier_distribution.Advanced],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // 2. Current Performance Sheet
  const perfRows = [
    [
      'Register No', 'Student Name', 'Section', 'Year', 'Batch', 'LeetCode Username',
      'Total Solved', 'Easy', 'Medium', 'Hard', 'Acceptance Rate %', 'Contest Rating',
      'Streak', 'Active Days', 'Last Active Date', 'Days Inactive', 'Engagement Score',
      'Performance Tier', 'Activity Status', 'Monthly Improvement (+)'
    ],
    ...students.map(s => {
      const snap = s.latest_snapshot;
      return [
        s.register_no,
        s.student_name,
        s.section,
        s.year,
        s.batch,
        s.username,
        snap?.total_solved ?? 0,
        snap?.easy ?? 0,
        snap?.medium ?? 0,
        snap?.hard ?? 0,
        snap?.acceptance_rate ? `${snap.acceptance_rate}%` : 'N/A',
        snap?.contest_rating || 'N/A',
        snap?.streak ?? 0,
        snap?.active_days ?? 0,
        snap?.last_active || 'N/A',
        s.days_inactive! >= 990 ? 'N/A' : s.days_inactive,
        snap?.engagement_score ?? 0,
        snap?.performance_tier ?? 'Beginner',
        snap?.activity_status ?? 'No Data',
        s.problems_added_month ?? 0,
      ];
    })
  ];
  const wsPerf = XLSX.utils.aoa_to_sheet(perfRows);
  XLSX.utils.book_append_sheet(wb, wsPerf, 'Current Performance');

  // 3. Student Details Sheet
  const detailsRows = [
    ['Register No', 'Student Name', 'Section', 'Year', 'Batch', 'LeetCode Username', 'College Email', 'Faculty Mentor', 'Academic Year', 'Active Status', 'Faculty Notes'],
    ...students.map(s => [
      s.register_no,
      s.student_name,
      s.section,
      s.year,
      s.batch,
      s.username,
      s.email || 'N/A',
      s.mentor || 'Unassigned',
      s.academic_year || settings.academic_year,
      s.active ? 'Active' : 'Inactive',
      s.notes || '',
    ])
  ];
  const wsDetails = XLSX.utils.aoa_to_sheet(detailsRows);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Student Details');

  // 4. Historical Snapshots Sheet
  const histRows = [
    ['Student ID', 'Register No', 'Student Name', 'Section', 'Snapshot Date', 'Total Solved', 'Easy', 'Medium', 'Hard', 'Contest Rating', 'Streak', 'Engagement Score', 'Fetch Status'],
    ...allSnapshots.map(snap => {
      const student = students.find(s => s.id === snap.student_id);
      return [
        snap.student_id,
        student?.register_no || 'N/A',
        student?.student_name || 'N/A',
        student?.section || 'N/A',
        snap.captured_at.split('T')[0],
        snap.total_solved,
        snap.easy,
        snap.medium,
        snap.hard,
        snap.contest_rating || 'N/A',
        snap.streak,
        snap.engagement_score,
        snap.status,
      ];
    })
  ];
  const wsHist = XLSX.utils.aoa_to_sheet(histRows);
  XLSX.utils.book_append_sheet(wb, wsHist, 'Historical Data');

  // 5. Leaderboard Sheet
  const sortedLeaderboard = [...students].sort((a, b) => 
    (b.latest_snapshot?.engagement_score || 0) - (a.latest_snapshot?.engagement_score || 0)
  );
  const leadRows = [
    ['Rank', 'Register No', 'Student Name', 'Section', 'Year', 'LeetCode Username', 'Engagement Score', 'Total Solved', 'Medium Solved', 'Hard Solved', 'Contest Rating', 'Streak'],
    ...sortedLeaderboard.map((s, idx) => {
      const snap = s.latest_snapshot;
      return [
        idx + 1,
        s.register_no,
        s.student_name,
        s.section,
        s.year,
        s.username,
        snap?.engagement_score ?? 0,
        snap?.total_solved ?? 0,
        snap?.medium ?? 0,
        snap?.hard ?? 0,
        snap?.contest_rating || 'N/A',
        snap?.streak ?? 0,
      ];
    })
  ];
  const wsLead = XLSX.utils.aoa_to_sheet(leadRows);
  XLSX.utils.book_append_sheet(wb, wsLead, 'Leaderboard');

  // 6. Section Comparison Sheet
  const secRows = [
    ['Section', 'Total Students', 'Active Students', 'Inactive Students', 'Total Problems Solved', 'Avg Problems / Student', 'Avg Contest Rating', 'Avg Engagement Score', 'Top Performer', 'Top Performer Solved'],
    ...sectionStats.map(s => [
      s.section,
      s.total_students,
      s.active_students,
      s.inactive_students,
      s.total_problems,
      s.avg_problems,
      s.avg_rating || 'N/A',
      s.avg_engagement,
      s.top_performer,
      s.top_performer_problems,
    ])
  ];
  const wsSec = XLSX.utils.aoa_to_sheet(secRows);
  XLSX.utils.book_append_sheet(wb, wsSec, 'Section Comparison');

  // 7. Inactive Students Sheet (Intervention)
  const inactiveStudents = students
    .filter(s => (s.days_inactive ?? 999) > settings.inactivity_threshold_days)
    .sort((a, b) => (b.days_inactive || 0) - (a.days_inactive || 0));

  const inactiveRows = [
    ['Register No', 'Student Name', 'Section', 'Year', 'LeetCode Username', 'Faculty Mentor', 'Last Active Date', 'Days Inactive', 'Problems Solved', 'Intervention Risk Level'],
    ...inactiveStudents.map(s => [
      s.register_no,
      s.student_name,
      s.section,
      s.year,
      s.username,
      s.mentor || 'Unassigned',
      s.latest_snapshot?.last_active || 'No Record',
      s.days_inactive! >= 990 ? 'Never Active / No Data' : s.days_inactive,
      s.latest_snapshot?.total_solved ?? 0,
      s.risk_level || 'Moderate',
    ])
  ];
  const wsInactive = XLSX.utils.aoa_to_sheet(inactiveRows);
  XLSX.utils.book_append_sheet(wb, wsInactive, 'Inactive Students');

  // 8. Most Improved Sheet
  const mostImpList = [...students]
    .filter(s => (s.problems_added_month || 0) > 0)
    .sort((a, b) => (b.problems_added_month || 0) - (a.problems_added_month || 0));

  const impRows = [
    ['Rank', 'Register No', 'Student Name', 'Section', 'Problems Added (Week)', 'Problems Added (Month)', 'Growth Rate % (Month)', 'Current Total Solved', 'Engagement Score'],
    ...mostImpList.map((s, idx) => [
      idx + 1,
      s.register_no,
      s.student_name,
      s.section,
      s.problems_added_week ?? 0,
      s.problems_added_month ?? 0,
      `${s.improvement_pct_month ?? 0}%`,
      s.latest_snapshot?.total_solved ?? 0,
      s.latest_snapshot?.engagement_score ?? 0,
    ])
  ];
  const wsImp = XLSX.utils.aoa_to_sheet(impRows);
  XLSX.utils.book_append_sheet(wb, wsImp, 'Most Improved');

  // 9. Errors & Logs Sheet
  const errRows = [
    ['Timestamp', 'Level', 'Log Message'],
    ...logs.map(l => [l.timestamp, l.level, l.message])
  ];
  const wsErr = XLSX.utils.aoa_to_sheet(errRows);
  XLSX.utils.book_append_sheet(wb, wsErr, 'Errors and Logs');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function generateStudentTemplateExcel(): Buffer {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    ['Register Number', 'Student Name', 'Section', 'Year', 'Batch', 'LeetCode Username', 'Email', 'Mentor', 'Academic Year'],
    ['711722CSBS001', 'Aarav Sharma', 'A', 'III', '2022-2026', 'aarav_csbs', 'aarav.sharma@kgisl.ac.in', 'Dr. S. Ramesh', '2024-2025'],
    ['711722CSBS002', 'Bhavna Sundaram', 'A', 'III', '2022-2026', 'bhavna_code', 'bhavna.s@kgisl.ac.in', 'Dr. S. Ramesh', '2024-2025'],
    ['711722CSBS003', 'Chirag Patel', 'B', 'III', '2022-2026', 'chirag_p', 'chirag.p@kgisl.ac.in', 'Prof. M. Priya', '2024-2025'],
    ['711723CSBS012', 'Lavanya Chandran', 'A', 'II', '2023-2027', 'lavanya_c', 'lavanya.c@kgisl.ac.in', 'Prof. N. Suresh', '2024-2025'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function generateStudentTemplateCSV(): string {
  return [
    'Register Number,Student Name,Section,Year,Batch,LeetCode Username,Email,Mentor,Academic Year',
    '711722CSBS001,Aarav Sharma,A,III,2022-2026,aarav_csbs,aarav.sharma@kgisl.ac.in,Dr. S. Ramesh,2024-2025',
    '711722CSBS002,Bhavna Sundaram,A,III,2022-2026,bhavna_code,bhavna.s@kgisl.ac.in,Dr. S. Ramesh,2024-2025',
    '711722CSBS003,Chirag Patel,B,III,2022-2026,chirag_p,chirag.p@kgisl.ac.in,Prof. M. Priya,2024-2025',
    '711723CSBS012,Lavanya Chandran,A,II,2023-2027,lavanya_c,lavanya.c@kgisl.ac.in,Prof. N. Suresh,2024-2025'
  ].join('\n');
}

export function generateStudentsCSV(students: StudentWithLatest[]): string {
  const headers = [
    'Register No', 'Student Name', 'Section', 'Year', 'Batch', 'LeetCode Username',
    'Total Solved', 'Easy', 'Medium', 'Hard', 'Acceptance Rate', 'Contest Rating',
    'Streak', 'Active Days', 'Last Active', 'Days Inactive', 'Engagement Score',
    'Performance Tier', 'Activity Status'
  ];

  const rows = students.map(s => {
    const snap = s.latest_snapshot;
    return [
      `"${s.register_no}"`,
      `"${s.student_name}"`,
      `"${s.section}"`,
      `"${s.year}"`,
      `"${s.batch}"`,
      `"${s.username}"`,
      snap?.total_solved ?? 0,
      snap?.easy ?? 0,
      snap?.medium ?? 0,
      snap?.hard ?? 0,
      `"${snap?.acceptance_rate ?? 0}%"`,
      snap?.contest_rating ?? 0,
      snap?.streak ?? 0,
      snap?.active_days ?? 0,
      `"${snap?.last_active || 'N/A'}"`,
      s.days_inactive! >= 990 ? 'N/A' : s.days_inactive,
      snap?.engagement_score ?? 0,
      `"${snap?.performance_tier ?? 'Beginner'}"`,
      `"${snap?.activity_status ?? 'No Data'}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
