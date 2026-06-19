"use client";

import { FormEvent, useState } from "react";

type AuthResult = {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    reporterStatus: string;
  };
};

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password })
      });

      const data = (await response.json()) as AuthResult | { error: string };
      if (!response.ok) {
        setError((data as { error?: string }).error ?? "Registration failed");
        return;
      }

      const result = data as AuthResult;
      localStorage.setItem("st_token", result.token);
      localStorage.setItem("st_user", JSON.stringify(result.user));
      setStatus(
        `Account created for ${result.user.email}. You are now logged in.`
      );
    } catch {
      setError("Network error while creating account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ padding: "24px 0 36px" }}>
      <article className="panel">
        <h2>Create account</h2>
        <p className="hint">
          First account becomes admin automatically so moderation can start.
        </p>

        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>

          <label className="field">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field">
            Password (min 8 chars)
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <div className="row">
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>

        {status ? <p className="status ok">{status}</p> : null}
        {error ? <p className="status err">{error}</p> : null}
      </article>
    </section>
  );
}
