import { getSession } from "@/lib/session";
import { createGroup } from "@/lib/groups";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const name = body.name?.trim();

  if (!name || name.length < 2) {
    return errorResponse("Group name must be at least 2 characters");
  }

  const group = await createGroup(session.user.id, name);
  return jsonResponse(group, 201);
}
