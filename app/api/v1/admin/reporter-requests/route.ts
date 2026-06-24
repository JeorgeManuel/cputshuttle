import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { getReporterRequests, getUsers } from "@/lib/storage";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

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
