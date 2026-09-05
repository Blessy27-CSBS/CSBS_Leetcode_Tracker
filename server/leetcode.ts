import { FetchStatus, LanguageStat, SkillStat } from '../src/types.js';

export interface LeetCodeFetchResult {
  status: FetchStatus;
  error?: string;
  data?: {
    username: string;
    realName?: string;
    ranking: number;
    reputation: number;
    total_solved: number;
    easy: number;
    medium: number;
    hard: number;
    total_submissions: number;
    accepted_submissions: number;
    acceptance_rate: number;
    contest_rating: number;
    contest_rank: number;
    contests_attended: number;
    top_percentage: number;
    contest_badge?: string;
    streak: number;
    active_days: number;
    last_active?: string;
    submission_calendar?: Record<string, number>;
    languages: LanguageStat[];
    skills: SkillStat[];
    badges: { name: string; icon?: string }[];
    recent_submissions?: {
      title: string;
      titleSlug: string;
      timestamp: string;
      statusDisplay?: string;
      lang?: string;
      language?: string;
    }[];
  };
}

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

const USER_PROFILE_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      ranking
      reputation
      userAvatar
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
      totalSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    languageProblemCount {
      languageName
      problemsSolved
    }
    tagProblemCounts {
      advanced {
        tagName
        problemsSolved
      }
      intermediate {
        tagName
        problemsSolved
      }
      fundamental {
        tagName
        problemsSolved
      }
    }
    userCalendar {
      streak
      totalActiveDays
      submissionCalendar
    }
    badges {
      name
      icon
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
    badge {
      name
    }
  }
  recentSubmissionList(username: $username, limit: 20) {
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
  recentAcSubmissionList(username: $username, limit: 20) {
    id
    title
    titleSlug
    timestamp
  }
}
`;

export async function fetchLeetCodeProfile(
  username: string, 
  timeoutMs: number = 25000,
  maxRetries: number = 2
): Promise<LeetCodeFetchResult> {
  if (!username || !username.trim()) {
    return {
      status: 'USERNAME_MISSING',
      error: 'Username is required and cannot be empty.',
    };
  }

  const cleanUsername = username.trim();
  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(LEETCODE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': `https://leetcode.com/${cleanUsername}/`,
        },
        body: JSON.stringify({
          query: USER_PROFILE_QUERY,
          variables: { username: cleanUsername },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        if (attempt <= maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        return {
          status: 'RATE_LIMITED',
          error: 'LeetCode rate limit reached. Please try again after a few moments.',
        };
      }

      if (!response.ok) {
        if (attempt <= maxRetries && response.status >= 500) {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        return {
          status: 'API_ERROR',
          error: `LeetCode API responded with HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const json = await response.json();

      if (json.errors && json.errors.length > 0) {
        const errMsg = json.errors.map((e: any) => e.message).join('; ');
        return {
          status: 'API_ERROR',
          error: `GraphQL Error: ${errMsg}`,
        };
      }

      const matchedUser = json.data?.matchedUser;
      if (!matchedUser) {
        return {
          status: 'USERNAME_NOT_FOUND',
          error: `LeetCode user '${cleanUsername}' was not found. Please verify the profile handle.`,
        };
      }

      // Parse submit stats
      const acNums = matchedUser.submitStats?.acSubmissionNum || [];
      const totalNums = matchedUser.submitStats?.totalSubmissionNum || [];

      let totalSolved = 0;
      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;
      let totalSubmissions = 0;
      let acceptedSubmissions = 0;

      acNums.forEach((item: any) => {
        if (item.difficulty === 'All') {
          totalSolved = item.count || 0;
          acceptedSubmissions = item.submissions || 0;
        } else if (item.difficulty === 'Easy') {
          easySolved = item.count || 0;
        } else if (item.difficulty === 'Medium') {
          mediumSolved = item.count || 0;
        } else if (item.difficulty === 'Hard') {
          hardSolved = item.count || 0;
        }
      });

      totalNums.forEach((item: any) => {
        if (item.difficulty === 'All') {
          totalSubmissions = item.submissions || 0;
        }
      });

      const acceptanceRate = totalSubmissions > 0 
        ? Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 10 
        : 0;

      // Parse contest stats
      const contest = json.data?.userContestRanking;
      const contestRating = contest?.rating ? Math.round(contest.rating) : 0;
      const contestRank = contest?.globalRanking || 0;
      const contestsAttended = contest?.attendedContestsCount || 0;
      const topPercentage = contest?.topPercentage ? Math.round(contest.topPercentage * 10) / 10 : 0;
      const contestBadge = contest?.badge?.name;

      // Parse calendar & streak
      const calendar = matchedUser.userCalendar || {};
      const streak = calendar.streak || 0;
      const activeDays = calendar.totalActiveDays || 0;
      
      let submissionCalendar: Record<string, number> = {};
      let lastActive: string | undefined = undefined;

      if (calendar.submissionCalendar) {
        try {
          submissionCalendar = typeof calendar.submissionCalendar === 'string'
            ? JSON.parse(calendar.submissionCalendar)
            : calendar.submissionCalendar;

          const timestamps = Object.keys(submissionCalendar).map(t => parseInt(t, 10)).filter(t => !isNaN(t) && submissionCalendar[t] > 0);
          if (timestamps.length > 0) {
            const maxTimestamp = Math.max(...timestamps);
            lastActive = new Date(maxTimestamp * 1000).toISOString().split('T')[0];
          }
        } catch (e) {
          // ignore calendar parse error
        }
      }

      // Parse Languages
      const languages: LanguageStat[] = (matchedUser.languageProblemCount || []).map((l: any) => ({
        languageName: l.languageName,
        problemsSolved: l.problemsSolved || 0,
      }));

      // Parse Skills / Topics
      const skills: SkillStat[] = [];
      const tagCounts = matchedUser.tagProblemCounts || {};
      ['fundamental', 'intermediate', 'advanced'].forEach(cat => {
        const list = tagCounts[cat] || [];
        list.forEach((tag: any) => {
          skills.push({
            tagName: tag.tagName,
            problemsSolved: tag.problemsSolved || 0,
            category: cat as any,
          });
        });
      });

      // Badges
      const badges = (matchedUser.badges || []).map((b: any) => ({
        name: b.name,
        icon: b.icon,
      }));

      // Recent AC Submissions with Language & Timestamp
      const rawSubmissions: any[] = json.data?.recentSubmissionList && json.data.recentSubmissionList.length > 0
        ? json.data.recentSubmissionList
        : (json.data?.recentAcSubmissionList || []);

      const topLang = languages.length > 0 ? languages[0].languageName : 'Python3';

      const recentList = rawSubmissions.map((s: any) => {
        let tsStr = s.timestamp;
        const tsNum = Number(s.timestamp);
        if (!isNaN(tsNum) && tsNum > 0) {
          tsStr = tsNum > 1e11 ? new Date(tsNum).toISOString() : new Date(tsNum * 1000).toISOString();
        }

        return {
          title: s.title || 'Algorithmic Problem',
          titleSlug: s.titleSlug || (s.title ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'problem'),
          timestamp: tsStr || (lastActive ? new Date(lastActive).toISOString() : new Date().toISOString()),
          lang: s.lang || s.language || topLang,
          language: s.lang || s.language || topLang,
          statusDisplay: s.statusDisplay || 'Accepted',
        };
      });

      return {
        status: 'SUCCESS',
        data: {
          username: matchedUser.username || cleanUsername,
          realName: matchedUser.profile?.realName || undefined,
          ranking: matchedUser.profile?.ranking || 0,
          reputation: matchedUser.profile?.reputation || 0,
          total_solved: totalSolved,
          easy: easySolved,
          medium: mediumSolved,
          hard: hardSolved,
          total_submissions: totalSubmissions,
          accepted_submissions: acceptedSubmissions,
          acceptance_rate: acceptanceRate,
          contest_rating: contestRating,
          contest_rank: contestRank,
          contests_attended: contestsAttended,
          top_percentage: topPercentage,
          contest_badge: contestBadge,
          streak,
          active_days: activeDays,
          last_active: lastActive,
          submission_calendar: submissionCalendar,
          languages,
          skills,
          badges,
          recent_submissions: recentList,
        },
      };

    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (attempt <= maxRetries) {
          continue;
        }
        return {
          status: 'TIMEOUT',
          error: `Request timed out after ${timeoutMs / 1000}s while connecting to LeetCode.`,
        };
      }

      if (attempt <= maxRetries) {
        const backoff = Math.pow(2, attempt) * 800;
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      return {
        status: 'FETCH_ERROR',
        error: err.message || 'Unknown network error occurred while connecting to LeetCode.',
      };
    }
  }

  return {
    status: 'FETCH_ERROR',
    error: 'Failed to fetch LeetCode data after multiple retry attempts.',
  };
}
