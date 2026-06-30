export interface MetricBreakdownItem {
  id: string;
  name: string;
  current: number;
  max: number;
  percent: number;
  missing?: string;
}

export interface CategoryMetric {
  current: number;
  max: number;
  percent: number;
  breakdown: MetricBreakdownItem[];
  missing: string[];
  weight?: number;
}

export interface PlayerMetrics {
  skills: CategoryMetric;
  slayer: CategoryMetric;
  dungeons: CategoryMetric;
  collections: CategoryMetric;
  weight: CategoryMetric;
  networth: CategoryMetric;
  minions: CategoryMetric;
  pets: CategoryMetric;
  bestiary: CategoryMetric;
  skyblockLevel: CategoryMetric;
  overallCompletionPct: number;
  skillAverage: number;
  senitherWeight: number;
  catacombsLevel: number;
  networthTotal: number;
  nonCosmeticNetworth: number;
}

export interface CollectionTier {
  itemId: string;
  name: string;
  tiers: number[];
}

export interface SkillThreshold {
  level: number;
  totalExp: number;
}

export interface StaticResources {
  collections: Record<string, { name: string; tiers: number[] }>;
  skills: Record<string, SkillThreshold[]>;
  cachedAt: string;
}
