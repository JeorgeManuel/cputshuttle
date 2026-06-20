import type {
  StoredReporterRequest,
  StoredReporterSession,
  StoredSession,
  StoredUser
} from "./storage";

export { runtimeFilePaths } from "./storage-json";

const usePostgres = Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);
const useEdgeConfig = Boolean(process.env.EDGE_CONFIG);

// Note: we avoid conditional exports (not supported well by TS).
// Instead, each function delegates at runtime.

async function pickStorage() {
  if (usePostgres) return await import("./storage-postgres");
  if (useEdgeConfig) return await import("./storage-edge-config");
  return await import("./storage-json");
}

export async function getUsers(): Promise<StoredUser[]> {
  const storage = await pickStorage();
  return storage.getUsers();
}


export async function saveUsers(users: StoredUser[]): Promise<void> {
  if (usePostgres) return (await import("./storage-postgres")).saveUsers(users);
  return (await import("./storage-json")).saveUsers(users);
}

export async function getSessions(): Promise<StoredSession[]> {
  if (usePostgres) return (await import("./storage-postgres")).getSessions();
  return (await import("./storage-json")).getSessions();
}

export async function saveSessions(sessions: StoredSession[]): Promise<void> {
  if (usePostgres) return (await import("./storage-postgres")).saveSessions(sessions);
  return (await import("./storage-json")).saveSessions(sessions);
}

export async function getReporterRequests(): Promise<StoredReporterRequest[]> {
  if (usePostgres) return (await import("./storage-postgres")).getReporterRequests();
  return (await import("./storage-json")).getReporterRequests();
}

export async function saveReporterRequests(
  requests: StoredReporterRequest[]
): Promise<void> {
  if (usePostgres)
    return (await import("./storage-postgres")).saveReporterRequests(requests);
  return (await import("./storage-json")).saveReporterRequests(requests);
}

export async function getReporterSessions(): Promise<StoredReporterSession[]> {
  if (usePostgres) return (await import("./storage-postgres")).getReporterSessions();
  return (await import("./storage-json")).getReporterSessions();
}

export async function saveReporterSessions(
  sessions: StoredReporterSession[]
): Promise<void> {
  if (usePostgres)
    return (await import("./storage-postgres")).saveReporterSessions(sessions);
  return (await import("./storage-json")).saveReporterSessions(sessions);
}

export async function appendPingEvent(event: unknown): Promise<void> {
  if (usePostgres) return (await import("./storage-postgres")).appendPingEvent(event);
  return (await import("./storage-json")).appendPingEvent(event);
}

export async function readRecentPingEvents(limit = 200): Promise<unknown[]> {
  if (usePostgres) return (await import("./storage-postgres")).readRecentPingEvents(limit);
  return (await import("./storage-json")).readRecentPingEvents(limit);
}

