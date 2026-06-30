import { getSession } from "@/lib/session";
import { isGroupOwner } from "@/lib/groups";
import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getSession();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id: groupId, userId } = await params;
  const owner = await isGroupOwner(groupId, session.user.id);
  if (!owner) return errorResponse("Forbidden", 403);

  if (userId === session.user.id) {
    return errorResponse("Cannot remove yourself as owner", 400);
  }

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

  return jsonResponse({ success: true });
}