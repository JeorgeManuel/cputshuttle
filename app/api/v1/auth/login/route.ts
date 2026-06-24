import { NextResponse } from "next/server";
import { createSessionForUser } from "@/lib/auth";
import { getUsers, verifyPassword } from "@/lib/storage";
import { isRateLimited } from "@/lib/rate-limit";

type LoginPayload = {
  email: string;
  password: string;
};

export async function POST(request: Request) {
  if (isRateLimited(request, "login")) {
    return NextResponse.json(
      { error: "too_many_requests" },
      { status: 429 }
    );
  }

  const body = (await request.json()) as LoginPayload;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "email_and_password_required" },
      { status: 400 }
    );
  }

  const email = body.email.trim().toLowerCase();
  const users = await getUsers();
  const user = users.find((item) => item.email === email);

  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const session = await createSessionForUser(user.id);

  return NextResponse.json({
    token: session.token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      reporterStatus: user.reporterStatus,
      createdAt: user.createdAt
    }
  });
}
