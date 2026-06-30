import { getSession } from "@/lib/session";
import { isGroupOwner } from "@/lib/groups";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id: groupId } = await params;
  const owner = await isGroupOwner(groupId, session.user.id);
  if (!owner) return errorResponse("Forbidden", 403);

  const body = await request.json();
  const name = body.name?.trim();

  if (!name || name.length < 2) {
    return errorResponse("Group name must be at least 2 characters");
  }

  await db
    .update(groups)
    .set({ name, updatedAt: new Date() })
    .where(eq(groups.id, groupId));

  return jsonResponse({ success: true });
}