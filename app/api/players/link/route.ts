import { db } from "@/db";
import { linkedPlayers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { isGroupMember } from "@/lib/groups";
import {
  lookupUuid,
  fetchProfiles,
  getGameMode,
  formatUuid,
} from "@/lib/hypixel/client";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { ign, groupId, profileId } = body;

  if (!ign?.trim() || !groupId) {
    return errorResponse("IGN and group ID are required");
  }

  const isMember = await isGroupMember(groupId, session.user.id);
  if (!isMember) return errorResponse("Forbidden", 403);

  const uuid = await lookupUuid(ign.trim());
  if (!uuid) return errorResponse("Minecraft player not found", 404);

  const formattedUuid = formatUuid(uuid);

  if (!profileId) {
    const profilesResponse = await fetchProfiles(formattedUuid);
    const profiles = profilesResponse.profiles ?? [];

    if (profiles.length === 0) {
      return errorResponse("No Skyblock profiles found. Enable API in-game.", 404);
    }

    return jsonResponse({
      uuid: formattedUuid,
      profiles: profiles.map((p) => ({
        profileId: p.profile_id,
        name: (p as { cute_name?: string }).cute_name ?? "Unknown",
        gameMode: getGameMode(p as { game_mode?: string; banking?: unknown }),
      })),
    });
  }

  const profilesResponse = await fetchProfiles(formattedUuid);
  const profile = profilesResponse.profiles?.find((p) => p.profile_id === profileId);

  if (!profile) return errorResponse("Profile not found", 404);

  const existing = await db.query.linkedPlayers.findFirst({
    where: and(
      eq(linkedPlayers.groupId, groupId),
      eq(linkedPlayers.userId, session.user.id),
    ),
  });

  const playerData = {
    ign: ign.trim(),
    uuid: formattedUuid,
    profileId,
    profileName: (profile as { cute_name?: string }).cute_name ?? null,
    gameMode: getGameMode(profile as { game_mode?: string; banking?: unknown }),
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(linkedPlayers).set(playerData).where(eq(linkedPlayers.id, existing.id));
    return jsonResponse({ id: existing.id, ...playerData });
  }

  const id = crypto.randomUUID();
  await db.insert(linkedPlayers).values({
    id,
    groupId,
    userId: session.user.id,
    ...playerData,
  });

  return jsonResponse({ id, ...playerData }, 201);
}
