import { NextResponse } from "next/server";
import { getBearerToken, getUserFromToken } from "@/lib/auth";
import { readRecentPingEvents } from "@/lib/storage";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "admin_required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "200");
  const events = await readRecentPingEvents(Number.isFinite(limit) ? Math.min(limit, 1000) : 200);

  return NextResponse.json({
    count: events.length,
    events
  });
}
