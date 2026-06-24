import type {
  StoredReporterRequest,
  StoredReporterSession,
  StoredSession,
  StoredUser
} from "./storage";

// Re-exported for debugging/UI; not used for backend selection.
export { runtimeFilePaths } from "./storage-json";

const usePostgres = Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);
const useEdgeConfig = Boolean(process.env.EDGE_CONFIG);

// On Vercel, JSON filesystem writes will fail (EROFS). We therefore:
// - prefer Postgres when configured
// - otherwise require Edge Config when configured
// - do NOT fall back to JSON on Vercel
const onVercel = process.env.VERCEL === "1";
const effectiveUseEdgeConfig = useEdgeConfig || (onVercel && !usePostgres);

async function pickStorage() {
  if (usePostgres) return await import("./storage-postgres");
  if (effectiveUseEdgeConfig) return await import("./storage-edge-config");
  return await import("./storage-json");
}

export async function getUsers(): Promise<StoredUser[]> {
  const storage = await pickStorage();
  return storage.getUsers();
}

export async function saveUsers(users: StoredUser[]): Promise<void> {
  const storage = await pickStorage();
  return storage.saveUsers(users);
}

export async function getSessions(): Promise<StoredSession[]> {
  const storage = await pickStorage();
  return storage.getSessions();
}

export async function saveSessions(sessions: StoredSession[]): Promise<void> {
  const storage = await pickStorage();
  return storage.saveSessions(sessions);
}

export async function getReporterRequests(): Promise<StoredReporterRequest[]> {
  const storage = await pickStorage();
  return storage.getReporterRequests();
}

export async function saveReporterRequests(
  requests: StoredReporterRequest[]
): Promise<void> {
  const storage = await pickStorage();
  return storage.saveReporterRequests(requests);
}

export async function getReporterSessions(): Promise<StoredReporterSession[]> {
  const storage = await pickStorage();
  return storage.getReporterSessions();
}

export async function saveReporterSessions(
  sessions: StoredReporterSession[]
): Promise<void> {
  const storage = await pickStorage();
  return storage.saveReporterSessions(sessions);
}

export async function appendPingEvent(event: unknown): Promise<void> {
  const storage = await pickStorage();
  return storage.appendPingEvent(event);
}

export async function readRecentPingEvents(limit = 200): Promise<unknown[]> {
  const storage = await pickStorage();
  return storage.readRecentPingEvents(limit);
}
