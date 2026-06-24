import { NextResponse } from "next/server";
import { getUsers } from "@/lib/storage";

type Contributor = {
  id: string;
  displayName: string;
  roleLabel: string;
  joinedAt: string;
};

export async function GET() {
  try {
  const users = await getUsers();

  const admins: Contributor[] = users
    .filter((user) => user.role === "admin")
    .map((user) => ({
      id: user.id,
      displayName: user.displayName,
      roleLabel: "Admin",
      joinedAt: user.createdAt
    }));

  const reporters: Contributor[] = users
    .filter(
      (user) => user.reporterStatus === "approved" || user.role === "reporter"
    )
    .map((user) => ({
      id: user.id,
      displayName: user.displayName,
      roleLabel: user.role === "admin" ? "Admin Reporter" : "Reporter",
      joinedAt: user.createdAt
    }));

  admins.sort((a, b) => a.displayName.localeCompare(b.displayName));
  reporters.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return NextResponse.json({
    totals: {
      admins: admins.length,
      reporters: reporters.length
    },
    admins,
    reporters
  });
  } catch (error) {
    console.error("GET /api/v1/contributors failed:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
