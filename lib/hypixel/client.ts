import { CoreClient } from "@skyblock-ts/core";
import { db } from "@/db";
import { hypixelCache } from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import type { StaticResources } from "@/lib/metrics/types";

const API_KEY = process.env.HYPIXEL_API_KEY;

let client: CoreClient | null = null;

function getClient(): CoreClient {
  if (!API_KEY) {
    throw new Error("HYPIXEL_API_KEY is not configured");
  }
  if (!client) {
    client = new CoreClient({ APIKey: API_KEY });
  }
  return client;
}

let rateLimitRemaining = 120;
let rateLimitReset = Date.now();

export function getRateLimitStatus() {
  return { remaining: rateLimitRemaining, resetAt: rateLimitReset };
}

async function fetchWithCache<T>(
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = new Date();
  const cached = await db.query.hypixelCache.findFirst({
    where: eq(hypixelCache.cacheKey, cacheKey),
  });

  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  if (rateLimitRemaining <= 0 && Date.now() < rateLimitReset) {
    const waitMs = rateLimitReset - Date.now();
    await new Promise((r) => setTimeout(r, Math.min(waitMs, 5000)));
  }

  const data = await fetcher();
  const expiresAt = new Date(Date.now() + ttlMs);

  await db
    .insert(hypixelCache)
    .values({
      id: crypto.randomUUID(),
      cacheKey,
      data: data as object,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: hypixelCache.cacheKey,
      set: { data: data as object, expiresAt },
    });

  return data;
}

export async function lookupUuid(ign: string): Promise<string | null> {
  const normalized = ign.trim();
  const cacheKey = `uuid:${normalized.toLowerCase()}`;

  return fetchWithCache(cacheKey, 1000 * 60 * 60 * 24 * 30, async () => {
    const res = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(normalized)}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Mojang API error: ${res.status}`);
    const data = (await res.json()) as { id: string };
    return data.id;
  });
}

export async function fetchProfiles(uuid: string) {
  const cacheKey = `profiles:${uuid}`;
  return fetchWithCache(cacheKey, 1000 * 60 * 30, async () => {
    const c = getClient();
    return c.profile.profilesByPlayer(uuid);
  });
}

export async function fetchMuseum(profileId: string) {
  const cacheKey = `museum:${profileId}`;
  return fetchWithCache(cacheKey, 1000 * 60 * 30, async () => {
    const c = getClient();
    const response = await c.profile.museumDataByProfileID(profileId);
    return response;
  });
}

export async function fetchGarden(profileId: string) {
  const cacheKey = `garden:${profileId}`;
  return fetchWithCache(cacheKey, 1000 * 60 * 30, async () => {
    const c = getClient();
    try {
      const response = await c.profile.gardenDataByProfileID(profileId);
      return response;
    } catch {
      return null;
    }
  });
}

let staticResourcesCache: StaticResources | null = null;

export async function getStaticResources(): Promise<StaticResources> {
  if (staticResourcesCache) {
    const age = Date.now() - new Date(staticResourcesCache.cachedAt).getTime();
    if (age < 1000 * 60 * 60 * 24) return staticResourcesCache;
  }

  const cacheKey = "static:resources";
  const data = await fetchWithCache(cacheKey, 1000 * 60 * 60 * 24, async () => {
    const c = getClient();
    const [collectionsRes, skillsRes] = await Promise.all([
      c.data.collections(),
      c.data.skills(),
    ]);

    const collections: StaticResources["collections"] = {};
    const collectionsData = collectionsRes.collections ?? {};
    for (const [id, item] of Object.entries(collectionsData)) {
      if ("items" in item && item.items) {
        for (const [itemId, subItem] of Object.entries(item.items as Record<string, { name?: string; tiers?: { amountRequired: number }[]; maxTiers?: number }>)) {
          const tiers = (subItem.tiers ?? []).map((t) => t.amountRequired);
          collections[itemId] = {
            name: subItem.name ?? itemId,
            tiers,
          };
        }
      } else {
        const collectionItem = item as { name?: string; tiers?: { amountRequired: number }[]; maxTiers?: number };
        const tiers = (collectionItem.tiers ?? []).map((t) => t.amountRequired);
        collections[id] = {
          name: collectionItem.name ?? id,
          tiers: tiers.length > 0 ? tiers : (collectionItem.maxTiers ? [collectionItem.maxTiers] : []),
        };
      }
    }

    const skillsMap: StaticResources["skills"] = {};
    for (const [id, skill] of Object.entries(skillsRes.skills ?? {})) {
      skillsMap[id] = (skill.levels ?? []).map((l) => ({
        level: l.level,
        totalExp: l.totalExpRequired,
      }));
    }

    return {
      collections,
      skills: skillsMap,
      cachedAt: new Date().toISOString(),
    };
  });

  staticResourcesCache = data;
  return data;
}

export async function cleanupExpiredCache() {
  await db.delete(hypixelCache).where(lt(hypixelCache.expiresAt, new Date()));
}

export function formatUuid(uuid: string): string {
  if (uuid.includes("-")) return uuid;
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}

export function stripUuid(uuid: string): string {
  return uuid.replace(/-/g, "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pickProfile(profiles: any[], profileId?: string | null) {
  if (!profiles.length) return null;
  if (profileId) {
    const found = profiles.find((p) => p.profile_id === profileId);
    if (found) return found;
  }
  return profiles.reduce((best, p) => {
    const bestExp = best.members ? Object.values(best.members)[0] : null;
    const pExp = p.members ? Object.values(p.members)[0] : null;
    const bestLevel = (bestExp as { leveling?: { experience?: number } })?.leveling?.experience ?? 0;
    const pLevel = (pExp as { leveling?: { experience?: number } })?.leveling?.experience ?? 0;
    return pLevel > bestLevel ? p : best;
  });
}

export function getMemberData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any,
  uuid: string,
): Record<string, unknown> | null {
  const stripped = stripUuid(uuid);
  const members = profile.members ?? {};
  return members[stripped] ?? members[formatUuid(uuid)] ?? members[uuid] ?? null;
}

export function getGameMode(profile: { game_mode?: string; banking?: unknown }): string {
  if (profile.game_mode === "ironman") return "Ironman";
  if (profile.game_mode === "bingo") return "Bingo";
  if (profile.game_mode === "island") return "Stranded";
  if (profile.banking) return "Co-op";
  return "Normal";
}

export function isApiDisabled(profiles: unknown): boolean {
  if (!profiles) return true;
  if (Array.isArray(profiles) && profiles.length === 0) return true;
  return false;
}
