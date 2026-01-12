// Daily streak tracking utilities
// Tracks consecutive days of practice

/**
 * Check if two dates are on the same calendar day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date1 is exactly one day before date2
 */
export function isYesterday(date1: Date, date2: Date): boolean {
  const yesterday = new Date(date2);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date1, yesterday);
}

/**
 * Get the start of a day (midnight)
 */
export function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Calculate days between two dates (ignoring time)
 */
export function daysBetween(date1: Date, date2: Date): number {
  const d1 = startOfDay(date1);
  const d2 = startOfDay(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export interface StreakUpdate {
  currentStreak: number;
  bestStreak: number;
  streakIncreased: boolean;
  streakBroken: boolean;
  isNewDay: boolean;
}

/**
 * Calculate streak update based on last active time
 *
 * @param lastActiveAt - When the student was last active
 * @param currentStreak - Current streak count
 * @param bestStreak - Best streak ever achieved
 * @returns Updated streak values and status flags
 */
export function calculateStreakUpdate(
  lastActiveAt: Date,
  currentStreak: number,
  bestStreak: number
): StreakUpdate {
  const now = new Date();
  const lastActive = new Date(lastActiveAt);

  // If active today already, no change
  if (isSameDay(lastActive, now)) {
    return {
      currentStreak,
      bestStreak,
      streakIncreased: false,
      streakBroken: false,
      isNewDay: false,
    };
  }

  // If active yesterday, increment streak
  if (isYesterday(lastActive, now)) {
    const newStreak = currentStreak + 1;
    const newBest = Math.max(bestStreak, newStreak);
    return {
      currentStreak: newStreak,
      bestStreak: newBest,
      streakIncreased: true,
      streakBroken: false,
      isNewDay: true,
    };
  }

  // If first activity ever (currentStreak is 0 and this is their first day)
  if (currentStreak === 0) {
    return {
      currentStreak: 1,
      bestStreak: Math.max(bestStreak, 1),
      streakIncreased: true,
      streakBroken: false,
      isNewDay: true,
    };
  }

  // More than 1 day gap - streak broken, start new
  return {
    currentStreak: 1,
    bestStreak, // Best streak doesn't change when broken
    streakIncreased: false,
    streakBroken: true,
    isNewDay: true,
  };
}

/**
 * Get streak milestone badges that should be awarded
 */
export function getStreakMilestones(streak: number): number[] {
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  return milestones.filter(m => streak >= m);
}

/**
 * Format streak for display
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return 'No streak';
  if (streak === 1) return '1 day';
  return `${streak} days`;
}

/**
 * Get motivational message based on streak status
 */
export function getStreakMessage(update: StreakUpdate): string | null {
  if (update.streakBroken) {
    return "Your streak was reset, but don't give up! Start fresh today!";
  }

  if (update.streakIncreased) {
    const { currentStreak } = update;

    if (currentStreak === 3) return "3 days in a row! You're building a habit!";
    if (currentStreak === 7) return "1 week streak! Amazing dedication!";
    if (currentStreak === 14) return "2 weeks! You're unstoppable!";
    if (currentStreak === 30) return "30 days! A whole month of practice!";
    if (currentStreak === 60) return "60 days! Incredible commitment!";
    if (currentStreak === 100) return "100 DAYS! You're a math champion!";

    if (currentStreak > 0 && currentStreak % 10 === 0) {
      return `${currentStreak} day streak! Keep it up!`;
    }

    return null;
  }

  return null;
}
