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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = (await response.json()) as AuthResult | { error: string };
      if (!response.ok) {
        setError((data as { error?: string }).error ?? "Login failed");
        return;
      }

      const result = data as AuthResult;
      localStorage.setItem("st_token", result.token);
      localStorage.setItem("st_user", JSON.stringify(result.user));
      setStatus(`Logged in as ${result.user.displayName} (${result.user.role})`);
    } catch {
      setError("Network error while logging in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ padding: "24px 0 36px" }}>
      <article className="panel">
        <h2>Login</h2>

        <form className="stack" onSubmit={onSubmit}>
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
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <div className="row">
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        {status ? <p className="status ok">{status}</p> : null}
        {error ? <p className="status err">{error}</p> : null}
      </article>
    </section>
  );
}
