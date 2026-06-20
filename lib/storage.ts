export type UserRole = "viewer" | "reporter" | "admin";
export type ReporterStatus = "none" | "pending" | "approved" | "rejected";

export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  reporterStatus: ReporterStatus;
  createdAt: string;
};

export type StoredSession = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type StoredReporterRequest = {
  id: string;
  userId: string;
  motivation: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedByAdminId: string | null;
  reviewedAt: string | null;
};

export type StoredReporterSession = {
  id: string;
  userId: string;
  routeId: string;
  startedAt: string;
  endedAt: string | null;
  isMuted: boolean;
  isFlagged: boolean;
};

export { createId, createToken, hashPassword, verifyPassword } from "./storage-crypto";

export {
  getUsers,
  saveUsers,
  getSessions,
  saveSessions,
  getReporterRequests,
  saveReporterRequests,
  getReporterSessions,
  saveReporterSessions,
  appendPingEvent,
  readRecentPingEvents,
  runtimeFilePaths
} from "./storage-backend";

