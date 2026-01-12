// Tier configuration for server and client components

export const TIER_CONFIG = {
  1: { name: 'Iron', color: '#71717a', bgColor: 'bg-tier-iron' },
  2: { name: 'Bronze', color: '#cd7f32', bgColor: 'bg-tier-bronze' },
  3: { name: 'Silver', color: '#c0c0c0', bgColor: 'bg-tier-silver' },
  4: { name: 'Gold', color: '#ffd700', bgColor: 'bg-tier-gold' },
  5: { name: 'Platinum', color: '#e5e4e2', bgColor: 'bg-tier-platinum' },
} as const;

export type Tier = 1 | 2 | 3 | 4 | 5;

export function getTierConfig(tier: number) {
  return TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG[1];
}

export function getTierName(tier: number): string {
  return getTierConfig(tier).name;
}

export function getTierColor(tier: number): string {
  return getTierConfig(tier).color;
}
