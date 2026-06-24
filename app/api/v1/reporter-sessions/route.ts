import { NextResponse } from "next/server";
import {
  createReporterSessionId,
  getBearerToken,
  getUserFromToken
} from "@/lib/auth";
import { getRouteById } from "@/lib/routeSeed";
import { getReporterSessions, saveReporterSessions } from "@/lib/storage";

type SessionPayload = {
  routeId: string;
};

export async function POST(request: Request) {
  try {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  let body: SessionPayload;
  try {
    body = (await request.json()) as SessionPayload;
  } catch {
    return NextResponse.json(
      { error: "invalid_request_body" },
      { status: 400 }
    );
  }

  const route = body?.routeId ? getRouteById(body.routeId) : null;
  if (!route) {
    return NextResponse.json(
      { error: "route_not_allowed" },
      { status: 400 }
    );
  }

  if (!(user.role === "admin" || user.reporterStatus === "approved")) {
    return NextResponse.json(
      { error: "reporter_approval_required" },
      { status: 403 }
    );
  }

  const sessions = await getReporterSessions();
  const existingActive = sessions.find(
    (item) => item.userId === user.id && !item.endedAt
  );

  if (existingActive) {
    return NextResponse.json(existingActive, { status: 200 });
  }

  const session = {
    id: createReporterSessionId(),
    userId: user.id,
    routeId: route.id,
    startedAt: new Date().toISOString(),
    endedAt: null,
    isMuted: false,
    isFlagged: false
  };

  sessions.push(session);
  await saveReporterSessions(sessions);

  return NextResponse.json(
    session,
    { status: 201 }
  );
  } catch (error) {
    console.error("POST /api/v1/reporter-sessions failed:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
