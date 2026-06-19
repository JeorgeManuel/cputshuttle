"use client";

import { useEffect, useState } from "react";

type Contributor = {
  id: string;
  displayName: string;
  roleLabel: string;
  joinedAt: string;
};

type ContributorResponse = {
  totals: {
    admins: number;
    reporters: number;
  };
  admins: Contributor[];
  reporters: Contributor[];
};

export default function ContributorsPage() {
  const [data, setData] = useState<ContributorResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContributors() {
      try {
        const response = await fetch("/api/v1/contributors");
        const body = (await response.json()) as ContributorResponse | { error?: string };

        if (!response.ok) {
          setError((body as { error?: string }).error ?? "Could not load contributors");
          return;
        }

        setData(body as ContributorResponse);
      } catch {
        setError("Network error while loading contributors");
      }
    }

    loadContributors();
  }, []);

  return (
    <section style={{ padding: "24px 0 36px" }}>
      <article className="panel" style={{ marginBottom: 16 }}>
        <span className="badge">Community Credits</span>
        <h2>Contributors</h2>
        <p>
          Thanks to everyone helping power shuttle visibility for students. Admins
          keep the system healthy and reporters provide the live data.
        </p>
      </article>

      {error ? <p className="status err">{error}</p> : null}

      {data ? (
        <>
          <article className="panel" style={{ marginBottom: 16 }}>
            <p>
              <strong>Admins:</strong> {data.totals.admins} | <strong>Approved Reporters:</strong>{" "}
              {data.totals.reporters}
            </p>
          </article>

          <div className="grid">
            <article className="panel">
              <h3>Admins</h3>
              {data.admins.length === 0 ? (
                <p className="hint">No admins recorded yet.</p>
              ) : (
                <div className="stack">
                  {data.admins.map((admin) => (
                    <div key={admin.id} className="panel" style={{ boxShadow: "none" }}>
                      <p>
                        <strong>{admin.displayName}</strong>
                      </p>
                      <p className="hint">{admin.roleLabel}</p>
                      <p className="hint">Joined: {new Date(admin.joinedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="panel">
              <h3>Reporters</h3>
              {data.reporters.length === 0 ? (
                <p className="hint">No approved reporters yet.</p>
              ) : (
                <div className="stack">
                  {data.reporters.map((reporter) => (
                    <div key={reporter.id} className="panel" style={{ boxShadow: "none" }}>
                      <p>
                        <strong>{reporter.displayName}</strong>
                      </p>
                      <p className="hint">{reporter.roleLabel}</p>
                      <p className="hint">Joined: {new Date(reporter.joinedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
