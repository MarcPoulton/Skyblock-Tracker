import { SKILL_NAMES, MAX_SKILL_LEVEL } from "./config";
import type { CategoryMetric, MetricBreakdownItem } from "./types";

const SKILL_XP_TABLE: number[] = [
  0, 50, 125, 200, 300, 500, 750, 1000, 1500, 2000, 3500, 5000, 7500, 10000,
  15000, 20000, 30000, 50000, 75000, 100000, 200000, 300000, 400000, 500000,
  600000, 700000, 800000, 900000, 1000000, 1100000, 1200000, 1300000, 1400000,
  1500000, 1600000, 1700000, 1800000, 1900000, 2000000, 2100000, 2200000, 2300000,
  2400000, 2500000, 2600000, 2750000, 2900000, 3100000, 3400000, 3700000, 4000000,
  4300000, 4600000, 4900000, 5200000, 5500000, 5800000, 6100000, 6400000, 6700000,
  7000000,
];

export function skillLevelFromXp(xp: number): number {
  let level = 0;
  for (let i = 1; i < SKILL_XP_TABLE.length; i++) {
    if (xp >= SKILL_XP_TABLE[i]) level = i;
    else break;
  }
  return Math.min(level, MAX_SKILL_LEVEL);
}

export function skillXpForLevel(level: number): number {
  if (level <= 0) return 0;
  const idx = Math.min(level, SKILL_XP_TABLE.length - 1);
  return SKILL_XP_TABLE[idx] ?? 0;
}

function skillWeight(xp: number): number {
  const level = skillLevelFromXp(xp);
  if (level < MAX_SKILL_LEVEL) {
    return level * 2;
  }
  const excess = xp - skillXpForLevel(MAX_SKILL_LEVEL);
  return MAX_SKILL_LEVEL * 2 + Math.sqrt(excess / 1000);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeSkills(memberData: Record<string, any>): CategoryMetric {
  const breakdown: MetricBreakdownItem[] = [];
  let totalLevel = 0;
  let totalWeight = 0;

  for (const skill of SKILL_NAMES) {
    const xp = Number(memberData[`experience_skill_${skill}`] ?? 0);
    const level = skillLevelFromXp(xp);
    totalLevel += level;
    totalWeight += skillWeight(xp);

    breakdown.push({
      id: skill,
      name: skill.charAt(0).toUpperCase() + skill.slice(1),
      current: level,
      max: MAX_SKILL_LEVEL,
      percent: Math.min(100, (level / MAX_SKILL_LEVEL) * 100),
      missing: level < MAX_SKILL_LEVEL ? `${MAX_SKILL_LEVEL - level} levels` : undefined,
    });
  }

  const avgLevel = totalLevel / SKILL_NAMES.length;
  const maxTotal = SKILL_NAMES.length * MAX_SKILL_LEVEL;

  return {
    current: totalLevel,
    max: maxTotal,
    percent: (totalLevel / maxTotal) * 100,
    breakdown,
    missing: breakdown.filter((b) => b.current < b.max).map((b) => b.name),
    weight: totalWeight,
  };
}

export function getSkillAverage(memberData: Record<string, unknown>): number {
  let total = 0;
  for (const skill of SKILL_NAMES) {
    const xp = Number(memberData[`experience_skill_${skill}`] ?? 0);
    total += skillLevelFromXp(xp);
  }
  return total / SKILL_NAMES.length;
}

export { skillWeight };
