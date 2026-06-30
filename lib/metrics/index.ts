import { CATEGORY_WEIGHTS } from "./config";
import { computeSkills, getSkillAverage } from "./skills";
import { computeSlayer } from "./slayer";
import { computeDungeons, getCatacombsLevel } from "./dungeons";
import { computeCollections } from "./collections";
import { computeSenitherWeight } from "./weight";
import {
  computePets,
  computeMinions,
  computeBestiary,
  computeSkyblockLevel,
} from "./pets-minions-bestiary";
import type { PlayerMetrics, StaticResources } from "./types";

export function computeOverallCompletion(categories: {
  skills: { percent: number };
  slayer: { percent: number };
  dungeons: { percent: number };
  collections: { percent: number };
  minions: { percent: number };
  pets: { percent: number };
  bestiary: { percent: number };
  skyblockLevel: { percent: number };
}): number {
  const weights = CATEGORY_WEIGHTS;
  let weightedSum = 0;
  let totalWeight = 0;

  const entries: [keyof typeof weights, number][] = [
    ["skills", categories.skills.percent],
    ["slayer", categories.slayer.percent],
    ["dungeons", categories.dungeons.percent],
    ["collections", categories.collections.percent],
    ["minions", categories.minions.percent],
    ["pets", categories.pets.percent],
    ["bestiary", categories.bestiary.percent],
    ["skyblockLevel", categories.skyblockLevel.percent],
  ];

  for (const [key, pct] of entries) {
    const w = weights[key];
    weightedSum += pct * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeAllMetrics(
  memberData: Record<string, any>,
  staticResources: StaticResources | null,
  networthTotal = 0,
  nonCosmeticNetworth = 0,
): PlayerMetrics {
  const skills = computeSkills(memberData);
  const slayer = computeSlayer(memberData);
  const dungeons = computeDungeons(memberData);
  const collections = computeCollections(memberData, staticResources);
  const weight = computeSenitherWeight(memberData);
  const minions = computeMinions(memberData);
  const pets = computePets(memberData);
  const bestiary = computeBestiary(memberData);
  const skyblockLevel = computeSkyblockLevel(memberData);

  const networthGoal = 5_000_000_000;
  const networth = {
    current: networthTotal,
    max: networthGoal,
    percent: Math.min(100, (networthTotal / networthGoal) * 100),
    breakdown: [],
    missing: [],
  };

  const overallCompletionPct = computeOverallCompletion({
    skills,
    slayer,
    dungeons,
    collections,
    minions,
    pets,
    bestiary,
    skyblockLevel,
  });

  return {
    skills,
    slayer,
    dungeons,
    collections,
    weight,
    networth,
    minions,
    pets,
    bestiary,
    skyblockLevel,
    overallCompletionPct,
    skillAverage: getSkillAverage(memberData),
    senitherWeight: weight.weight ?? 0,
    catacombsLevel: getCatacombsLevel(memberData),
    networthTotal,
    nonCosmeticNetworth,
  };
}

export * from "./types";
export * from "./config";
