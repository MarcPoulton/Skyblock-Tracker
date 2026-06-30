"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { useState } from "react";

interface RefreshButtonProps {
  linkedPlayerId: string;
  lastSyncedAt: Date | null;
  lastManualRefreshAt: Date | null;
  syncError: string | null;
  apiDisabled: boolean;
}

const COOLDOWN_MS = 15 * 60 * 1000;

export function RefreshButton({
  linkedPlayerId,
  lastSyncedAt,
  lastManualRefreshAt,
  syncError,
  apiDisabled,
}: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastRefresh = lastManualRefreshAt ?? lastSyncedAt;
  const cooldownRemaining = lastRefresh
    ? Math.max(0, COOLDOWN_MS - (Date.now() - new Date(lastRefresh).getTime()))
    : 0;
  const onCooldown = cooldownRemaining > 0;

  async function handleRefresh() {
    if (onCooldown || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/players/${linkedPlayerId}/refresh`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refresh failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={loading || onCooldown || apiDisabled}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing..." : onCooldown ? `Cooldown (${Math.ceil(cooldownRemaining / 60000)}m)` : "Refresh Now"}
      </Button>
      <span className="text-xs text-zinc-500">Last synced: {timeAgo(lastSyncedAt)}</span>
      {(error || syncError) && (
        <span className="text-xs text-amber-500">{error ?? syncError}</span>
      )}
      {apiDisabled && (
        <span className="text-xs text-amber-500">API disabled in-game. Enable in SkyBlock settings.</span>
      )}
    </div>
  );
}
