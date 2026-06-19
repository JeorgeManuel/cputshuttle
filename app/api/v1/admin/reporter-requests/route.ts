import { NextResponse } from "next/server";
import { getBearerToken, getUserFromToken } from "@/lib/auth";
import { getReporterRequests, getUsers } from "@/lib/storage";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const admin = await getUserFromToken(token);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "admin_required" }, { status: 403 });
  }

  const users = await getUsers();
  const requests = await getReporterRequests();

  const pending = requests
    .filter((item) => item.status === "pending")
    .sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((item) => {
      const user = users.find((entry) => entry.id === item.userId);
      return {
        id: item.id,
        userId: item.userId,
        email: user?.email ?? null,
        displayName: user?.displayName ?? null,
        motivation: item.motivation,
        createdAt: item.createdAt
      };
    });

  return NextResponse.json({ pending });
}
