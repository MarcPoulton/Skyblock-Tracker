import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserGroups } from "@/lib/groups";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const groups = await getUserGroups(session.user.id);

  if (groups.length === 1) {
    redirect(`/group/${groups[0].id}`);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-400">
            Skyblock Tracker
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Your Groups</h1>
        <p className="text-zinc-400 mb-8">Create a new group or join friends with an invite code.</p>

        <div className="grid gap-4 mb-8">
          {groups.map((group) => (
            <Link key={group.id} href={`/group/${group.id}`}>
              <Card className="hover:border-emerald-800 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>Role: {group.role}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Group</CardTitle>
              <CardDescription>Start tracking with friends</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/onboarding/create">
                <Button className="w-full">Create New Group</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Join Group</CardTitle>
              <CardDescription>Enter an invite code</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/onboarding/join">
                <Button variant="outline" className="w-full">Join with Code</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
