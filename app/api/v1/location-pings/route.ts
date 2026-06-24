import { NextResponse } from "next/server";
import { isWithinCorridor } from "@/lib/geo";
import { getRouteById } from "@/lib/routeSeed";
import { getBearerToken, getUserFromToken } from "@/lib/auth";
import { appendPingEvent, getReporterSessions } from "@/lib/storage";
import type { LatLng } from "@/types/route";

type PingPayload = {
  routeId: string;
  sessionId: string;
  lat: number;
  lng: number;
  accuracyM: number;
  capturedAtClient: string;
};

const TARGET_ACCURACY_M = Number(process.env.TARGET_ACCURACY_M ?? "350");
const REJECT_ACCURACY_M = Number(process.env.REJECT_ACCURACY_M ?? "1200");
const CORRIDOR_BUFFER_M = 100;

export async function POST(request: Request) {
  try {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ accepted: false, reason: "auth_required" }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ accepted: false, reason: "invalid_session" }, { status: 401 });
  }

  let payload: PingPayload;
  try {
    payload = (await request.json()) as PingPayload;
  } catch {
    return NextResponse.json(
      { accepted: false, reason: "invalid_request_body" },
      { status: 400 }
    );
  }
  const receivedAtServer = new Date().toISOString();

  const recordEvent = async (accepted: boolean, reason: string | null) => {
    await appendPingEvent({
      routeId: payload?.routeId ?? null,
      sessionId: payload?.sessionId ?? null,
      userId: user.id,
      lat: payload?.lat ?? null,
      lng: payload?.lng ?? null,
      accuracyM: payload?.accuracyM ?? null,
      capturedAtClient: payload?.capturedAtClient ?? null,
      receivedAtServer,
      accepted,
      reason
    });
  };

  const route = payload?.routeId ? getRouteById(payload.routeId) : null;
  if (!payload || !route) {
    await recordEvent(false, "route_not_allowed");
    return NextResponse.json(
      { accepted: false, reason: "route_not_allowed" },
      { status: 400 }
    );
  }

  if (!payload.sessionId) {
    await recordEvent(false, "session_required");
    return NextResponse.json(
      { accepted: false, reason: "session_required" },
      { status: 400 }
    );
  }

  const sessions = await getReporterSessions();
  const activeSession = sessions.find(
    (item) => item.id === payload.sessionId && !item.endedAt
  );

  if (!activeSession) {
    await recordEvent(false, "session_not_active");
    return NextResponse.json({ accepted: false, reason: "session_not_active" }, { status: 400 });
  }

  if (activeSession.routeId !== route.id) {
    await recordEvent(false, "session_route_mismatch");
    return NextResponse.json({ accepted: false, reason: "session_route_mismatch" }, { status: 400 });
  }

  if (!(activeSession.userId === user.id || user.role === "admin")) {
    await recordEvent(false, "session_user_mismatch");
    return NextResponse.json({ accepted: false, reason: "session_user_mismatch" }, { status: 403 });
  }

  if (activeSession.isMuted) {
    await recordEvent(false, "session_muted");
    return NextResponse.json({ accepted: false, reason: "session_muted" }, { status: 403 });
  }

  if (!Number.isFinite(payload.accuracyM) || payload.accuracyM <= 0) {
    await recordEvent(false, "invalid_accuracy");
    return NextResponse.json({ accepted: false, reason: "invalid_accuracy" }, { status: 400 });
  }

  if (payload.accuracyM > REJECT_ACCURACY_M) {
    await recordEvent(false, "accuracy_too_low");
    return NextResponse.json(
      {
        accepted: false,
        reason: "accuracy_too_low",
        accuracyM: payload.accuracyM,
        maxAcceptedAccuracyM: REJECT_ACCURACY_M
      },
      { status: 400 }
    );
  }

  const point: LatLng = [payload.lat, payload.lng];

  const accepted = isWithinCorridor(
    point,
    route.mainPath,
    route.alternatePath,
    CORRIDOR_BUFFER_M
  );

  if (!accepted) {
    await recordEvent(false, "off_route");
    return NextResponse.json({ accepted: false, reason: "off_route" });
  }

  const lowAccuracyAccepted = payload.accuracyM > TARGET_ACCURACY_M;
  await recordEvent(true, lowAccuracyAccepted ? "low_accuracy_accepted" : null);

  return NextResponse.json({
    accepted: true,
    reason: lowAccuracyAccepted ? "low_accuracy_accepted" : null,
    accuracyM: payload.accuracyM,
    matchedRouteId: route.id,
    receivedAtServer
  });
  } catch (error) {
    console.error("POST /api/v1/location-pings failed:", error);
    return NextResponse.json(
      { accepted: false, reason: "internal_server_error" },
      { status: 500 }
    );
  }
}
