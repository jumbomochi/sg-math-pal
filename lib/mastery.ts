// Spaced Repetition using SM-2 Algorithm
// Adapted for kid-friendly 1-3 quality rating

export interface MasteryState {
  easeFactor: number;      // 1.3 to 2.5+
  interval: number;        // days until next review
  repetitions: number;     // consecutive correct answers
  nextReviewDate: Date;
  lastQuality: number;     // last performance rating
}

export interface MasteryUpdate {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

// Kid-friendly quality ratings
export type Quality = 1 | 2 | 3; // 1=Hard, 2=Good, 3=Easy

// Convert kid-friendly quality (1-3) to SM-2 scale (0-5)
function toSM2Quality(quality: Quality): number {
  switch (quality) {
    case 1: return 2;  // Hard → SM-2 "2" (incorrect response but remembered)
    case 2: return 4;  // Good → SM-2 "4" (correct with hesitation)
    case 3: return 5;  // Easy → SM-2 "5" (perfect response)
    default: return 3;
  }
}

/**
 * Calculate the next review state using SM-2 algorithm
 */
export function calculateNextReview(
  current: MasteryState,
  quality: Quality,
  wasCorrect: boolean
): MasteryUpdate {
  // Convert to SM-2 scale
  const q = wasCorrect ? toSM2Quality(quality) : 1; // If incorrect, treat as failure

  let { easeFactor, interval, repetitions } = current;

  if (!wasCorrect || q < 3) {
    // Failed - reset repetitions
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  nextReviewDate.setHours(0, 0, 0, 0); // Reset to start of day

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Get initial mastery state for a new question
 */
export function getInitialMasteryState(): MasteryState {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
    lastQuality: 0,
  };
}

/**
 * Check if a question is due for review
 */
export function isDueForReview(nextReviewDate: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  return reviewDate <= now;
}

/**
 * Get priority score for sorting review queue
 * Higher score = more urgent review
 */
export function getReviewPriority(
  nextReviewDate: Date,
  easeFactor: number,
  repetitions: number
): number {
  const now = new Date();
  const overdueDays = Math.max(
    0,
    (now.getTime() - nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Priority increases with:
  // 1. How overdue the question is (most important)
  // 2. Lower ease factor (harder questions)
  // 3. Lower repetitions (less mastered)
  const overdueScore = overdueDays * 10;
  const difficultyScore = (3 - easeFactor) * 5; // Lower EF = higher score
  const masteryScore = Math.max(0, 5 - repetitions); // Lower reps = higher score

  return overdueScore + difficultyScore + masteryScore;
}

/**
 * Get a human-readable mastery level
 */
export function getMasteryLevel(repetitions: number, easeFactor: number): {
  level: 'new' | 'learning' | 'reviewing' | 'mastered';
  label: string;
  color: string;
} {
  if (repetitions === 0) {
    return { level: 'new', label: 'New', color: '#6b7280' };
  }
  if (repetitions < 3) {
    return { level: 'learning', label: 'Learning', color: '#f59e0b' };
  }
  if (repetitions < 5 || easeFactor < 2.0) {
    return { level: 'reviewing', label: 'Reviewing', color: '#3b82f6' };
  }
  return { level: 'mastered', label: 'Mastered', color: '#22c55e' };
}

/**
 * Get encouraging message based on quality rating
 */
export function getQualityMessage(quality: Quality, wasCorrect: boolean): string {
  if (!wasCorrect) {
    return "No worries! You'll get it next time.";
  }

  switch (quality) {
    case 1:
      return "You got it! Keep practicing and it'll get easier.";
    case 2:
      return "Nice work! You're getting the hang of it.";
    case 3:
      return "Awesome! This is becoming easy for you!";
    default:
      return "Good job!";
  }
}

/**
 * Calculate when to show quality rating prompt
 * Only show after correct answers
 */
export function shouldShowQualityRating(wasCorrect: boolean): boolean {
  return wasCorrect;
}

/**
 * Get the quality rating options for UI
 */
export function getQualityOptions(): Array<{
  quality: Quality;
  label: string;
  emoji: string;
  description: string;
}> {
  return [
    {
      quality: 1,
      label: 'Hard',
      emoji: '😓',
      description: 'That was tricky!',
    },
    {
      quality: 2,
      label: 'Good',
      emoji: '🙂',
      description: 'I remembered it',
    },
    {
      quality: 3,
      label: 'Easy',
      emoji: '😄',
      description: 'Too easy!',
    },
  ];
}

/**
 * Get stats summary for review dashboard
 */
export interface ReviewStats {
  dueToday: number;
  learned: number;      // repetitions >= 1
  mastered: number;     // repetitions >= 5 && easeFactor >= 2.0
  totalReviewed: number;
  averageEaseFactor: number;
}

export function calculateReviewStats(
  masteryRecords: Array<{
    repetitions: number;
    easeFactor: number;
    nextReviewDate: Date;
    totalAttempts: number;
  }>
): ReviewStats {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let dueToday = 0;
  let learned = 0;
  let mastered = 0;
  let totalEaseFactor = 0;
  let totalReviewed = 0;

  for (const record of masteryRecords) {
    if (record.totalAttempts > 0) {
      totalReviewed++;
      totalEaseFactor += record.easeFactor;
    }

    const reviewDate = new Date(record.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);

    if (reviewDate <= now) {
      dueToday++;
    }

    if (record.repetitions >= 1) {
      learned++;
    }

    if (record.repetitions >= 5 && record.easeFactor >= 2.0) {
      mastered++;
    }
  }

  return {
    dueToday,
    learned,
    mastered,
    totalReviewed,
    averageEaseFactor: totalReviewed > 0 ? totalEaseFactor / totalReviewed : 2.5,
  };
}
