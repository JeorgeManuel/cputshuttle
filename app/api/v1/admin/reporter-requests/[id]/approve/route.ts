import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import {
  getReporterRequests,
  saveReporterRequests,
  getUsers,
  saveUsers
} from "@/lib/storage";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const admin = auth.user;

  const requests = await getReporterRequests();
  const index = requests.findIndex((item) => item.id === context.params.id);
  if (index < 0) {
    return NextResponse.json({ error: "request_not_found" }, { status: 404 });
  }

  const approvedAt = new Date().toISOString();
  requests[index] = {
    ...requests[index],
    status: "approved",
    reviewedByAdminId: admin.id,
    reviewedAt: approvedAt
  };
  await saveReporterRequests(requests);

  const users = await getUsers();
  const userIndex = users.findIndex((item) => item.id === requests[index].userId);
  if (userIndex >= 0) {
    users[userIndex] = {
      ...users[userIndex],
      role: "reporter",
      reporterStatus: "approved"
    };
    await saveUsers(users);
  }

  return NextResponse.json({
    requestId: context.params.id,
    status: "approved",
    approvedAt,
    approvedBy: admin.id
  });
}
