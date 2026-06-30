"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileOption {
  profileId: string;
  name: string;
  gameMode: string;
}

export default function LinkAccountPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [ign, setIgn] = useState("");
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [uuid, setUuid] = useState("");
  const [step, setStep] = useState<"ign" | "profile">("ign");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookupProfiles(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/players/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ign, groupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");

      setProfiles(data.profiles);
      setUuid(data.uuid);
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function confirmProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProfile) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/players/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ign, groupId, profileId: selectedProfile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Link failed");

      router.push(`/group/${groupId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Link Minecraft Account</CardTitle>
          <CardDescription>
            Enter your IGN and select which Skyblock profile to track
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "ign" ? (
            <form onSubmit={lookupProfiles} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ign">Minecraft Username</Label>
                <Input
                  id="ign"
                  value={ign}
                  onChange={(e) => setIgn(e.target.value)}
                  placeholder="Steve"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Link href={`/group/${groupId}`} className="flex-1">
                  <Button variant="outline" className="w-full" type="button">Cancel</Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Looking up..." : "Find Profiles"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={confirmProfile} className="space-y-4">
              <p className="text-sm text-zinc-400">
                Found {profiles.length} profile(s) for <span className="text-emerald-400">{ign}</span>
              </p>
              <div className="space-y-2">
                <Label>Select Profile</Label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.profileId} value={p.profileId}>
                        {p.name} ({p.gameMode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" type="button" onClick={() => setStep("ign")}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !selectedProfile}>
                  {loading ? "Linking..." : "Confirm"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
