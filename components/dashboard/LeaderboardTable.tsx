"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber, formatPercent, timeAgo, getSkyCryptUrl, getGameModeColor } from "@/lib/utils";
import type { PlayerMetrics } from "@/lib/metrics/types";

export interface LeaderboardPlayer {
  id: string;
  ign: string;
  profileName: string | null;
  gameMode: string | null;
  lastSyncedAt: Date | null;
  syncError: string | null;
  apiDisabled: boolean;
  userName: string;
  snapshot: {
    senitherWeight: number;
    skillAverage: number;
    catacombsLevel: number;
    networth: number;
    overallCompletionPct: number;
    metrics: PlayerMetrics;
  } | null;
}

type SortKey = "senitherWeight" | "skillAverage" | "catacombsLevel" | "networth" | "overallCompletionPct" | "ign";
type CategoryTab = "overview" | "skills" | "slayer" | "dungeons" | "collections" | "networth";

interface LeaderboardTableProps {
  players: LeaderboardPlayer[];
  groupId: string;
}

export function LeaderboardTable({ players, groupId }: LeaderboardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("senitherWeight");
  const [sortAsc, setSortAsc] = useState(false);
  const [category, setCategory] = useState<CategoryTab>("overview");

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      if (sortKey === "ign") {
        return sortAsc ? a.ign.localeCompare(b.ign) : b.ign.localeCompare(a.ign);
      }
      const aVal = a.snapshot?.[sortKey] ?? 0;
      const bVal = b.snapshot?.[sortKey] ?? 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [players, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function getCategoryValue(player: LeaderboardPlayer): number {
    const m = player.snapshot?.metrics;
    if (!m) return 0;
    switch (category) {
      case "skills": return m.skills.percent;
      case "slayer": return m.slayer.percent;
      case "dungeons": return m.dungeons.percent;
      case "collections": return m.collections.percent;
      case "networth": return m.networth.percent;
      default: return player.snapshot?.overallCompletionPct ?? 0;
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="slayer">Slayer</TabsTrigger>
          <TabsTrigger value="dungeons">Dungeons</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="networth">Networth</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">#</th>
              <SortHeader label="Player" sortKey="ign" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <SortHeader label="Weight" sortKey="senitherWeight" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <SortHeader label="SA" sortKey="skillAverage" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <SortHeader label="Cata" sortKey="catacombsLevel" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <SortHeader label="Networth" sortKey="networth" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <SortHeader label="Overall" sortKey="overallCompletionPct" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Synced</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr key={player.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {player.apiDisabled || player.syncError ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : null}
                    <div>
                      <Link
                        href={`/group/${groupId}/player/${player.id}`}
                        className="font-medium text-emerald-400 hover:underline"
                      >
                        {player.ign}
                      </Link>
                      <div className="text-xs text-zinc-500">
                        {player.profileName ?? "No profile"} ·{" "}
                        <span className={getGameModeColor(player.gameMode)}>{player.gameMode ?? "Unknown"}</span>
                      </div>
                    </div>
                    <a href={getSkyCryptUrl(player.ign)} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatNumber(player.snapshot?.senitherWeight ?? 0)}</td>
                <td className="px-4 py-3 tabular-nums">{(player.snapshot?.skillAverage ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums">{(player.snapshot?.catacombsLevel ?? 0).toFixed(0)}</td>
                <td className="px-4 py-3 tabular-nums">{formatNumber(player.snapshot?.networth ?? 0)}</td>
                <td className="px-4 py-3 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <Progress value={category === "overview" ? (player.snapshot?.overallCompletionPct ?? 0) : getCategoryValue(player)} className="flex-1" />
                    <span className="text-xs text-zinc-400 w-12 text-right">
                      {formatPercent(category === "overview" ? (player.snapshot?.overallCompletionPct ?? 0) : getCategoryValue(player))}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{timeAgo(player.lastSyncedAt)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No players linked yet. Link your Minecraft account to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  asc,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th className="px-4 py-3 text-left">
      <Button variant="ghost" size="sm" className="h-auto p-0 text-zinc-400 hover:text-zinc-200" onClick={() => onSort(sortKey)}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ml-1 ${current === sortKey ? "text-emerald-400" : ""}`} />
        {current === sortKey && <span className="sr-only">{asc ? "ascending" : "descending"}</span>}
      </Button>
    </th>
  );
}
