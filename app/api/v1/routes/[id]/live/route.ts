import { NextResponse } from "next/server";
import { getRouteById } from "@/lib/routeSeed";
import { calculateReliabilityScore } from "@/lib/reliability";
import { haversineMeters } from "@/lib/geo";
import { getReporterSessions, readRecentPingEvents } from "@/lib/storage";
import type { LiveEstimate } from "@/types/route";

type PingEvent = {
  routeId: string | null;
  sessionId: string | null;
  userId: string | null;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  capturedAtClient: string | null;
  receivedAtServer: string;
  accepted: boolean;
  reason: string | null;
};

const LIVE_WINDOW_MS = 10 * 60 * 1000;
const CLUSTER_RADIUS_M = 250;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  try {
  const route = getRouteById(context.params.id);
  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  const now = Date.now();
  const activeSessions = await getReporterSessions();
  const activeSessionIds = new Set(
    activeSessions
      .filter((session) => session.routeId === route.id && !session.endedAt && !session.isMuted)
      .map((session) => session.id)
  );

  const events = (await readRecentPingEvents(2000)) as PingEvent[];
  const accepted = events.filter((event) => {
    if (!event.accepted) return false;
    if (event.routeId !== route.id) return false;
    if (!event.sessionId || !activeSessionIds.has(event.sessionId)) return false;
    if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return false;

    const ts = new Date(event.receivedAtServer).getTime();
    if (!Number.isFinite(ts)) return false;
    return now - ts <= LIVE_WINDOW_MS;
  });

  const latestPerSession = new Map<string, PingEvent>();
  for (const event of accepted) {
    if (!event.sessionId) continue;
    const existing = latestPerSession.get(event.sessionId);
    if (!existing) {
      latestPerSession.set(event.sessionId, event);
      continue;
    }

    if (new Date(event.receivedAtServer).getTime() > new Date(existing.receivedAtServer).getTime()) {
      latestPerSession.set(event.sessionId, event);
    }
  }

  const sessionPoints = Array.from(latestPerSession.values());

  type Cluster = {
    points: PingEvent[];
    lat: number;
    lng: number;
    newestTs: number;
  };

  const clusters: Cluster[] = [];

  for (const point of sessionPoints) {
    const lat = point.lat as number;
    const lng = point.lng as number;
    let assigned = false;

    for (const cluster of clusters) {
      const distance = haversineMeters([lat, lng], [cluster.lat, cluster.lng]);
      if (distance <= CLUSTER_RADIUS_M) {
        cluster.points.push(point);
        cluster.lat = mean(cluster.points.map((item) => item.lat as number));
        cluster.lng = mean(cluster.points.map((item) => item.lng as number));
        cluster.newestTs = Math.max(
          cluster.newestTs,
          new Date(point.receivedAtServer).getTime()
        );
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      clusters.push({
        points: [point],
        lat,
        lng,
        newestTs: new Date(point.receivedAtServer).getTime()
      });
    }
  }

  clusters.sort((a, b) => b.newestTs - a.newestTs);

  const estimates: LiveEstimate[] = clusters.slice(0, 2).map((cluster, index) => {
    const reporterCount = new Set(
      cluster.points
        .map((point) => point.userId)
        .filter((userId): userId is string => Boolean(userId))
    ).size;
    const freshnessSeconds = Math.max(0, Math.round((now - cluster.newestTs) / 1000));
    const avgAccuracyMeters = mean(
      cluster.points.map((point) => (point.accuracyM && point.accuracyM > 0 ? point.accuracyM : 500))
    );

    const agreementMeters =
      reporterCount <= 1
        ? 0
        : mean(
            cluster.points.map((point) =>
              haversineMeters(
                [point.lat as number, point.lng as number],
                [cluster.lat, cluster.lng]
              )
            )
          );

    const firstStop = route.stops[0];
    const lastStop = route.stops[route.stops.length - 1];

    const toFirstStopDistance = firstStop
      ? haversineMeters([cluster.lat, cluster.lng], [firstStop.lat, firstStop.lng])
      : Number.POSITIVE_INFINITY;
    const toLastStopDistance = lastStop
      ? haversineMeters([cluster.lat, cluster.lng], [lastStop.lat, lastStop.lng])
      : Number.POSITIVE_INFINITY;

    const towardFirst = toFirstStopDistance < toLastStopDistance;
    const direction = towardFirst
      ? `to_${firstStop?.id ?? "start"}`
      : `to_${lastStop?.id ?? "end"}`;

    return {
      routeId: route.id,
      shuttleSlot: index === 0 ? "A" : "B",
      direction,
      lat: cluster.lat,
      lng: cluster.lng,
      reliabilityScore: calculateReliabilityScore({
        reporterCount,
        freshnessSeconds,
        agreementMeters,
        avgAccuracyMeters
      }),
      reporterCount,
      generatedAt: new Date(cluster.newestTs).toISOString()
    };
  });

  return NextResponse.json({ estimates });
  } catch (error) {
    console.error(`GET /api/v1/routes/${context.params.id}/live failed:`, error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
