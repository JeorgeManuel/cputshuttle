import { NextResponse } from "next/server";
import { getBearerToken, getUserFromToken } from "@/lib/auth";
import { getReporterSessions, saveReporterSessions } from "@/lib/storage";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "invalid_session" }, { status: 401 });
    }

    const sessions = await getReporterSessions();
    const index = sessions.findIndex((item) => item.id === context.params.id);
    if (index < 0) {
      return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    }

    const target = sessions[index];
    if (!(user.role === "admin" || target.userId === user.id)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const endedAt = new Date().toISOString();
    sessions[index] = { ...target, endedAt };
    await saveReporterSessions(sessions);

    return NextResponse.json({
      sessionId: context.params.id,
      endedAt
    });
  } catch (error) {
    console.error(`POST /api/v1/reporter-sessions/${context.params.id}/stop failed:`, error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
