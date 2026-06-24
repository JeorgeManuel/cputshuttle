import { NextResponse } from "next/server";
import { createRequestId, getBearerToken, getUserFromToken } from "@/lib/auth";
import {
  getReporterRequests,
  saveReporterRequests,
  getUsers,
  saveUsers
} from "@/lib/storage";

type ReporterRequestPayload = {
  motivation?: string;
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

  let body: ReporterRequestPayload;
  try {
    body = (await request.json()) as ReporterRequestPayload;
  } catch {
    return NextResponse.json(
      { error: "invalid_request_body" },
      { status: 400 }
    );
  }
  const requests = await getReporterRequests();

  const existingPending = requests.find(
    (item) => item.userId === user.id && item.status === "pending"
  );
  if (existingPending) {
    return NextResponse.json(
      { error: "request_already_pending", requestId: existingPending.id },
      { status: 409 }
    );
  }

  const existingApproved = requests.find(
    (item) => item.userId === user.id && item.status === "approved"
  );
  if (existingApproved || user.reporterStatus === "approved") {
    return NextResponse.json({ error: "already_reporter" }, { status: 409 });
  }

  const createdAt = new Date().toISOString();
  const requestRecord = {
    id: createRequestId(),
    userId: user.id,
    motivation: body?.motivation?.trim() || null,
    status: "pending" as const,
    createdAt,
    reviewedByAdminId: null,
    reviewedAt: null
  };

  requests.push(requestRecord);
  await saveReporterRequests(requests);

  const users = await getUsers();
  const userIndex = users.findIndex((item) => item.id === user.id);
  if (userIndex >= 0) {
    users[userIndex] = { ...users[userIndex], reporterStatus: "pending" };
    await saveUsers(users);
  }

  return NextResponse.json(
    {
      id: requestRecord.id,
      userId: requestRecord.userId,
      status: requestRecord.status,
      motivation: requestRecord.motivation,
      createdAt: requestRecord.createdAt
    },
    { status: 201 }
  );
  } catch (error) {
    console.error("POST /api/v1/reporter-requests failed:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
