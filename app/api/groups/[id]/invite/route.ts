import { getSession } from "@/lib/session";
import { isGroupOwner } from "@/lib/groups";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id: groupId } = await params;
  const owner = await isGroupOwner(groupId, session.user.id);
  if (!owner) return errorResponse("Forbidden", 403);

  const newCode = generateInviteCode();

  await db
    .update(groups)
    .set({ inviteCode: newCode, updatedAt: new Date() })
    .where(eq(groups.id, groupId));

  return jsonResponse({ inviteCode: newCode });
}