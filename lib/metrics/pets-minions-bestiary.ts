import { RARITY_WEIGHTS, MINION_MAX_UNIQUE } from "./config";
import type { CategoryMetric, MetricBreakdownItem } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computePets(memberData: Record<string, any>): CategoryMetric {
  const pets: Array<Record<string, unknown>> = memberData.pets ?? [];
  const breakdown: MetricBreakdownItem[] = [];
  let totalScore = 0;
  let maxPossible = 0;

  for (const pet of pets) {
    const tier = String(pet.tier ?? "COMMON").toUpperCase();
    const level = Number(pet.level ?? 1);
    const rarityWeight = RARITY_WEIGHTS[tier] ?? 1;
    const score = level * rarityWeight;
    totalScore += score;
    maxPossible += 100 * rarityWeight;

    if (level < 100) {
      breakdown.push({
        id: String(pet.uuid ?? pet.type ?? "unknown"),
        name: formatPetName(String(pet.type ?? "Unknown")),
        current: level,
        max: 100,
        percent: level,
        missing: `Level ${level}/100 (${tier})`,
      });
    }
  }

  breakdown.sort((a, b) => a.percent - b.percent);

  const legendaryPlus = pets.filter((p) => {
    const tier = String(p.tier ?? "").toUpperCase();
    return ["LEGENDARY", "MYTHIC"].includes(tier);
  }).length;

  return {
    current: totalScore,
    max: Math.max(maxPossible, 1),
    percent: maxPossible > 0 ? Math.min(100, (totalScore / maxPossible) * 100) : 0,
    breakdown: breakdown.slice(0, 20),
    missing: [`${legendaryPlus} legendary+ pets`],
  };
}

function formatPetName(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeMinions(memberData: Record<string, any>): CategoryMetric {
  const crafted: Record<string, number> = memberData.player_data?.crafted_generators ?? {};
  const uniqueMinions = Object.keys(crafted).length;

  const breakdown: MetricBreakdownItem[] = Object.entries(crafted)
    .map(([id, tier]) => ({
      id,
      name: id.replace(/_/g, " "),
      current: Number(tier),
      max: 12,
      percent: (Number(tier) / 12) * 100,
    }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 30);

  return {
    current: uniqueMinions,
    max: MINION_MAX_UNIQUE,
    percent: (uniqueMinions / MINION_MAX_UNIQUE) * 100,
    breakdown,
    missing: [`${MINION_MAX_UNIQUE - uniqueMinions} minions remaining`],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeBestiary(memberData: Record<string, any>): CategoryMetric {
  const bestiary = memberData.bestiary ?? {};
  const kills: Record<string, number> = bestiary.kills ?? {};
  const milestones: Record<string, number> = bestiary.milestone ?? {};

  const breakdown: MetricBreakdownItem[] = [];
  let completedMilestones = 0;
  let totalMilestones = 0;

  const families = new Set([...Object.keys(kills), ...Object.keys(milestones)]);

  for (const family of families) {
    const milestone = Number(milestones[family] ?? 0);
    const killCount = Number(kills[family] ?? 0);
    const maxMilestone = 10;
    totalMilestones += maxMilestone;
    completedMilestones += Math.min(milestone, maxMilestone);

    if (milestone < maxMilestone) {
      breakdown.push({
        id: family,
        name: family.replace(/_/g, " "),
        current: milestone,
        max: maxMilestone,
        percent: (milestone / maxMilestone) * 100,
        missing: `${killCount.toLocaleString()} kills`,
      });
    }
  }

  breakdown.sort((a, b) => a.percent - b.percent);

  return {
    current: completedMilestones,
    max: Math.max(totalMilestones, 1),
    percent: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
    breakdown: breakdown.slice(0, 30),
    missing: breakdown.slice(0, 10).map((b) => b.name),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeSkyblockLevel(memberData: Record<string, any>): CategoryMetric {
  const leveling = memberData.leveling ?? {};
  const experience = Number(leveling.experience ?? memberData.levelingExperience ?? 0);
  const level = Math.floor(experience / 100);
  const maxLevel = 440;

  return {
    current: level,
    max: maxLevel,
    percent: Math.min(100, (level / maxLevel) * 100),
    breakdown: [{
      id: "skyblock_level",
      name: "SkyBlock Level",
      current: level,
      max: maxLevel,
      percent: Math.min(100, (level / maxLevel) * 100),
    }],
    missing: level < maxLevel ? [`${maxLevel - level} levels`] : [],
  };
}
