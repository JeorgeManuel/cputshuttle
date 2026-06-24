import { NextResponse } from "next/server";
import { getBearerToken, getUserFromToken } from "@/lib/auth";
import type { StoredUser } from "@/lib/storage";

export type AuthenticatedUser = StoredUser;

export type AuthResult =
  | { user: AuthenticatedUser; response?: never }
  | { user?: never; response: NextResponse };

/**
 * Extract and validate the bearer token from a request.
 * Returns the authenticated user or an error response ready to return.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const token = getBearerToken(request);
  if (!token) {
    return {
      response: NextResponse.json({ error: "auth_required" }, { status: 401 })
    };
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "invalid_session" },
        { status: 401 }
      )
    };
  }

  return { user };
}

/**
 * Require the request to be made by an admin user.
 * Returns the authenticated admin or an error response ready to return.
 */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (result.response) return result;

  if (result.user.role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "admin_required" },
        { status: 403 }
      )
    };
  }

  return result;
}

/**
 * Strip sensitive fields (passwordHash) from a user record for API responses.
 */
export function sanitizeUser(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    reporterStatus: user.reporterStatus,
    createdAt: user.createdAt
  };
}
