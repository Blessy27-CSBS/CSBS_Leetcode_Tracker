import { CuratedTrack, CuratedProblem, POTDItem } from '../src/types.js';

export const SEED_TRACKS: CuratedTrack[] = [
  {
    id: 'blind75',
    title: 'Blind 75 Essential DSA',
    description: 'The definitive curated list of 75 high-impact questions covering all essential algorithmic patterns.',
    category: 'blind75',
    icon: 'Flame',
    totalProblems: 28,
  },
  {
    id: 'top150',
    title: 'LeetCode Top Interview 150',
    description: 'Classic interview questions asked by top tech giants (FAANG, Tier-1 Product Companies).',
    category: 'top150',
    icon: 'Trophy',
    totalProblems: 20,
  },
  {
    id: 'csbs_core',
    title: 'CSBS Department Placement Core',
    description: 'Targeted foundation & intermediate mastery problems specifically designed for CSBS semester cohorts.',
    category: 'csbs_core',
    icon: 'BookOpen',
    totalProblems: 15,
  }
];

export const SEED_PROBLEMS: CuratedProblem[] = [
  // --- Blind 75: Arrays & Hashing ---
  { id: 'b75-1', trackId: 'blind75', title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', topic: 'Arrays & Hashing', orderIndex: 1, leetcodeUrl: 'https://leetcode.com/problems/two-sum/' },
  { id: 'b75-2', trackId: 'blind75', title: 'Contains Duplicate', titleSlug: 'contains-duplicate', difficulty: 'Easy', topic: 'Arrays & Hashing', orderIndex: 2, leetcodeUrl: 'https://leetcode.com/problems/contains-duplicate/' },
  { id: 'b75-3', trackId: 'blind75', title: 'Valid Anagram', titleSlug: 'valid-anagram', difficulty: 'Easy', topic: 'Arrays & Hashing', orderIndex: 3, leetcodeUrl: 'https://leetcode.com/problems/valid-anagram/' },
  { id: 'b75-4', trackId: 'blind75', title: 'Group Anagrams', titleSlug: 'group-anagrams', difficulty: 'Medium', topic: 'Arrays & Hashing', orderIndex: 4, leetcodeUrl: 'https://leetcode.com/problems/group-anagrams/' },
  { id: 'b75-5', trackId: 'blind75', title: 'Top K Frequent Elements', titleSlug: 'top-k-frequent-elements', difficulty: 'Medium', topic: 'Arrays & Hashing', orderIndex: 5, leetcodeUrl: 'https://leetcode.com/problems/top-k-frequent-elements/' },
  { id: 'b75-6', trackId: 'blind75', title: 'Product of Array Except Self', titleSlug: 'product-of-array-except-self', difficulty: 'Medium', topic: 'Arrays & Hashing', orderIndex: 6, leetcodeUrl: 'https://leetcode.com/problems/product-of-array-except-self/' },
  { id: 'b75-7', trackId: 'blind75', title: 'Longest Consecutive Sequence', titleSlug: 'longest-consecutive-sequence', difficulty: 'Medium', topic: 'Arrays & Hashing', orderIndex: 7, leetcodeUrl: 'https://leetcode.com/problems/longest-consecutive-sequence/' },

  // --- Blind 75: Two Pointers ---
  { id: 'b75-8', trackId: 'blind75', title: 'Valid Palindrome', titleSlug: 'valid-palindrome', difficulty: 'Easy', topic: 'Two Pointers', orderIndex: 8, leetcodeUrl: 'https://leetcode.com/problems/valid-palindrome/' },
  { id: 'b75-9', trackId: 'blind75', title: '3Sum', titleSlug: '3sum', difficulty: 'Medium', topic: 'Two Pointers', orderIndex: 9, leetcodeUrl: 'https://leetcode.com/problems/3sum/' },
  { id: 'b75-10', trackId: 'blind75', title: 'Container With Most Water', titleSlug: 'container-with-most-water', difficulty: 'Medium', topic: 'Two Pointers', orderIndex: 10, leetcodeUrl: 'https://leetcode.com/problems/container-with-most-water/' },

  // --- Blind 75: Sliding Window ---
  { id: 'b75-11', trackId: 'blind75', title: 'Best Time to Buy and Sell Stock', titleSlug: 'best-time-to-buy-and-sell-stock', difficulty: 'Easy', topic: 'Sliding Window', orderIndex: 11, leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
  { id: 'b75-12', trackId: 'blind75', title: 'Longest Substring Without Repeating Characters', titleSlug: 'longest-substring-without-repeating-characters', difficulty: 'Medium', topic: 'Sliding Window', orderIndex: 12, leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
  { id: 'b75-13', trackId: 'blind75', title: 'Longest Repeating Character Replacement', titleSlug: 'longest-repeating-character-replacement', difficulty: 'Medium', topic: 'Sliding Window', orderIndex: 13, leetcodeUrl: 'https://leetcode.com/problems/longest-repeating-character-replacement/' },

  // --- Blind 75: Stack & Binary Search ---
  { id: 'b75-14', trackId: 'blind75', title: 'Valid Parentheses', titleSlug: 'valid-parentheses', difficulty: 'Easy', topic: 'Stack', orderIndex: 14, leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/' },
  { id: 'b75-15', trackId: 'blind75', title: 'Find Minimum in Rotated Sorted Array', titleSlug: 'find-minimum-in-rotated-sorted-array', difficulty: 'Medium', topic: 'Binary Search', orderIndex: 15, leetcodeUrl: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/' },
  { id: 'b75-16', trackId: 'blind75', title: 'Search in Rotated Sorted Array', titleSlug: 'search-in-rotated-sorted-array', difficulty: 'Medium', topic: 'Binary Search', orderIndex: 16, leetcodeUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },

  // --- Blind 75: Linked List ---
  { id: 'b75-17', trackId: 'blind75', title: 'Reverse Linked List', titleSlug: 'reverse-linked-list', difficulty: 'Easy', topic: 'Linked List', orderIndex: 17, leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/' },
  { id: 'b75-18', trackId: 'blind75', title: 'Merge Two Sorted Lists', titleSlug: 'merge-two-sorted-lists', difficulty: 'Easy', topic: 'Linked List', orderIndex: 18, leetcodeUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
  { id: 'b75-19', trackId: 'blind75', title: 'Linked List Cycle', titleSlug: 'linked-list-cycle', difficulty: 'Easy', topic: 'Linked List', orderIndex: 19, leetcodeUrl: 'https://leetcode.com/problems/linked-list-cycle/' },
  { id: 'b75-20', trackId: 'blind75', title: 'Remove Nth Node From End of List', titleSlug: 'remove-nth-node-from-end-of-list', difficulty: 'Medium', topic: 'Linked List', orderIndex: 20, leetcodeUrl: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/' },

  // --- Blind 75: Trees ---
  { id: 'b75-21', trackId: 'blind75', title: 'Invert Binary Tree', titleSlug: 'invert-binary-tree', difficulty: 'Easy', topic: 'Trees', orderIndex: 21, leetcodeUrl: 'https://leetcode.com/problems/invert-binary-tree/' },
  { id: 'b75-22', trackId: 'blind75', title: 'Maximum Depth of Binary Tree', titleSlug: 'maximum-depth-of-binary-tree', difficulty: 'Easy', topic: 'Trees', orderIndex: 22, leetcodeUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
  { id: 'b75-23', trackId: 'blind75', title: 'Same Tree', titleSlug: 'same-tree', difficulty: 'Easy', topic: 'Trees', orderIndex: 23, leetcodeUrl: 'https://leetcode.com/problems/same-tree/' },
  { id: 'b75-24', trackId: 'blind75', title: 'Binary Tree Level Order Traversal', titleSlug: 'binary-tree-level-order-traversal', difficulty: 'Medium', topic: 'Trees', orderIndex: 24, leetcodeUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
  { id: 'b75-25', trackId: 'blind75', title: 'Validate Binary Search Tree', titleSlug: 'validate-binary-search-tree', difficulty: 'Medium', topic: 'Trees', orderIndex: 25, leetcodeUrl: 'https://leetcode.com/problems/validate-binary-search-tree/' },

  // --- Blind 75: Graphs & DP ---
  { id: 'b75-26', trackId: 'blind75', title: 'Number of Islands', titleSlug: 'number-of-islands', difficulty: 'Medium', topic: 'Graphs', orderIndex: 26, leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/' },
  { id: 'b75-27', trackId: 'blind75', title: 'Climbing Stairs', titleSlug: 'climbing-stairs', difficulty: 'Easy', topic: 'Dynamic Programming', orderIndex: 27, leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/' },
  { id: 'b75-28', trackId: 'blind75', title: 'Coin Change', titleSlug: 'coin-change', difficulty: 'Medium', topic: 'Dynamic Programming', orderIndex: 28, leetcodeUrl: 'https://leetcode.com/problems/coin-change/' },

  // --- Top 150 ---
  { id: 't150-1', trackId: 'top150', title: 'Majority Element', titleSlug: 'majority-element', difficulty: 'Easy', topic: 'Array / String', orderIndex: 1, leetcodeUrl: 'https://leetcode.com/problems/majority-element/' },
  { id: 't150-2', trackId: 'top150', title: 'Rotate Array', titleSlug: 'rotate-array', difficulty: 'Medium', topic: 'Array / String', orderIndex: 2, leetcodeUrl: 'https://leetcode.com/problems/rotate-array/' },
  { id: 't150-3', trackId: 'top150', title: 'Best Time to Buy and Sell Stock II', titleSlug: 'best-time-to-buy-and-sell-stock-ii', difficulty: 'Medium', topic: 'Array / String', orderIndex: 3, leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/' },
  { id: 't150-4', trackId: 'top150', title: 'Jump Game II', titleSlug: 'jump-game-ii', difficulty: 'Medium', topic: 'Array / String', orderIndex: 4, leetcodeUrl: 'https://leetcode.com/problems/jump-game-ii/' },
  { id: 't150-5', trackId: 'top150', title: 'Roman to Integer', titleSlug: 'roman-to-integer', difficulty: 'Easy', topic: 'Math', orderIndex: 5, leetcodeUrl: 'https://leetcode.com/problems/roman-to-integer/' },
  { id: 't150-6', trackId: 'top150', title: 'Is Subsequence', titleSlug: 'is-subsequence', difficulty: 'Easy', topic: 'Two Pointers', orderIndex: 6, leetcodeUrl: 'https://leetcode.com/problems/is-subsequence/' },
  { id: 't150-7', trackId: 'top150', title: 'Two Sum II - Input Array Is Sorted', titleSlug: 'two-sum-ii-input-array-is-sorted', difficulty: 'Medium', topic: 'Two Pointers', orderIndex: 7, leetcodeUrl: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/' },
  { id: 't150-8', trackId: 'top150', title: 'Ransom Note', titleSlug: 'ransom-note', difficulty: 'Easy', topic: 'Hashmap', orderIndex: 8, leetcodeUrl: 'https://leetcode.com/problems/ransom-note/' },
  { id: 't150-9', trackId: 'top150', title: 'Word Pattern', titleSlug: 'word-pattern', difficulty: 'Easy', topic: 'Hashmap', orderIndex: 9, leetcodeUrl: 'https://leetcode.com/problems/word-pattern/' },
  { id: 't150-10', trackId: 'top150', title: 'Summary Ranges', titleSlug: 'summary-ranges', difficulty: 'Easy', topic: 'Intervals', orderIndex: 10, leetcodeUrl: 'https://leetcode.com/problems/summary-ranges/' },

  // --- CSBS Department Placement Core Track ---
  { id: 'csbs-1', trackId: 'csbs_core', title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', topic: 'Arrays', orderIndex: 1, leetcodeUrl: 'https://leetcode.com/problems/two-sum/' },
  { id: 'csbs-2', trackId: 'csbs_core', title: 'Majority Element', titleSlug: 'majority-element', difficulty: 'Easy', topic: 'Arrays', orderIndex: 2, leetcodeUrl: 'https://leetcode.com/problems/majority-element/' },
  { id: 'csbs-3', trackId: 'csbs_core', title: 'Move Zeroes', titleSlug: 'move-zeroes', difficulty: 'Easy', topic: 'Arrays', orderIndex: 3, leetcodeUrl: 'https://leetcode.com/problems/move-zeroes/' },
  { id: 'csbs-4', trackId: 'csbs_core', title: 'Valid Parentheses', titleSlug: 'valid-parentheses', difficulty: 'Easy', topic: 'Stack', orderIndex: 4, leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/' },
  { id: 'csbs-5', trackId: 'csbs_core', title: 'Implement Queue using Stacks', titleSlug: 'implement-queue-using-stacks', difficulty: 'Easy', topic: 'Stack', orderIndex: 5, leetcodeUrl: 'https://leetcode.com/problems/implement-queue-using-stacks/' },
  { id: 'csbs-6', trackId: 'csbs_core', title: 'Reverse Linked List', titleSlug: 'reverse-linked-list', difficulty: 'Easy', topic: 'Linked List', orderIndex: 6, leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/' },
  { id: 'csbs-7', trackId: 'csbs_core', title: 'Middle of the Linked List', titleSlug: 'middle-of-the-linked-list', difficulty: 'Easy', topic: 'Linked List', orderIndex: 7, leetcodeUrl: 'https://leetcode.com/problems/middle-of-the-linked-list/' },
  { id: 'csbs-8', trackId: 'csbs_core', title: 'Maximum Subarray (Kadane)', titleSlug: 'maximum-subarray', difficulty: 'Medium', topic: 'Arrays', orderIndex: 8, leetcodeUrl: 'https://leetcode.com/problems/maximum-subarray/' },
  { id: 'csbs-9', trackId: 'csbs_core', title: 'Sort Colors (Dutch National Flag)', titleSlug: 'sort-colors', difficulty: 'Medium', topic: 'Two Pointers', orderIndex: 9, leetcodeUrl: 'https://leetcode.com/problems/sort-colors/' },
  { id: 'csbs-10', trackId: 'csbs_core', title: 'Binary Search', titleSlug: 'binary-search', difficulty: 'Easy', topic: 'Binary Search', orderIndex: 10, leetcodeUrl: 'https://leetcode.com/problems/binary-search/' },
  { id: 'csbs-11', trackId: 'csbs_core', title: 'Search a 2D Matrix', titleSlug: 'search-a-2d-matrix', difficulty: 'Medium', topic: 'Binary Search', orderIndex: 11, leetcodeUrl: 'https://leetcode.com/problems/search-a-2d-matrix/' },
  { id: 'csbs-12', trackId: 'csbs_core', title: 'Climbing Stairs', titleSlug: 'climbing-stairs', difficulty: 'Easy', topic: 'Dynamic Programming', orderIndex: 12, leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/' },
  { id: 'csbs-13', trackId: 'csbs_core', title: 'Coin Change', titleSlug: 'coin-change', difficulty: 'Medium', topic: 'Dynamic Programming', orderIndex: 13, leetcodeUrl: 'https://leetcode.com/problems/coin-change/' },
  { id: 'csbs-14', trackId: 'csbs_core', title: 'Number of Islands', titleSlug: 'number-of-islands', difficulty: 'Medium', topic: 'Graphs', orderIndex: 14, leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/' },
  { id: 'csbs-15', trackId: 'csbs_core', title: 'Invert Binary Tree', titleSlug: 'invert-binary-tree', difficulty: 'Easy', topic: 'Trees', orderIndex: 15, leetcodeUrl: 'https://leetcode.com/problems/invert-binary-tree/' },
];

export const ROTATING_POTD_POOL: Omit<POTDItem, 'id' | 'date'>[] = [
  {
    title: 'Two Sum',
    titleSlug: 'two-sum',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    acceptanceRate: 52.4,
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
    hint: 'Use a hash map to look up the complement of each element in O(1) time.'
  },
  {
    title: 'Valid Palindrome',
    titleSlug: 'valid-palindrome',
    difficulty: 'Easy',
    topic: 'Two Pointers',
    acceptanceRate: 46.8,
    leetcodeUrl: 'https://leetcode.com/problems/valid-palindrome/',
    hint: 'Filter alphanumeric characters and compare characters using two pointers moving inwards.'
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    titleSlug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    acceptanceRate: 34.5,
    leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    hint: 'Maintain a sliding window and track the last seen index of each character.'
  },
  {
    title: 'Group Anagrams',
    titleSlug: 'group-anagrams',
    difficulty: 'Medium',
    topic: 'Arrays & Hashing',
    acceptanceRate: 67.8,
    leetcodeUrl: 'https://leetcode.com/problems/group-anagrams/',
    hint: 'Sort each string or use a 26-element character frequency array as the hash map key.'
  },
  {
    title: 'Container With Most Water',
    titleSlug: 'container-with-most-water',
    difficulty: 'Medium',
    topic: 'Two Pointers',
    acceptanceRate: 54.9,
    leetcodeUrl: 'https://leetcode.com/problems/container-with-most-water/',
    hint: 'Use two pointers from both ends; always advance the pointer with the shorter height.'
  },
  {
    title: 'Climbing Stairs',
    titleSlug: 'climbing-stairs',
    difficulty: 'Easy',
    topic: 'Dynamic Programming',
    acceptanceRate: 52.8,
    leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/',
    hint: 'The number of ways to reach step n is the sum of ways to reach step (n-1) and (n-2) (Fibonacci).'
  },
  {
    title: 'Number of Islands',
    titleSlug: 'number-of-islands',
    difficulty: 'Medium',
    topic: 'Graphs',
    acceptanceRate: 58.6,
    leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/',
    hint: 'Traverse the 2D grid and trigger BFS/DFS upon encountering unvisited "1"s to mark the full island.'
  },
  {
    title: 'Valid Parentheses',
    titleSlug: 'valid-parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
    acceptanceRate: 40.8,
    leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/',
    hint: 'Push opening brackets to stack and pop matching pairs when closing brackets are encountered.'
  },
  {
    title: 'Coin Change',
    titleSlug: 'coin-change',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    acceptanceRate: 43.1,
    leetcodeUrl: 'https://leetcode.com/problems/coin-change/',
    hint: 'Build up dp[i] where dp[i] represents min coins to make amount i using bottom-up DP.'
  },
  {
    title: 'Reverse Linked List',
    titleSlug: 'reverse-linked-list',
    difficulty: 'Easy',
    topic: 'Linked List',
    acceptanceRate: 75.3,
    leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/',
    hint: 'Keep track of prev, curr, and next pointers while iterating through the list.'
  },
  {
    title: 'Product of Array Except Self',
    titleSlug: 'product-of-array-except-self',
    difficulty: 'Medium',
    topic: 'Arrays',
    acceptanceRate: 65.5,
    leetcodeUrl: 'https://leetcode.com/problems/product-of-array-except-self/',
    hint: 'Compute prefix products in a first pass and suffix products in a reverse pass without division.'
  }
];
