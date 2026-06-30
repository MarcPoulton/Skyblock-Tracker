import { db } from "@/db";
import { groups, groupMembers, linkedPlayers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createGroup(userId: string, name: string) {
  const groupId = crypto.randomUUID();
  const inviteCode = generateInviteCode();

  await db.insert(groups).values({
    id: groupId,
    name,
    ownerId: userId,
    inviteCode,
  });

  await db.insert(groupMembers).values({
    id: crypto.randomUUID(),
    groupId,
    userId,
    role: "owner",
  });

  return { id: groupId, inviteCode };
}

export async function joinGroup(userId: string, inviteCode: string) {
  const group = await db.query.groups.findFirst({
    where: eq(groups.inviteCode, inviteCode.toUpperCase()),
  });

  if (!group) {
    throw new Error("Invalid invite code");
  }

  const existing = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, group.id),
      eq(groupMembers.userId, userId),
    ),
  });

  if (existing) {
    return group;
  }

  await db.insert(groupMembers).values({
    id: crypto.randomUUID(),
    groupId: group.id,
    userId,
    role: "member",
  });

  return group;
}

export async function getUserGroups(userId: string) {
  const memberships = await db.query.groupMembers.findMany({
    where: eq(groupMembers.userId, userId),
    with: { group: true },
  });
  return memberships.map((m) => ({ ...m.group, role: m.role }));
}

export async function isGroupMember(groupId: string, userId: string) {
  const member = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, userId),
    ),
  });
  return !!member;
}

export async function isGroupOwner(groupId: string, userId: string) {
  const member = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, userId),
      eq(groupMembers.role, "owner"),
    ),
  });
  return !!member;
}

export async function regenerateInviteCode(groupId: string) {
  const newCode = generateInviteCode();
  await db
    .update(groups)
    .set({ inviteCode: newCode, updatedAt: new Date() })
    .where(eq(groups.id, groupId));
  return newCode;
}

export async function getGroupMembers(groupId: string) {
  return db.query.groupMembers.findMany({
    where: eq(groupMembers.groupId, groupId),
    with: { user: true },
  });
}

export async function removeMember(groupId: string, memberUserId: string) {
  await db
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, memberUserId),
        eq(groupMembers.role, "member"),
      ),
    );
}

export async function getGroupDashboardData(groupId: string) {
  const players = await db.query.linkedPlayers.findMany({
    where: eq(linkedPlayers.groupId, groupId),
    with: {
      user: true,
      snapshot: true,
    },
  });

  return players;
}

export async function getPlayerDetail(linkedPlayerId: string) {
  return db.query.linkedPlayers.findFirst({
    where: eq(linkedPlayers.id, linkedPlayerId),
    with: {
      user: true,
      snapshot: true,
    },
  });
}
