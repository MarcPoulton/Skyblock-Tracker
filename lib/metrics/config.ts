export const SKILL_NAMES = [
  "farming",
  "mining",
  "combat",
  "foraging",
  "fishing",
  "enchanting",
  "alchemy",
  "taming",
  "carpentry",
  "runecrafting",
  "social",
] as const;

export type SkillName = (typeof SKILL_NAMES)[number];

export const SLAYER_BOSSES = [
  "zombie",
  "spider",
  "wolf",
  "enderman",
  "blaze",
] as const;

export type SlayerBoss = (typeof SLAYER_BOSSES)[number];

export const SLAYER_DISPLAY: Record<SlayerBoss, string> = {
  zombie: "Revenant Horror",
  spider: "Tarantula Broodfather",
  wolf: "Sven Packmaster",
  enderman: "Voidgloom Seraph",
  blaze: "Inferno Demonlord",
};

export const DUNGEON_CLASSES = [
  "healer",
  "mage",
  "berserk",
  "archer",
  "tank",
] as const;

export type DungeonClass = (typeof DUNGEON_CLASSES)[number];

export const MAX_SKILL_LEVEL = 60;
export const MAX_SLAYER_TIER = 9;
export const MAX_CATACOMBS_LEVEL = 50;
export const MAX_CLASS_LEVEL = 50;
export const MAX_SKYBLOCK_LEVEL = 440;

export const CATEGORY_WEIGHTS = {
  skills: 3,
  slayer: 2.5,
  dungeons: 2.5,
  collections: 2,
  weight: 1,
  networth: 0.5,
  minions: 1,
  pets: 1,
  bestiary: 1.5,
  skyblockLevel: 1,
} as const;

export const MANUAL_REFRESH_COOLDOWN_MS = 15 * 60 * 1000;
export const SYNC_INTERVAL_MINUTES = 45;

export const RARITY_WEIGHTS: Record<string, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 5,
  LEGENDARY: 8,
  MYTHIC: 12,
};

export const MINION_MAX_UNIQUE = 695;
