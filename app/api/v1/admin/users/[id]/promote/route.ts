import { NextResponse } from "next/server";
import { getBearerToken, getUserFromToken } from "@/lib/auth";
import { getUsers, saveUsers } from "@/lib/storage";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const admin = await getUserFromToken(token);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "admin_required" }, { status: 403 });
  }

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
