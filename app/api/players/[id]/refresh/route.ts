import { getSession } from "@/lib/session";
import { syncPlayer } from "@/lib/sync/syncPlayer";
import { db } from "@/db";
import { linkedPlayers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

const COOLDOWN_MS = 15 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id: linkedPlayerId } = await params;

  const player = await db.query.linkedPlayers.findFirst({
    where: eq(linkedPlayers.id, linkedPlayerId),
  });

  if (!player) return errorResponse("Player not found", 404);
  if (player.userId !== session.user.id) return errorResponse("Forbidden", 403);

  const lastRefresh = player.lastManualRefreshAt ?? player.lastSyncedAt;
  if (lastRefresh && Date.now() - new Date(lastRefresh).getTime() < COOLDOWN_MS) {
    return errorResponse("Manual refresh is on cooldown. Wait 15 minutes between refreshes.", 429);
  }

  const result = await syncPlayer(linkedPlayerId);

  if (result.success) {
    await db
      .update(linkedPlayers)
      .set({ lastManualRefreshAt: new Date() })
      .where(eq(linkedPlayers.id, linkedPlayerId));
    return jsonResponse({ success: true });
  }

  return errorResponse(result.error ?? "Sync failed", 500);
}