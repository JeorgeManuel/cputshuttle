import type { StoredUser } from "@/lib/storage";
import {
  createId,
  createToken,
  getSessions,
  getUsers,
  saveSessions,
  type StoredSession
} from "@/lib/storage";

const SESSION_HOURS = 24 * 14;

export function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token;
}

export async function getUserFromToken(token: string): Promise<StoredUser | null> {
  const sessions = await getSessions();
  const users = await getUsers();
  const now = Date.now();

  const validSession = sessions.find(
    (session) => session.token === token && new Date(session.expiresAt).getTime() > now
  );

  if (!validSession) return null;
  return users.find((user) => user.id === validSession.userId) ?? null;
}

export async function createSessionForUser(userId: string): Promise<StoredSession> {
  const sessions = await getSessions();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_HOURS * 60 * 60 * 1000);

  const session: StoredSession = {
    token: createToken(),
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  const trimmed = sessions.filter(
    (item) => new Date(item.expiresAt).getTime() > Date.now()
  );
  trimmed.push(session);
  await saveSessions(trimmed);

  return session;
}

export function createUserId(): string {
  return createId("user");
}

export function createRequestId(): string {
  return createId("request");
}

export function createReporterSessionId(): string {
  return createId("session");
}
