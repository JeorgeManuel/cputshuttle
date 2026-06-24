"use client";

import { useEffect, useMemo, useState } from "react";

type PendingRequest = {
  id: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  motivation: string | null;
  createdAt: string;
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("st_token"));
  }, []);

  const headers = useMemo(() => {
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`
    };
  }, [token]);

  async function loadPending() {
    if (!headers) {
      setError("Login as an admin to manage reporter approvals");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/v1/admin/reporter-requests", {
        headers
      });
      const data = (await response.json()) as {
        error?: string;
        pending?: PendingRequest[];
      };

      if (!response.ok) {
        setError(data.error ?? "Could not load pending requests");
        return;
      }

      setPending(data.pending ?? []);
    } catch {
      setError("Network error while loading pending requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!headers) return;
    loadPending();
  }, [headers]);

  async function approveRequest(requestId: string) {
    if (!headers) {
      setError("Login as admin first");
      return;
    }

    setError("");
    setStatus("");

    try {
      const response = await fetch(
        `/api/v1/admin/reporter-requests/${requestId}/approve`,
        {
          method: "POST",
          headers
        }
      );

      const data = (await response.json()) as { error?: string; requestId?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not approve request");
        return;
      }

      setPending((current) => current.filter((item) => item.id !== requestId));
      setStatus(`Approved reporter request ${data.requestId ?? requestId}`);
    } catch {
      setError("Network error while approving request");
    }
  }

  return (
    <section style={{ padding: "24px 0 36px" }}>
      <article className="panel" style={{ marginBottom: 16 }}>
        <h2>Admin and moderator panel</h2>
        <p>
          Approve pending reporter requests below. Users will become approved
          reporters immediately after approval.
        </p>
        <div className="row">
          <button type="button" className="secondary" onClick={loadPending}>
            {loading ? "Refreshing..." : "Refresh queue"}
          </button>
        </div>
      </article>

      <article className="panel">
        <h3>Pending reporter requests</h3>

        {pending.length === 0 ? (
          <p className="hint">No pending reporter requests right now.</p>
        ) : (
          <div className="stack">
            {pending.map((item) => (
              <article key={item.id} className="panel" style={{ boxShadow: "none" }}>
                <p>
                  <strong>{item.displayName ?? "Unknown user"}</strong>
                  {item.email ? ` (${item.email})` : ""}
                </p>
                <p className="hint">Requested: {new Date(item.createdAt).toLocaleString()}</p>
                <p className="hint">Motivation: {item.motivation ?? "No motivation provided"}</p>
                <div className="row">
                  <button type="button" onClick={() => approveRequest(item.id)}>
                    Approve reporter
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>

      {status ? <p className="status ok">{status}</p> : null}
      {error ? <p className="status err">{error}</p> : null}
    </section>
  );
}
