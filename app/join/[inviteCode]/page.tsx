import { redirect } from "next/navigation";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const group = await db.query.groups.findFirst({
    where: eq(groups.inviteCode, inviteCode.toUpperCase()),
  });

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Invalid Invite</h1>
          <p className="text-zinc-400">This invite code doesn't exist or has expired.</p>
        </div>
      </div>
    );
  }

  redirect(`/onboarding/join?code=${inviteCode}`);
}