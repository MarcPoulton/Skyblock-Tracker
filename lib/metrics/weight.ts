import { skillWeight } from "./skills";
import { slayerWeight } from "./slayer";
import { dungeonWeight } from "./dungeons";
import { MAX_CATACOMBS_LEVEL, MAX_CLASS_LEVEL, DUNGEON_CLASSES } from "./config";
import type { CategoryMetric } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeSenitherWeight(memberData: Record<string, any>): CategoryMetric {
  let totalWeight = 0;

  const skillKeys = [
    "farming", "mining", "combat", "foraging", "fishing",
    "enchanting", "alchemy", "taming", "carpentry", "runecrafting", "social",
  ];

  for (const skill of skillKeys) {
    const xp = Number(memberData[`experience_skill_${skill}`] ?? 0);
    totalWeight += skillWeight(xp);
  }

  const slayerData = memberData.slayer_bosses ?? {};
  for (const boss of ["zombie", "spider", "wolf", "enderman", "blaze"]) {
    const xp = Number(slayerData[boss]?.xp ?? 0);
    totalWeight += slayerWeight(xp);
  }

  const dungeons = memberData.dungeons ?? {};
  const catacombsXp = Number(dungeons.dungeon_types?.catacombs?.experience ?? 0);
  totalWeight += dungeonWeight(catacombsXp, MAX_CATACOMBS_LEVEL);

  const playerClasses = dungeons.player_classes ?? {};
  for (const cls of DUNGEON_CLASSES) {
    const classXp = Number(playerClasses[cls]?.experience ?? 0);
    totalWeight += dungeonWeight(classXp, MAX_CLASS_LEVEL);
  }

  return {
    current: Math.round(totalWeight * 100) / 100,
    max: 0,
    percent: 0,
    breakdown: [],
    missing: [],
    weight: totalWeight,
  };
}
