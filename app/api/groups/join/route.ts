import { getSession } from "@/lib/session";
import { joinGroup } from "@/lib/groups";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const inviteCode = body.inviteCode?.trim();

  if (!inviteCode) {
    return errorResponse("Invite code is required");
  }

  try {
    const group = await joinGroup(session.user.id, inviteCode);
    return jsonResponse({ id: group.id, name: group.name });
  } catch {
    return errorResponse("Invalid invite code", 404);
  }
}
