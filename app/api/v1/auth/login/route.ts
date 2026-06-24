import { NextResponse } from "next/server";
import { createSessionForUser } from "@/lib/auth";
import { sanitizeUser } from "@/lib/api-helpers";
import { getUsers, verifyPassword } from "@/lib/storage";

type LoginPayload = {
  email: string;
  password: string;
};

export async function POST(request: Request) {
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
    user: sanitizeUser(user)
  });
}
