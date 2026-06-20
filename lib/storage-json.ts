import { promises as fs } from "fs";
import path from "path";

import type {
  StoredReporterRequest,
  StoredReporterSession,
  StoredSession,
  StoredUser
} from "./storage";

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const usersFile = path.join(runtimeDir, "users.json");
const sessionsFile = path.join(runtimeDir, "sessions.json");
const reporterRequestsFile = path.join(runtimeDir, "reporter-requests.json");
const reporterSessionsFile = path.join(runtimeDir, "reporter-sessions.json");
const pingEventsFile = path.join(runtimeDir, "ping-events.ndjson");

async function ensureRuntimeFiles() {
  await fs.mkdir(runtimeDir, { recursive: true });

  const files: Array<{ filePath: string; fallback: string }> = [
    { filePath: usersFile, fallback: "[]\n" },
    { filePath: sessionsFile, fallback: "[]\n" },
    { filePath: reporterRequestsFile, fallback: "[]\n" },
    { filePath: reporterSessionsFile, fallback: "[]\n" },
    { filePath: pingEventsFile, fallback: "" }
  ];

  for (const file of files) {
    try {
      await fs.access(file.filePath);
    } catch {
      await fs.writeFile(file.filePath, file.fallback, "utf8");
    }
  }
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  await ensureRuntimeFiles();
  const raw = await fs.readFile(filePath, "utf8");
  if (!raw.trim()) return [];
  return JSON.parse(raw) as T[];
}

async function writeJsonArray<T>(filePath: string, data: T[]): Promise<void> {
  await ensureRuntimeFiles();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function getUsers(): Promise<StoredUser[]> {
  return readJsonArray<StoredUser>(usersFile);
}

export async function saveUsers(users: StoredUser[]): Promise<void> {
  await writeJsonArray(usersFile, users);
}

export async function getSessions(): Promise<StoredSession[]> {
  return readJsonArray<StoredSession>(sessionsFile);
}

export async function saveSessions(sessions: StoredSession[]): Promise<void> {
  await writeJsonArray(sessionsFile, sessions);
}

export async function getReporterRequests(): Promise<StoredReporterRequest[]> {
  return readJsonArray<StoredReporterRequest>(reporterRequestsFile);
}

export async function saveReporterRequests(
  requests: StoredReporterRequest[]
): Promise<void> {
  await writeJsonArray(reporterRequestsFile, requests);
}

export async function getReporterSessions(): Promise<StoredReporterSession[]> {
  return readJsonArray<StoredReporterSession>(reporterSessionsFile);
}

export async function saveReporterSessions(
  sessions: StoredReporterSession[]
): Promise<void> {
  await writeJsonArray(reporterSessionsFile, sessions);
}

export async function appendPingEvent(event: unknown): Promise<void> {
  await ensureRuntimeFiles();
  await fs.appendFile(pingEventsFile, JSON.stringify(event) + "\n", "utf8");
}

export async function readRecentPingEvents(limit = 200): Promise<unknown[]> {
  await ensureRuntimeFiles();
  const raw = await fs.readFile(pingEventsFile, "utf8");
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(-limit).map((line) => JSON.parse(line));
}

export function runtimeFilePaths() {
  return {
    usersFile,
    sessionsFile,
    reporterRequestsFile,
    reporterSessionsFile,
    pingEventsFile
  };
}

