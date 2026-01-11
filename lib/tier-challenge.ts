// Tier Challenge System Configuration and Logic
// Handles promotion challenges between tiers

export const TIER_NAMES: Record<number, string> = {
  1: 'Iron',
  2: 'Bronze',
  3: 'Silver',
  4: 'Gold',
  5: 'Platinum',
};

export const TIER_COLORS: Record<number, string> = {
  1: '#6b7280', // Gray
  2: '#cd7f32', // Bronze
  3: '#c0c0c0', // Silver
  4: '#ffd700', // Gold
  5: '#e5e4e2', // Platinum
};

// XP required to unlock promotion challenge for each tier
export const TIER_XP_THRESHOLDS: Record<number, number> = {
  1: 100,  // Iron: 100 XP to unlock Bronze challenge
  2: 200,  // Bronze: 200 XP to unlock Silver challenge
  3: 300,  // Silver: 300 XP to unlock Gold challenge
  4: 400,  // Gold: 400 XP to unlock Platinum challenge
  5: 0,    // Platinum: Max tier, no promotion
};

// Challenge configuration per tier transition
export interface ChallengeConfig {
  totalQuestions: number;
  requiredCorrect: number;
  timeLimit: number | null; // seconds, null = no limit
  allowHints: boolean;
  passXpBonus: number;
  failCooldownMinutes: number;
}

export const CHALLENGE_CONFIG: Record<string, ChallengeConfig> = {
  '1-2': { // Iron to Bronze
    totalQuestions: 5,
    requiredCorrect: 3,
    timeLimit: null,
    allowHints: false,
    passXpBonus: 50,
    failCooldownMinutes: 30,
  },
  '2-3': { // Bronze to Silver
    totalQuestions: 6,
    requiredCorrect: 4,
    timeLimit: 600, // 10 minutes
    allowHints: false,
    passXpBonus: 100,
    failCooldownMinutes: 60,
  },
  '3-4': { // Silver to Gold
    totalQuestions: 7,
    requiredCorrect: 5,
    timeLimit: 480, // 8 minutes
    allowHints: false,
    passXpBonus: 150,
    failCooldownMinutes: 60,
  },
  '4-5': { // Gold to Platinum
    totalQuestions: 8,
    requiredCorrect: 6,
    timeLimit: 360, // 6 minutes
    allowHints: false,
    passXpBonus: 200,
    failCooldownMinutes: 120,
  },
};

export function getChallengeConfig(fromTier: number, toTier: number): ChallengeConfig | null {
  const key = `${fromTier}-${toTier}`;
  return CHALLENGE_CONFIG[key] || null;
}

export function getTierName(tier: number): string {
  return TIER_NAMES[tier] || 'Unknown';
}

export function getTierColor(tier: number): string {
  return TIER_COLORS[tier] || '#6b7280';
}

export function canUnlockChallenge(currentTier: number, tierXp: number): boolean {
  if (currentTier >= 5) return false; // Already at max tier
  const threshold = TIER_XP_THRESHOLDS[currentTier];
  return tierXp >= threshold;
}

export function getXpToUnlockChallenge(currentTier: number, tierXp: number): number {
  if (currentTier >= 5) return 0;
  const threshold = TIER_XP_THRESHOLDS[currentTier];
  return Math.max(0, threshold - tierXp);
}

export function getProgressToChallenge(currentTier: number, tierXp: number): number {
  if (currentTier >= 5) return 100;
  const threshold = TIER_XP_THRESHOLDS[currentTier];
  return Math.min(100, Math.round((tierXp / threshold) * 100));
}

export function isChallengeOnCooldown(
  lastChallengeAt: Date | null,
  fromTier: number
): { onCooldown: boolean; remainingMinutes: number } {
  if (!lastChallengeAt) {
    return { onCooldown: false, remainingMinutes: 0 };
  }

  const config = getChallengeConfig(fromTier, fromTier + 1);
  if (!config) {
    return { onCooldown: false, remainingMinutes: 0 };
  }

  const cooldownMs = config.failCooldownMinutes * 60 * 1000;
  const now = new Date().getTime();
  const lastAttempt = new Date(lastChallengeAt).getTime();
  const elapsed = now - lastAttempt;

  if (elapsed >= cooldownMs) {
    return { onCooldown: false, remainingMinutes: 0 };
  }

  const remainingMs = cooldownMs - elapsed;
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

  return { onCooldown: true, remainingMinutes };
}

export function calculateChallengeResult(
  correctAnswers: number,
  totalQuestions: number,
  config: ChallengeConfig
): { passed: boolean; percentage: number } {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const passed = correctAnswers >= config.requiredCorrect;
  return { passed, percentage };
}

export function formatTimeLimit(seconds: number | null): string {
  if (seconds === null) return 'No time limit';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${minutes} minutes`;
  return `${minutes}m ${secs}s`;
}

export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
