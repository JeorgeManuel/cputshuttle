import type {
  StoredReporterRequest,
  StoredReporterSession,
  StoredSession,
  StoredUser,
  UserRole,
  ReporterStatus
} from "./storage";

import { createToken, createId, hashPassword, verifyPassword } from "./storage-crypto";

// Minimal Edge Config adapter.
//
// This project’s storage backend API is file-based (users.json/sessions.json + ping-events.ndjson).
// For Edge Config, we store each “table” as a single JSON value.
//
// NOTE: This is meant for a prototype; it is not designed for high write throughput.

function getEnv(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() ? v : undefined;
}

const EDGE_CONFIG_URL = getEnv("EDGE_CONFIG");

if (!EDGE_CONFIG_URL) {
  // Don’t throw at module import; it would break local dev.
}

async function edgeFetch(path: string, body?: unknown, method: string = "GET") {
  if (!EDGE_CONFIG_URL) {
    throw new Error(
      "EDGE_CONFIG is not set. Configure Vercel Edge Config and set EDGE_CONFIG env var to the token URL."
    );
  }

  const url = EDGE_CONFIG_URL.replace(/\/$/, "") + path;

  const res = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Edge Config error ${res.status}: ${text}`);
  }

  if (res.status === 204) return null;
  return await res.json();
}

// Edge Config “keys” are nested by our own convention.
// We store a full JSON array under a single key for each table.
const KEYS = {
  users: "tables.users",
  sessions: "tables.sessions",
  reporterRequests: "tables.reporter-requests",
  reporterSessions: "tables.reporter-sessions",
  pingEvents: "tables.ping-events" // stored as NDJSON-ish array; prototype only
} as const;

type TableKey = (typeof KEYS)[keyof typeof KEYS];

async function getTable<T>(key: TableKey): Promise<T[]> {
  // Edge Config GET
  const data = await edgeFetch(`/v1/kv/${encodeURIComponent(key)}`);
  // Depending on Edge Config response format, it may be { value: ... } or just the value.
  const maybeValue = (data as any)?.value ?? data;
  if (!maybeValue) return [];
  return maybeValue as T[];
}

async function setTable<T>(key: TableKey, value: T[]): Promise<void> {
  await edgeFetch(`/v1/kv/${encodeURIComponent(key)}`, { value }, "PUT");
}

// We also keep ping events in a JSON array for simplicity.
// Each element is whatever object lib/storage-json passed into appendPingEvent.
async function getPingEvents(limit = 200): Promise<unknown[]> {
  const all = await getTable<unknown>(KEYS.pingEvents);
  if (all.length <= limit) return all;
  return all.slice(-limit);
}

async function pushPingEvent(event: unknown): Promise<void> {
  const all = await getTable<unknown>(KEYS.pingEvents);
  all.push(event);
  // Keep it bounded for prototype.
  const trimmed = all.slice(-20000);
  await setTable(KEYS.pingEvents, trimmed);
}

export async function getUsers(): Promise<StoredUser[]> {
  const rows = await getTable<StoredUser>(KEYS.users);
  return rows;
}

export async function saveUsers(users: StoredUser[]): Promise<void> {
  await setTable(KEYS.users, users);
}

export async function getSessions(): Promise<StoredSession[]> {
  return await getTable<StoredSession>(KEYS.sessions);
}

export async function saveSessions(sessions: StoredSession[]): Promise<void> {
  await setTable(KEYS.sessions, sessions);
}

export async function getReporterRequests(): Promise<StoredReporterRequest[]> {
  return await getTable<StoredReporterRequest>(KEYS.reporterRequests);
}

export async function saveReporterRequests(
  requests: StoredReporterRequest[]
): Promise<void> {
  await setTable(KEYS.reporterRequests, requests);
}

export async function getReporterSessions(): Promise<StoredReporterSession[]> {
  return await getTable<StoredReporterSession>(KEYS.reporterSessions);
}

export async function saveReporterSessions(
  sessions: StoredReporterSession[]
): Promise<void> {
  await setTable(KEYS.reporterSessions, sessions);
}

export async function appendPingEvent(event: unknown): Promise<void> {
  await pushPingEvent(event);
}

export async function readRecentPingEvents(limit = 200): Promise<unknown[]> {
  return await getPingEvents(limit);
}

// Keep crypto exports consistent with other backends.
export { createToken, createId, hashPassword, verifyPassword };

