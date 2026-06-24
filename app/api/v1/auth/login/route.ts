import { NextResponse } from "next/server";
import { createSessionForUser } from "@/lib/auth";
import { getUsers, verifyPassword } from "@/lib/storage";

type LoginPayload = {
  email: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    let body: LoginPayload;
    try {
      body = (await request.json()) as LoginPayload;
    } catch {
      return NextResponse.json(
        { error: "invalid_request_body" },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error("POST /api/v1/auth/login failed:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
