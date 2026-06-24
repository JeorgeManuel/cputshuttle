import { NextResponse } from "next/server";
import { getBearerToken, getUserFromToken } from "@/lib/auth";
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
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const admin = await getUserFromToken(token);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "admin_required" }, { status: 403 });
    }

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
  } catch (error) {
    console.error(`POST /api/v1/admin/reporter-requests/${context.params.id}/approve failed:`, error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
