import { type NextRequest } from "next/server";
import { db } from "@/db";
import { syncJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { syncAllPlayers } from "@/lib/sync/syncPlayer";
import { cleanupExpiredCache } from "@/lib/hypixel/client";
import { jsonResponse, errorResponse, verifyCronSecret } from "@/lib/api-utils";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  const jobId = crypto.randomUUID();

  await db.insert(syncJobs).values({
    id: jobId,
    status: "running",
    startedAt: new Date(),
  });

  try {
    await cleanupExpiredCache();
    const result = await syncAllPlayers();

    await db
      .update(syncJobs)
      .set({
        status: "completed",
        playersProcessed: result.processed,
        playersFailed: result.failed,
        completedAt: new Date(),
        error: result.errors.length > 0 ? result.errors.join("; ") : null,
      })
      .where(eq(syncJobs.id, jobId));

    return jsonResponse({
      success: true,
      processed: result.processed,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await db
      .update(syncJobs)
      .set({
        status: "failed",
        error: message,
        completedAt: new Date(),
      })
      .where(eq(syncJobs.id, jobId));

    return errorResponse(message, 500);
  }
}
