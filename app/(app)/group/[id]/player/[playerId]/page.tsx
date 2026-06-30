import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { eq, and, gte, desc } from "drizzle-orm";
import { subDays } from "date-fns";
import { getSession } from "@/lib/session";
import { getPlayerDetail, isGroupMember } from "@/lib/groups";
import { db } from "@/db";
import { snapshotHistory } from "@/db/schema";
import { CategoryPanel } from "@/components/player/CategoryPanel";
import { TrendCharts } from "@/components/player/TrendCharts";
import { RefreshButton } from "@/components/dashboard/RefreshButton";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { formatNumber, getSkyCryptUrl, getGameModeColor } from "@/lib/utils";
import type { PlayerMetrics } from "@/lib/metrics/types";
import { ExternalLink, ArrowLeft } from "lucide-react";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string; playerId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: groupId, playerId } = await params;
  const member = await isGroupMember(groupId, session.user.id);
  if (!member) notFound();

  const player = await getPlayerDetail(playerId);
  if (!player || player.groupId !== groupId) notFound();

  const metrics = player.snapshot?.metrics as PlayerMetrics | undefined;
  const history = await db.query.snapshotHistory.findMany({
    where: and(
      eq(snapshotHistory.linkedPlayerId, playerId),
      gte(snapshotHistory.recordedAt, subDays(new Date(), 30)),
    ),
    orderBy: [desc(snapshotHistory.recordedAt)],
    limit: 100,
  });

  const isOwner = player.userId === session.user.id;

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/group/${groupId}`} className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {player.ign}
                <a href={getSkyCryptUrl(player.ign)} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </h1>
              <p className="text-zinc-400 mt-1">
                {player.profileName ?? "Unknown profile"} ·{" "}
                <span className={getGameModeColor(player.gameMode)}>{player.gameMode ?? "Unknown"}</span>
                {" · "}{player.user.name}
              </p>
              {metrics && (
                <p className="text-sm text-zinc-500 mt-1">
                  SkyBlock Level {metrics.skyblockLevel.current} · Weight {formatNumber(metrics.senitherWeight)}
                </p>
              )}
            </div>
            {isOwner && (
              <RefreshButton
                linkedPlayerId={player.id}
                lastSyncedAt={player.lastSyncedAt}
                lastManualRefreshAt={player.lastManualRefreshAt}
                syncError={player.syncError}
                apiDisabled={player.apiDisabled}
              />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {!metrics ? (
          <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-6 text-center">
            <p className="text-amber-400 font-medium">
              {player.apiDisabled
                ? "API settings are disabled in-game"
                : player.syncError ?? "No data synced yet"}
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              {player.apiDisabled
                ? "Enable API in SkyBlock settings (Settings → API) and refresh."
                : "Data will appear after the next sync cycle."}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Overall Progress</h2>
              <ProgressBar
                label="Maxing Completion"
                percent={metrics.overallCompletionPct}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <MiniStat label="Weight" value={formatNumber(metrics.senitherWeight)} />
                <MiniStat label="Skill Avg" value={metrics.skillAverage.toFixed(2)} />
                <MiniStat label="Catacombs" value={String(Math.floor(metrics.catacombsLevel))} />
                <MiniStat label="Networth" value={formatNumber(metrics.networthTotal)} />
              </div>
            </div>

            <TrendCharts history={history.reverse()} />

            <div className="grid md:grid-cols-2 gap-4">
              <CategoryPanel title="Skills" metric={metrics.skills} />
              <CategoryPanel title="Slayer" metric={metrics.slayer} />
              <CategoryPanel title="Dungeons" metric={metrics.dungeons} />
              <CategoryPanel title="Collections" metric={metrics.collections} />
              <CategoryPanel title="Minions" metric={metrics.minions} />
              <CategoryPanel title="Pets" metric={metrics.pets} />
              <CategoryPanel title="Bestiary" metric={metrics.bestiary} />
              <CategoryPanel title="SkyBlock Level" metric={metrics.skyblockLevel} />
              <CategoryPanel
                title="Networth"
                metric={metrics.networth}
                valueFormatter={formatNumber}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold text-emerald-400">{value}</div>
    </div>
  );
}
