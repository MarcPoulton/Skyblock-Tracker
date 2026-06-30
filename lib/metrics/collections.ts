import type { CategoryMetric, MetricBreakdownItem, StaticResources } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeCollections(
  memberData: Record<string, any>,
  staticResources: StaticResources | null,
): CategoryMetric {
  const playerCollections = memberData.collection ?? {};
  const collectionDefs = staticResources?.collections ?? {};

  const breakdown: MetricBreakdownItem[] = [];
  let completedTiers = 0;
  let totalTiers = 0;

  for (const [itemId, def] of Object.entries(collectionDefs)) {
    const tiers = def.tiers ?? [];
    if (tiers.length === 0) continue;

    const count = Number(playerCollections[itemId]?.collection ?? playerCollections[itemId] ?? 0);
    let tierReached = 0;
    for (let i = 0; i < tiers.length; i++) {
      if (count >= tiers[i]) tierReached = i + 1;
      else break;
    }

    totalTiers += tiers.length;
    completedTiers += tierReached;

    if (tierReached < tiers.length) {
      breakdown.push({
        id: itemId,
        name: def.name ?? itemId,
        current: count,
        max: tiers[tiers.length - 1],
        percent: (tierReached / tiers.length) * 100,
        missing: `Tier ${tierReached + 1} (${tiers[tierReached]?.toLocaleString()} needed)`,
      });
    }
  }

  breakdown.sort((a, b) => a.percent - b.percent);

  return {
    current: completedTiers,
    max: Math.max(totalTiers, 1),
    percent: totalTiers > 0 ? (completedTiers / totalTiers) * 100 : 0,
    breakdown: breakdown.slice(0, 50),
    missing: breakdown.slice(0, 10).map((b) => b.name),
  };
}
