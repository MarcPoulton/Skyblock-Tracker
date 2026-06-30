import { inngest } from "@/lib/inngest";
import { db } from "@/db";
import { syncJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { syncAllPlayers } from "@/lib/sync/syncPlayer";
import { cleanupExpiredCache } from "@/lib/hypixel/client";

export const syncJob = inngest.createFunction(
  { id: "skyblock-sync" },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
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

      return {
        success: true,
        processed: result.processed,
        failed: result.failed,
        errors: result.errors,
      };
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

      throw error;
    }
  }
);
