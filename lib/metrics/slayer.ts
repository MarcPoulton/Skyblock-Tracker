import {
  SLAYER_BOSSES,
  SLAYER_DISPLAY,
  MAX_SLAYER_TIER,
} from "./config";
import type { CategoryMetric, MetricBreakdownItem } from "./types";

const SLAYER_XP_TIERS = [
  5, 15, 200, 1000, 5000, 20000, 100000, 400000, 1000000,
];

function slayerTierFromXp(xp: number): number {
  let tier = 0;
  for (let i = 0; i < SLAYER_XP_TIERS.length; i++) {
    if (xp >= SLAYER_XP_TIERS[i]) tier = i + 1;
    else break;
  }
  return Math.min(tier, MAX_SLAYER_TIER);
}

function slayerWeight(xp: number): number {
  const tier = slayerTierFromXp(xp);
  if (tier < MAX_SLAYER_TIER) return tier * 100;
  const maxXp = SLAYER_XP_TIERS[MAX_SLAYER_TIER - 1];
  const excess = xp - maxXp;
  return MAX_SLAYER_TIER * 100 + Math.sqrt(Math.max(0, excess) / 100);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeSlayer(memberData: Record<string, any>): CategoryMetric {
  const slayerData = memberData.slayer_bosses ?? {};
  const breakdown: MetricBreakdownItem[] = [];
  let totalTier = 0;
  let totalWeight = 0;

  for (const boss of SLAYER_BOSSES) {
    const bossData = slayerData[boss] ?? {};
    const xp = Number(bossData.xp ?? 0);
    const tier = slayerTierFromXp(xp);
    totalTier += tier;
    totalWeight += slayerWeight(xp);

    breakdown.push({
      id: boss,
      name: SLAYER_DISPLAY[boss],
      current: tier,
      max: MAX_SLAYER_TIER,
      percent: (tier / MAX_SLAYER_TIER) * 100,
      missing: tier < MAX_SLAYER_TIER ? `Tier ${tier + 1}` : undefined,
    });
  }

  const maxTotal = SLAYER_BOSSES.length * MAX_SLAYER_TIER;

  return {
    current: totalTier,
    max: maxTotal,
    percent: (totalTier / maxTotal) * 100,
    breakdown,
    missing: breakdown.filter((b) => b.current < b.max).map((b) => b.name),
    weight: totalWeight,
  };
}

export { slayerWeight };
