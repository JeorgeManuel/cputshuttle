import type {
  StoredReporterRequest,
  StoredReporterSession,
  StoredSession,
  StoredUser,
  UserRole,
  ReporterStatus
} from "@/lib/storage";
import { query } from "@/lib/db";


// Helpers to map DB rows → runtime types
function mapUserRole(role: string): UserRole {
  if (role === "admin" || role === "reporter" || role === "viewer") return role;
  return "viewer";
}

function mapReporterStatus(status: string): ReporterStatus {
  if (status === "none" || status === "pending" || status === "approved" || status === "rejected") {
    return status;
  }
  return "none";
}

export async function getUsers(): Promise<StoredUser[]> {
  const rows = await query<{
    id: string;
    email: string;
    password_hash: string;
    display_name: string;
    role: string;
    reporter_status: string;
    created_at: string;
  }>(
    "select id, email, password_hash, display_name, role, reporter_status, created_at from users order by created_at asc"
  );

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    passwordHash: r.password_hash,
    role: mapUserRole(r.role),
    reporterStatus: mapReporterStatus(r.reporter_status),
    createdAt: new Date(r.created_at).toISOString()
  }));
}

export async function saveUsers(users: StoredUser[]): Promise<void> {
  // Not ideal for production, but to keep the same API contract we can upsert.
  // For this beta, registration/login mostly uses getUsers/saveUsers for users.
  // We'll upsert each user by id.
  await Promise.all(
    users.map(async (u) => {
      await query(
        "insert into users (id, email, password_hash, display_name, role, reporter_status, created_at) values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do update set email=excluded.email, password_hash=excluded.password_hash, display_name=excluded.display_name, role=excluded.role, reporter_status=excluded.reporter_status",
        [
          u.id,
          u.email,
          u.passwordHash,
          u.displayName,
          u.role,
          u.reporterStatus,
          u.createdAt
        ]
      );
    })
  );
}

export async function getSessions(): Promise<StoredSession[]> {
  const rows = await query<{
    token: string;
    user_id: string;
    created_at: string;
    expires_at: string;
  }>(
    "select token, user_id, created_at, expires_at from sessions"
  );

  return rows.map((r) => ({
    token: r.token,
    userId: r.user_id,
    createdAt: new Date(r.created_at).toISOString(),
    expiresAt: new Date(r.expires_at).toISOString()
  }));
}

export async function saveSessions(sessions: StoredSession[]): Promise<void> {
  await Promise.all(
    sessions.map(async (s) => {
      await query(
        "insert into sessions (token, user_id, created_at, expires_at) values ($1,$2,$3,$4) on conflict (token) do update set user_id=excluded.user_id, expires_at=excluded.expires_at",
        [s.token, s.userId, s.createdAt, s.expiresAt]
      );
    })
  );
}

export async function getReporterRequests(): Promise<StoredReporterRequest[]> {
  const rows = await query<any>(
    "select id, user_id, motivation, status, created_at, reviewed_by_admin_id, reviewed_at from reporter_requests order by created_at asc"
  );

  return rows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    motivation: r.motivation,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    reviewedByAdminId: r.reviewed_by_admin_id,
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null
  }));
}

export async function saveReporterRequests(
  requests: StoredReporterRequest[]
): Promise<void> {
  await Promise.all(
    requests.map(async (req) => {
      await query(
        "insert into reporter_requests (id, user_id, motivation, status, reviewed_by_admin_id, reviewed_at, created_at) values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do update set user_id=excluded.user_id, motivation=excluded.motivation, status=excluded.status, reviewed_by_admin_id=excluded.reviewed_by_admin_id, reviewed_at=excluded.reviewed_at",
        [
          req.id,
          req.userId,
          req.motivation,
          req.status,
          req.reviewedByAdminId,
          req.reviewedAt,
          req.createdAt
        ]
      );
    })
  );
}

export async function getReporterSessions(): Promise<StoredReporterSession[]> {
  const rows = await query<any>(
    "select id, user_id, route_id, started_at, ended_at, is_muted, is_flagged from reporter_sessions"
  );

  return rows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    routeId: r.route_id,
    startedAt: new Date(r.started_at).toISOString(),
    endedAt: r.ended_at ? new Date(r.ended_at).toISOString() : null,
    isMuted: Boolean(r.is_muted),
    isFlagged: Boolean(r.is_flagged)
  }));
}

export async function saveReporterSessions(
  sessions: StoredReporterSession[]
): Promise<void> {
  await Promise.all(
    sessions.map(async (s) => {
      await query(
        "insert into reporter_sessions (id, user_id, route_id, started_at, ended_at, is_muted, is_flagged) values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do update set user_id=excluded.user_id, route_id=excluded.route_id, started_at=excluded.started_at, ended_at=excluded.ended_at, is_muted=excluded.is_muted, is_flagged=excluded.is_flagged",
        [
          s.id,
          s.userId,
          s.routeId,
          s.startedAt,
          s.endedAt,
          s.isMuted,
          s.isFlagged
        ]
      );
    })
  );
}

// Ping events storage: map to location_pings table.
export async function appendPingEvent(event: unknown): Promise<void> {
  const e = event as any;
  const {
    routeId,
    sessionId,
    userId,
    lat,
    lng,
    accuracyM,
    capturedAtClient,
    receivedAtServer,
    accepted,
    reason
  } = e ?? {};

  // Only store if we have enough fields.
  await query(
    "insert into location_pings (reporter_session_id, route_id, lat, lng, accuracy_m, captured_at_client, received_at_server, matched_path_id, accepted, rejection_reason) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [
      sessionId ?? null,
      routeId ?? null,
      lat ?? null,
      lng ?? null,
      accuracyM ?? 0,
      capturedAtClient ?? new Date().toISOString(),
      receivedAtServer ?? new Date().toISOString(),
      null,
      Boolean(accepted),
      reason ?? null
    ]
  );
}

export async function readRecentPingEvents(limit = 200): Promise<unknown[]> {
  const rows = await query<any>(
    "select route_id as routeId, reporter_session_id as sessionId, user_id, lat, lng, accuracy_m as accuracyM, captured_at_client as capturedAtClient, received_at_server as receivedAtServer, accepted, rejection_reason as reason from location_pings order by received_at_server desc limit $1",
    [limit]
  );

  return rows.map((r: any) => ({
    routeId: r.routeId,
    sessionId: r.sessionId,
    userId: r.user_id ?? null,
    lat: r.lat,
    lng: r.lng,
    accuracyM: r.accuracyM,
    capturedAtClient: r.capturedAtClient,
    receivedAtServer: r.receivedAtServer,
    accepted: r.accepted,
    reason: r.reason ?? null
  }));
}

// Re-export crypto utils so existing code keeps importing from lib/storage
export { createId, createToken, hashPassword, verifyPassword } from "@/lib/storage";



