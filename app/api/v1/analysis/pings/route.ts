import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { readRecentPingEvents, runtimeFilePaths } from "@/lib/storage";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "200");
  const events = await readRecentPingEvents(Number.isFinite(limit) ? Math.min(limit, 1000) : 200);

  return NextResponse.json({
    count: events.length,
    runtimeFile: runtimeFilePaths().pingEventsFile,
    events
  });
}
