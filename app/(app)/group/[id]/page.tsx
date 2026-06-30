import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getGroupDashboardData,
  isGroupMember,
  isGroupOwner,
} from "@/lib/groups";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeaderboardTable, type LeaderboardPlayer } from "@/components/dashboard/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import type { PlayerMetrics } from "@/lib/metrics/types";

export default async function GroupDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const member = await isGroupMember(id, session.user.id);
  if (!member) notFound();

  const group = await db.query.groups.findFirst({ where: eq(groups.id, id) });
  if (!group) notFound();

  const owner = await isGroupOwner(id, session.user.id);
  const players = await getGroupDashboardData(id);

  const withSnapshots = players.filter((p) => p.snapshot);
  const avgWeight = withSnapshots.length
    ? withSnapshots.reduce((s, p) => s + (p.snapshot?.senitherWeight ?? 0), 0) / withSnapshots.length
    : 0;
  const totalNetworth = withSnapshots.reduce((s, p) => s + (p.snapshot?.networth ?? 0), 0);
  const avgSA = withSnapshots.length
    ? withSnapshots.reduce((s, p) => s + (p.snapshot?.skillAverage ?? 0), 0) / withSnapshots.length
    : 0;

  const lastSync = players.reduce<Date | null>((latest, p) => {
    if (!p.lastSyncedAt) return latest;
    if (!latest || p.lastSyncedAt > latest) return p.lastSyncedAt;
    return latest;
  }, null);

  const leaderboardPlayers: LeaderboardPlayer[] = players.map((p) => ({
    id: p.id,
    ign: p.ign,
    profileName: p.profileName,
    gameMode: p.gameMode,
    lastSyncedAt: p.lastSyncedAt,
    syncError: p.syncError,
    apiDisabled: p.apiDisabled,
    userName: p.user.name,
    snapshot: p.snapshot
      ? {
          senitherWeight: p.snapshot.senitherWeight,
          skillAverage: p.snapshot.skillAverage,
          catacombsLevel: p.snapshot.catacombsLevel,
          networth: p.snapshot.networth,
          overallCompletionPct: p.snapshot.overallCompletionPct,
          metrics: p.snapshot.metrics as PlayerMetrics,
        }
      : null,
  }));

  const userPlayer = players.find((p) => p.userId === session.user.id);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-emerald-400">
              Skyblock Tracker
            </Link>
            <span className="text-zinc-600">/</span>
            <h1 className="text-lg font-semibold">{group.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!userPlayer?.profileId && (
              <Link href={`/group/${id}/link`}>
                <Button size="sm">Link Account</Button>
              </Link>
            )}
            {owner && (
              <Link href={`/group/${id}/settings`}>
                <Button variant="outline" size="sm">Settings</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Group Avg Weight" value={avgWeight} format="number" />
          <StatCard title="Total Networth" value={totalNetworth} format="number" />
          <StatCard title="Avg Skill Average" value={avgSA} subtitle={`${avgSA.toFixed(2)} / 60`} />
          <StatCard
            title="Last Synced"
            value={lastSync ? new Date(lastSync).toLocaleString() : "Never"}
            subtitle={`${players.length} players tracked`}
          />
        </div>

        <LeaderboardTable players={leaderboardPlayers} groupId={id} />
      </main>
    </div>
  );
}
