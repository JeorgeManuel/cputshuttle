import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { getUsers, saveUsers } from "@/lib/storage";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const admin = auth.user;

  const users = await getUsers();
  const index = users.findIndex((item) => item.id === context.params.id);
  if (index < 0) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  users[index] = { ...users[index], role: "admin" };
  await saveUsers(users);

  const promotedAt = new Date().toISOString();

  return NextResponse.json({
    userId: context.params.id,
    newRole: "admin",
    promotedAt,
    promotedBy: admin.id
  });
}
