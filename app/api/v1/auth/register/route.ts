import { NextResponse } from "next/server";
import { createSessionForUser, createUserId } from "@/lib/auth";
import { getUsers, hashPassword, saveUsers } from "@/lib/storage";

type RegisterPayload = {
  email: string;
  password: string;
  displayName?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterPayload;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "email_and_password_required" },
      { status: 400 }
    );
  }

  const email = body.email.trim().toLowerCase();
  const displayName = (body.displayName ?? "New User").trim();

  if (!email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  if (body.password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }

  const users = await getUsers();
  const existing = users.find((user) => user.email === email);
  if (existing) {
    return NextResponse.json({ error: "email_already_exists" }, { status: 409 });
  }

  const createdAt = new Date().toISOString();
  const role: "admin" | "viewer" = users.length === 0 ? "admin" : "viewer";

  const user = {
    id: createUserId(),
    email,
    displayName,
    passwordHash: hashPassword(body.password),
    role,
    reporterStatus: "none" as const,
    createdAt
  };

  users.push(user);
  await saveUsers(users);
  const session = await createSessionForUser(user.id);

  return NextResponse.json(
    {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        reporterStatus: user.reporterStatus,
        createdAt: user.createdAt
      }
    },
    { status: 201 }
  );
}
