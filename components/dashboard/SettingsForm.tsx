"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface SettingsFormProps {
  groupId: string;
  groupName: string;
  inviteCode: string;
  members: Member[];
}

export function SettingsForm({ groupId, groupName, inviteCode, members }: SettingsFormProps) {
  const [name, setName] = useState(groupName);
  const [code, setCode] = useState(inviteCode);
  const [memberList, setMemberList] = useState(members);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${code}`
    : `/join/${code}`;

  async function updateName(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    setMessage(res.ok ? "Name updated" : "Failed to update name");
  }

  async function regenerateCode() {
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/invite`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setCode(data.inviteCode);
      setMessage("Invite code regenerated");
    }
  }

  async function removeMember(userId: string) {
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      setMemberList((m) => m.filter((x) => x.userId !== userId));
      setMessage("Member removed");
    }
  }

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl);
    setMessage("Invite link copied!");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Name</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateName} className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" disabled={loading}>Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite Link</CardTitle>
          <CardDescription>Share this link with friends to join</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={inviteUrl} readOnly className="font-mono text-xs" />
            <Button variant="outline" onClick={copyInvite}>Copy</Button>
          </div>
          <p className="text-sm text-zinc-500">Code: <span className="font-mono text-zinc-300">{code}</span></p>
          <Button variant="secondary" onClick={regenerateCode} disabled={loading}>
            Regenerate Code
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {memberList.map((m) => (
              <li key={m.userId} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-zinc-500">{m.email} · {m.role}</div>
                </div>
                {m.role === "member" && (
                  <Button variant="destructive" size="sm" onClick={() => removeMember(m.userId)} disabled={loading}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-emerald-400">{message}</p>}
    </div>
  );
}
