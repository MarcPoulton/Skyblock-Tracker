import {
  DUNGEON_CLASSES,
  MAX_CATACOMBS_LEVEL,
  MAX_CLASS_LEVEL,
} from "./config";
import type { CategoryMetric, MetricBreakdownItem } from "./types";

const DUNGEON_XP_TABLE: number[] = [
  0, 50, 125, 235, 395, 625, 955, 1425, 2095, 3045, 4385, 6275, 8940, 12700, 17960,
  25340, 35640, 50040, 70040, 97540, 135540, 188540, 261540, 365540, 515540, 665540,
  915540, 1215540, 1615540, 2115540, 2815540, 3815540, 5115540, 6815540, 9115540,
  12115540, 16115540, 21115540, 27115540, 35115540, 45115540, 57115540, 72115540,
  90115540, 112115540, 139115540, 172115540, 212115540, 272115540, 352115540,
  452115540,
];

function dungeonLevelFromXp(xp: number): number {
  let level = 0;
  for (let i = 1; i < DUNGEON_XP_TABLE.length; i++) {
    if (xp >= DUNGEON_XP_TABLE[i]) level = i;
    else break;
  }
  return Math.min(level, MAX_CATACOMBS_LEVEL);
}

function dungeonWeight(xp: number, maxLevel: number): number {
  const level = dungeonLevelFromXp(xp);
  if (level < maxLevel) return level * 2;
  const maxXp = DUNGEON_XP_TABLE[maxLevel] ?? DUNGEON_XP_TABLE[DUNGEON_XP_TABLE.length - 1];
  const excess = xp - maxXp;
  return maxLevel * 2 + Math.sqrt(Math.max(0, excess) / 100);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeDungeons(memberData: Record<string, any>): CategoryMetric {
  const dungeons = memberData.dungeons ?? {};
  const catacombs = dungeons.dungeon_types?.catacombs ?? {};
  const catacombsXp = Number(catacombs.experience ?? 0);
  const catacombsLevel = dungeonLevelFromXp(catacombsXp);

  const breakdown: MetricBreakdownItem[] = [
    {
      id: "catacombs",
      name: "Catacombs",
      current: catacombsLevel,
      max: MAX_CATACOMBS_LEVEL,
      percent: (catacombsLevel / MAX_CATACOMBS_LEVEL) * 100,
      missing: catacombsLevel < MAX_CATACOMBS_LEVEL ? `${MAX_CATACOMBS_LEVEL - catacombsLevel} levels` : undefined,
    },
  ];

  let totalLevel = catacombsLevel;
  let totalWeight = dungeonWeight(catacombsXp, MAX_CATACOMBS_LEVEL);
  const playerClasses = dungeons.player_classes ?? {};

  for (const cls of DUNGEON_CLASSES) {
    const classXp = Number(playerClasses[cls]?.experience ?? 0);
    const classLevel = dungeonLevelFromXp(classXp);
    totalLevel += classLevel;
    totalWeight += dungeonWeight(classXp, MAX_CLASS_LEVEL);

    breakdown.push({
      id: cls,
      name: cls.charAt(0).toUpperCase() + cls.slice(1),
      current: classLevel,
      max: MAX_CLASS_LEVEL,
      percent: (classLevel / MAX_CLASS_LEVEL) * 100,
      missing: classLevel < MAX_CLASS_LEVEL ? `${MAX_CLASS_LEVEL - classLevel} levels` : undefined,
    });
  }

  const maxTotal = MAX_CATACOMBS_LEVEL + DUNGEON_CLASSES.length * MAX_CLASS_LEVEL;

  return {
    current: totalLevel,
    max: maxTotal,
    percent: (totalLevel / maxTotal) * 100,
    breakdown,
    missing: breakdown.filter((b) => b.current < b.max).map((b) => b.name),
    weight: totalWeight,
  };
}

export function getCatacombsLevel(memberData: Record<string, unknown>): number {
  const dungeons = (memberData.dungeons ?? {}) as Record<string, unknown>;
  const dungeonTypes = (dungeons.dungeon_types ?? {}) as Record<string, unknown>;
  const catacombs = (dungeonTypes.catacombs ?? {}) as Record<string, unknown>;
  return dungeonLevelFromXp(Number(catacombs.experience ?? 0));
}

export { dungeonWeight };
