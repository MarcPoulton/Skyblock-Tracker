import { db } from "@/db";
import { linkedPlayers, profileSnapshots, snapshotHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  fetchProfiles,
  fetchMuseum,
  getMemberData,
  getStaticResources,
  isApiDisabled,
  stripUuid,
} from "@/lib/hypixel/client";
import { computeAllMetrics } from "@/lib/metrics";
import { calculateNetworth } from "@/lib/networth/calculate";

export interface SyncResult {
  success: boolean;
  error?: string;
  apiDisabled?: boolean;
}

export async function syncPlayer(linkedPlayerId: string): Promise<SyncResult> {
  const player = await db.query.linkedPlayers.findFirst({
    where: eq(linkedPlayers.id, linkedPlayerId),
  });

  if (!player) {
    return { success: false, error: "Player not found" };
  }

  if (!player.profileId) {
    return { success: false, error: "No profile selected" };
  }

  try {
    const profilesResponse = await fetchProfiles(player.uuid);
    const profiles = profilesResponse.profiles ?? [];

    if (isApiDisabled(profiles)) {
      await db
        .update(linkedPlayers)
        .set({
          apiDisabled: true,
          syncError: "API settings disabled in-game. Enable in SkyBlock settings.",
          updatedAt: new Date(),
        })
        .where(eq(linkedPlayers.id, linkedPlayerId));
      return { success: false, error: "API disabled", apiDisabled: true };
    }

    const profile = profiles.find((p) => p.profile_id === player.profileId);
    if (!profile) {
      await db
        .update(linkedPlayers)
        .set({
          syncError: "Selected profile not found",
          updatedAt: new Date(),
        })
        .where(eq(linkedPlayers.id, linkedPlayerId));
      return { success: false, error: "Profile not found" };
    }

    const memberData = getMemberData(profile, player.uuid);
    if (!memberData) {
      await db
        .update(linkedPlayers)
        .set({
          syncError: "Member data not found in profile",
          updatedAt: new Date(),
        })
        .where(eq(linkedPlayers.id, linkedPlayerId));
      return { success: false, error: "Member data not found" };
    }

    const [staticResources, museumResponse] = await Promise.all([
      getStaticResources(),
      fetchMuseum(player.profileId).catch(() => null),
    ]);

    const museumMembers = (museumResponse as { profile?: Record<string, unknown> } | null)?.profile ?? {};
    const museumData =
      museumMembers[stripUuid(player.uuid)] ??
      museumMembers[player.uuid] ??
      null;

    const bankBalance = Number((profile as { banking?: { balance?: number } }).banking?.balance ?? 0);

    const { total, nonCosmetic } = await calculateNetworth(
      memberData as Record<string, unknown>,
      museumData as Record<string, unknown> | null,
      bankBalance,
    );

    const metrics = computeAllMetrics(
      memberData as Record<string, unknown>,
      staticResources,
      total,
      nonCosmetic,
    );

    const snapshotId = crypto.randomUUID();
    const now = new Date();

    await db
      .insert(profileSnapshots)
      .values({
        id: snapshotId,
        linkedPlayerId,
        senitherWeight: metrics.senitherWeight,
        skillAverage: metrics.skillAverage,
        catacombsLevel: metrics.catacombsLevel,
        networth: metrics.networthTotal,
        nonCosmeticNetworth: metrics.nonCosmeticNetworth,
        overallCompletionPct: metrics.overallCompletionPct,
        skyblockLevel: metrics.skyblockLevel.current,
        metrics,
        rawProfile: profile as object,
        syncedAt: now,
      })
      .onConflictDoUpdate({
        target: profileSnapshots.linkedPlayerId,
        set: {
          senitherWeight: metrics.senitherWeight,
          skillAverage: metrics.skillAverage,
          catacombsLevel: metrics.catacombsLevel,
          networth: metrics.networthTotal,
          nonCosmeticNetworth: metrics.nonCosmeticNetworth,
          overallCompletionPct: metrics.overallCompletionPct,
          skyblockLevel: metrics.skyblockLevel.current,
          metrics,
          rawProfile: profile as object,
          syncedAt: now,
        },
      });

    await db.insert(snapshotHistory).values({
      id: crypto.randomUUID(),
      linkedPlayerId,
      senitherWeight: metrics.senitherWeight,
      skillAverage: metrics.skillAverage,
      networth: metrics.networthTotal,
      overallCompletionPct: metrics.overallCompletionPct,
      recordedAt: now,
    });

    await db
      .update(linkedPlayers)
      .set({
        lastSyncedAt: now,
        syncError: null,
        apiDisabled: false,
        profileName: (profile as { cute_name?: string }).cute_name ?? player.profileName,
        updatedAt: now,
      })
      .where(eq(linkedPlayers.id, linkedPlayerId));

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    await db
      .update(linkedPlayers)
      .set({
        syncError: message,
        updatedAt: new Date(),
      })
      .where(eq(linkedPlayers.id, linkedPlayerId));
    return { success: false, error: message };
  }
}

export async function syncAllPlayers(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const players = await db.query.linkedPlayers.findMany({
    where: (lp, { isNotNull }) => isNotNull(lp.profileId),
  });

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const player of players) {
    const result = await syncPlayer(player.id);
    if (result.success) {
      processed++;
    } else {
      failed++;
      errors.push(`${player.ign}: ${result.error}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  return { processed, failed, errors };
}
