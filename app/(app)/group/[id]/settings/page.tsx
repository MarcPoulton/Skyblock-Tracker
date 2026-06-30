import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getGroupMembers, isGroupOwner } from "@/lib/groups";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { ArrowLeft } from "lucide-react";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const owner = await isGroupOwner(id, session.user.id);
  if (!owner) notFound();

  const group = await db.query.groups.findFirst({ where: eq(groups.id, id) });
  if (!group) notFound();

  const members = await getGroupMembers(id);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/group/${id}`} className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold">Group Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <SettingsForm
          groupId={id}
          groupName={group.name}
          inviteCode={group.inviteCode}
          members={members.map((m) => ({
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
          }))}
        />
      </main>
    </div>
  );
}
