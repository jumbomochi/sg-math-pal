// Badge Earning System
// Defines badge types and conditions for earning them

export interface BadgeDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  condition: BadgeCondition;
}

export type BadgeCondition =
  | { type: 'first_question' }
  | { type: 'correct_streak'; count: number }
  | { type: 'speed_answer'; seconds: number }
  | { type: 'no_hints'; count: number }
  | { type: 'tier_reached'; tier: number }
  | { type: 'day_streak'; days: number }
  | { type: 'topic_mastered'; tier: number }
  | { type: 'total_correct'; count: number }
  | { type: 'perfect_session'; questions: number };

// All available badges
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Progression badges
  {
    type: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first question',
    icon: 'footprints',
    condition: { type: 'first_question' },
  },
  {
    type: 'perfect-10',
    name: 'Perfect 10',
    description: 'Answer 10 questions correctly in a row',
    icon: 'target',
    condition: { type: 'correct_streak', count: 10 },
  },
  {
    type: 'speed-demon',
    name: 'Speed Demon',
    description: 'Answer correctly in under 10 seconds',
    icon: 'zap',
    condition: { type: 'speed_answer', seconds: 10 },
  },
  {
    type: 'hint-free-hero',
    name: 'Hint-Free Hero',
    description: 'Answer 20 questions correctly without using hints',
    icon: 'brain',
    condition: { type: 'no_hints', count: 20 },
  },

  // Tier badges (awarded on tier promotion in challenge/complete)
  {
    type: 'bronze-explorer',
    name: 'Bronze Explorer',
    description: 'Reach Bronze tier in any topic',
    icon: 'medal',
    condition: { type: 'tier_reached', tier: 2 },
  },
  {
    type: 'silver-star',
    name: 'Silver Star',
    description: 'Reach Silver tier in any topic',
    icon: 'star',
    condition: { type: 'tier_reached', tier: 3 },
  },
  {
    type: 'gold-master',
    name: 'Gold Master',
    description: 'Reach Gold tier in any topic',
    icon: 'crown',
    condition: { type: 'tier_reached', tier: 4 },
  },
  {
    type: 'platinum-legend',
    name: 'Platinum Legend',
    description: 'Reach Platinum tier - the highest level!',
    icon: 'trophy',
    condition: { type: 'tier_reached', tier: 5 },
  },

  // Streak badges
  {
    type: 'getting-started',
    name: 'Getting Started',
    description: 'Maintain a 3-day practice streak',
    icon: 'rocket',
    condition: { type: 'day_streak', days: 3 },
  },
  {
    type: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day practice streak',
    icon: 'flame',
    condition: { type: 'day_streak', days: 7 },
  },
  {
    type: 'fortnight-fighter',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day practice streak',
    icon: 'swords',
    condition: { type: 'day_streak', days: 14 },
  },
  {
    type: 'month-master',
    name: 'Month Master',
    description: 'Maintain a 30-day practice streak',
    icon: 'calendar',
    condition: { type: 'day_streak', days: 30 },
  },

  // Achievement badges
  {
    type: 'century',
    name: 'Century',
    description: 'Answer 100 questions correctly',
    icon: 'award',
    condition: { type: 'total_correct', count: 100 },
  },
  {
    type: 'math-wizard',
    name: 'Math Wizard',
    description: 'Answer 500 questions correctly',
    icon: 'sparkles',
    condition: { type: 'total_correct', count: 500 },
  },
  {
    type: 'perfect-practice',
    name: 'Perfect Practice',
    description: 'Complete a practice session with 100% accuracy (10+ questions)',
    icon: 'check-circle',
    condition: { type: 'perfect_session', questions: 10 },
  },
];

// Get badge definition by type
export function getBadgeDefinition(type: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(b => b.type === type);
}

// Check conditions for badges after an attempt
export interface AttemptContext {
  isCorrect: boolean;
  hintsUsed: number;
  timeSpent: number;
  currentStreak: number; // consecutive correct answers
  perfectAnswers: number; // total without hints
  totalCorrect: number;
  dayStreak: number;
}

export function checkAttemptBadges(context: AttemptContext): string[] {
  const earnedBadgeTypes: string[] = [];

  // First question badge
  if (context.isCorrect && context.totalCorrect === 1) {
    earnedBadgeTypes.push('first-steps');
  }

  // Speed demon - answer correctly in under 10 seconds
  if (context.isCorrect && context.timeSpent < 10) {
    earnedBadgeTypes.push('speed-demon');
  }

  // Perfect 10 streak
  if (context.isCorrect && context.currentStreak >= 10) {
    earnedBadgeTypes.push('perfect-10');
  }

  // Hint-free hero
  if (context.isCorrect && context.hintsUsed === 0 && context.perfectAnswers >= 20) {
    earnedBadgeTypes.push('hint-free-hero');
  }

  // Century (100 correct)
  if (context.isCorrect && context.totalCorrect >= 100) {
    earnedBadgeTypes.push('century');
  }

  // Math wizard (500 correct)
  if (context.isCorrect && context.totalCorrect >= 500) {
    earnedBadgeTypes.push('math-wizard');
  }

  // Getting started (3 day streak)
  if (context.dayStreak >= 3) {
    earnedBadgeTypes.push('getting-started');
  }

  // Week warrior (7 day streak)
  if (context.dayStreak >= 7) {
    earnedBadgeTypes.push('week-warrior');
  }

  // Fortnight fighter (14 day streak)
  if (context.dayStreak >= 14) {
    earnedBadgeTypes.push('fortnight-fighter');
  }

  // Month master (30 day streak)
  if (context.dayStreak >= 30) {
    earnedBadgeTypes.push('month-master');
  }

  return earnedBadgeTypes;
}

// Get list of badges for a session result
export interface SessionContext {
  correctAnswers: number;
  totalQuestions: number;
}

export function checkSessionBadges(context: SessionContext): string[] {
  const earnedBadgeTypes: string[] = [];

  // Perfect practice - 100% accuracy with 10+ questions
  if (
    context.totalQuestions >= 10 &&
    context.correctAnswers === context.totalQuestions
  ) {
    earnedBadgeTypes.push('perfect-practice');
  }

  return earnedBadgeTypes;
}
