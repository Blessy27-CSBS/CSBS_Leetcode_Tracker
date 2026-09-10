import { QuestNode, StudentQuestProgress, QuestNodeStatus, FacultyQuestSummary, isEligibleForQuest } from '../src/types.js';

export const LEETCODE_DSA_QUEST_NODES: QuestNode[] = [
  {
    id: 'array-1',
    title: 'Array I',
    region: 'Linear Shoal',
    levelNumber: 1,
    requiredSolvedCount: 3,
    topics: ['Array'],
    description: 'Master basic array indexing, iteration, and linear search techniques.',
    sampleProblems: [
      { title: 'Two Sum', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/two-sum/', titleSlug: 'two-sum' },
      { title: 'Contains Duplicate', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/contains-duplicate/', titleSlug: 'contains-duplicate' },
      { title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', titleSlug: 'best-time-to-buy-and-sell-stock' }
    ]
  },
  {
    id: 'array-2',
    title: 'Array II',
    region: 'Linear Shoal',
    levelNumber: 2,
    requiredSolvedCount: 6,
    topics: ['Array', 'Two Pointers', 'Prefix Sum'],
    description: 'Advanced array manipulation using two-pointer patterns and prefix sum arrays.',
    sampleProblems: [
      { title: '3Sum', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/3sum/', titleSlug: '3sum' },
      { title: 'Move Zeroes', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/move-zeroes/', titleSlug: 'move-zeroes' },
      { title: 'Subarray Sum Equals K', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/subarray-sum-equals-k/', titleSlug: 'subarray-sum-equals-k' }
    ]
  },
  {
    id: 'stack-1',
    title: 'Stack',
    region: 'Linear Shoal',
    levelNumber: 3,
    requiredSolvedCount: 4,
    topics: ['Stack'],
    description: 'LIFO data structures, expression parsing, and nested structure validation.',
    sampleProblems: [
      { title: 'Valid Parentheses', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/', titleSlug: 'valid-parentheses' },
      { title: 'Min Stack', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/min-stack/', titleSlug: 'min-stack' },
      { title: 'Evaluate Reverse Polish Notation', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', titleSlug: 'evaluate-reverse-polish-notation' }
    ]
  },
  {
    id: 'monotonic-stack-1',
    title: 'Monotonic Stack',
    region: 'Linear Shoal',
    levelNumber: 4,
    requiredSolvedCount: 4,
    topics: ['Monotonic Stack', 'Stack'],
    description: 'Maintain ordered elements to solve next greater/smaller element queries in O(N).',
    sampleProblems: [
      { title: 'Daily Temperatures', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/daily-temperatures/', titleSlug: 'daily-temperatures' },
      { title: 'Next Greater Element I', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/next-greater-element-i/', titleSlug: 'next-greater-element-i' },
      { title: 'Online Stock Span', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/online-stock-span/', titleSlug: 'online-stock-span' }
    ]
  },
  {
    id: 'monotonic-stack-2',
    title: 'Monotonic Stack II',
    region: 'Linear Shoal',
    levelNumber: 5,
    requiredSolvedCount: 3,
    topics: ['Monotonic Stack', 'Array'],
    description: 'Challenging monotonic stack applications including histogram bounds and water trapping.',
    sampleProblems: [
      { title: 'Largest Rectangle in Histogram', difficulty: 'Hard', leetcodeUrl: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', titleSlug: 'largest-rectangle-in-histogram' },
      { title: 'Trapping Rain Water', difficulty: 'Hard', leetcodeUrl: 'https://leetcode.com/problems/trapping-rain-water/', titleSlug: 'trapping-rain-water' },
      { title: 'Car Fleet', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/car-fleet/', titleSlug: 'car-fleet' }
    ]
  },
  {
    id: 'two-pointers-1',
    title: 'Two Pointers & Sliding Window',
    region: 'Sequence Valley',
    levelNumber: 6,
    requiredSolvedCount: 5,
    topics: ['Two Pointers', 'Sliding Window'],
    description: 'Dynamic range windows and pointer convergence for sequence processing.',
    sampleProblems: [
      { title: 'Container With Most Water', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/container-with-most-water/', titleSlug: 'container-with-most-water' },
      { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', titleSlug: 'longest-substring-without-repeating-characters' },
      { title: 'Minimum Window Substring', difficulty: 'Hard', leetcodeUrl: 'https://leetcode.com/problems/minimum-window-substring/', titleSlug: 'minimum-window-substring' }
    ]
  },
  {
    id: 'binary-search-1',
    title: 'Binary Search',
    region: 'Sequence Valley',
    levelNumber: 7,
    requiredSolvedCount: 5,
    topics: ['Binary Search'],
    description: 'Logarithmic search spaces, rotated arrays, and binary search on answer ranges.',
    sampleProblems: [
      { title: 'Binary Search', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/binary-search/', titleSlug: 'binary-search' },
      { title: 'Search in Rotated Sorted Array', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', titleSlug: 'search-in-rotated-sorted-array' },
      { title: 'Koko Eating Bananas', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/koko-eating-bananas/', titleSlug: 'koko-eating-bananas' }
    ]
  },
  {
    id: 'linked-list-1',
    title: 'Linked List',
    region: 'Sequence Valley',
    levelNumber: 8,
    requiredSolvedCount: 5,
    topics: ['Linked List'],
    description: 'Pointer manipulation, node insertion/deletion, cycle detection, and merging.',
    sampleProblems: [
      { title: 'Reverse Linked List', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/', titleSlug: 'reverse-linked-list' },
      { title: 'Merge Two Sorted Lists', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/', titleSlug: 'merge-two-sorted-lists' },
      { title: 'Linked List Cycle', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/linked-list-cycle/', titleSlug: 'linked-list-cycle' }
    ]
  },
  {
    id: 'tree-1',
    title: 'Binary Tree',
    region: 'Tree Peak',
    levelNumber: 9,
    requiredSolvedCount: 6,
    topics: ['Tree', 'Depth-First Search', 'Breadth-First Search'],
    description: 'Tree traversals, binary search tree properties, and recursive tree decomposition.',
    sampleProblems: [
      { title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', titleSlug: 'maximum-depth-of-binary-tree' },
      { title: 'Invert Binary Tree', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/invert-binary-tree/', titleSlug: 'invert-binary-tree' },
      { title: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', titleSlug: 'lowest-common-ancestor-of-a-binary-tree' }
    ]
  },
  {
    id: 'heap-1',
    title: 'Heap / Priority Queue',
    region: 'Tree Peak',
    levelNumber: 10,
    requiredSolvedCount: 4,
    topics: ['Heap (Priority Queue)', 'Heap'],
    description: 'Top-K elements, stream medians, and heap-based prioritization.',
    sampleProblems: [
      { title: 'Kth Largest Element in an Array', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', titleSlug: 'kth-largest-element-in-an-array' },
      { title: 'Top K Frequent Elements', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/top-k-frequent-elements/', titleSlug: 'top-k-frequent-elements' }
    ]
  },
  {
    id: 'graph-1',
    title: 'Graph Traversal',
    region: 'Graph Summit',
    levelNumber: 11,
    requiredSolvedCount: 5,
    topics: ['Graph', 'Breadth-First Search', 'Depth-First Search'],
    description: 'Connected components, topological sorting, and shortest path algorithms.',
    sampleProblems: [
      { title: 'Number of Islands', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/', titleSlug: 'number-of-islands' },
      { title: 'Course Schedule', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/course-schedule/', titleSlug: 'course-schedule' },
      { title: 'Clone Graph', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/clone-graph/', titleSlug: 'clone-graph' }
    ]
  },
  {
    id: 'dp-1',
    title: 'Dynamic Programming',
    region: 'Graph Summit',
    levelNumber: 12,
    requiredSolvedCount: 6,
    topics: ['Dynamic Programming'],
    description: 'Optimal substructure, memoization, tabular state transitions, and knapsack variants.',
    sampleProblems: [
      { title: 'Climbing Stairs', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/', titleSlug: 'climbing-stairs' },
      { title: 'House Robber', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/house-robber/', titleSlug: 'house-robber' },
      { title: 'Coin Change', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/coin-change/', titleSlug: 'coin-change' }
    ]
  }
];

export function computeStudentQuestProgress(student: any, snapshot?: any): StudentQuestProgress {
  const skills: { tagName: string; problemsSolved: number }[] = snapshot?.skills || [];
  const totalSolved = snapshot?.total_solved || 0;

  let currentLevelNumber = 1;
  let currentStageName = 'Array I';
  const completedNodeIds: string[] = [];
  const unlockedNodeIds: string[] = [];

  // Map skill counts
  const skillMap = new Map<string, number>();
  for (const s of skills) {
    skillMap.set(s.tagName.toLowerCase(), s.problemsSolved);
  }

  // Calculate solved counts for each node topic
  const evaluatedNodes = LEETCODE_DSA_QUEST_NODES.map((node, index) => {
    let topicSolved = 0;

    // Check skills matching node topics
    for (const t of node.topics) {
      const count = skillMap.get(t.toLowerCase()) || 0;
      if (count > topicSolved) topicSolved = count;
    }

    // Heuristic: map total solved to ensure progress scales realistically if specific tag API data is empty
    if (topicSolved === 0 && totalSolved > 0) {
      const estimatedFraction = Math.max(0, Math.floor((totalSolved - index * 5) / 3));
      topicSolved = Math.min(node.requiredSolvedCount + 2, estimatedFraction);
    }

    const previousNodeCompleted = index === 0 || completedNodeIds.includes(LEETCODE_DSA_QUEST_NODES[index - 1].id);
    const isCompleted = previousNodeCompleted && topicSolved >= node.requiredSolvedCount;
    const isUnlocked = previousNodeCompleted;

    if (isCompleted) {
      completedNodeIds.push(node.id);
    }

    if (isUnlocked) {
      unlockedNodeIds.push(node.id);
      if (!isCompleted) {
        currentLevelNumber = node.levelNumber;
        currentStageName = node.title;
      }
    }

    let status: QuestNodeStatus = 'LOCKED';
    if (isCompleted) status = 'COMPLETED';
    else if (isUnlocked) status = 'IN_PROGRESS';

    return {
      ...node,
      status,
      userSolvedCount: topicSolved
    };
  });

  // If all nodes cleared
  if (completedNodeIds.length === LEETCODE_DSA_QUEST_NODES.length) {
    currentLevelNumber = LEETCODE_DSA_QUEST_NODES.length;
    currentStageName = 'Dynamic Programming (Completed)';
  } else if (completedNodeIds.length > 0 && currentLevelNumber === 1 && completedNodeIds.includes('array-1')) {
    const nextIdx = completedNodeIds.length;
    if (nextIdx < LEETCODE_DSA_QUEST_NODES.length) {
      currentLevelNumber = LEETCODE_DSA_QUEST_NODES[nextIdx].levelNumber;
      currentStageName = LEETCODE_DSA_QUEST_NODES[nextIdx].title;
    }
  }

  const completionPct = Math.round((completedNodeIds.length / LEETCODE_DSA_QUEST_NODES.length) * 100);

  return {
    studentId: student.id,
    registerNo: student.register_no || '',
    studentName: student.student_name || 'Student',
    year: student.year || '',
    section: student.section || 'A',
    username: student.username || '',
    currentLevelNumber,
    currentStageName,
    completedNodeIds,
    unlockedNodeIds,
    totalSolvedInQuest: totalSolved,
    totalQuestNodes: LEETCODE_DSA_QUEST_NODES.length,
    completedNodesCount: completedNodeIds.length,
    completionPercentage: completionPct,
    lastActive: snapshot?.last_active || snapshot?.captured_at,
    nodes: evaluatedNodes
  };
}

export function computeFacultyQuestSummary(studentsWithLatest: any[]): FacultyQuestSummary {
  // Filter II & III year students
  const eligibleStudents = studentsWithLatest.filter(s => isEligibleForQuest(s.year));

  const progressList = eligibleStudents.map(s => computeStudentQuestProgress(s, s.latest_snapshot));

  const activeParticipantsCount = progressList.filter(p => p.completedNodesCount > 0 || p.totalSolvedInQuest > 0).length;

  const totalPct = progressList.reduce((acc, p) => acc + p.completionPercentage, 0);
  const avgCompletionPercentage = eligibleStudents.length > 0 ? Math.round(totalPct / eligibleStudents.length) : 0;

  let maxLevel = 1;
  let highestStageReached = 'Array I';
  const stageDistribution: Record<string, number> = {};

  for (const node of LEETCODE_DSA_QUEST_NODES) {
    stageDistribution[node.title] = 0;
  }

  for (const p of progressList) {
    if (p.currentLevelNumber > maxLevel) {
      maxLevel = p.currentLevelNumber;
      highestStageReached = p.currentStageName;
    }
    if (p.currentStageName) {
      stageDistribution[p.currentStageName] = (stageDistribution[p.currentStageName] || 0) + 1;
    }
  }

  return {
    eligibleStudentsCount: eligibleStudents.length,
    activeParticipantsCount,
    avgCompletionPercentage,
    highestStageReached,
    stageDistribution,
    studentsProgress: progressList
  };
}
