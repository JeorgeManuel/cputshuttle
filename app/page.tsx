import Link from "next/link";

export default function HomePage() {
  return (
    <section style={{ padding: "24px 0 36px" }}>
      <div className="panel" style={{ marginBottom: 16 }}>
        <span className="badge">Bellville to D6 Beta</span>
        <h2>Community-powered shuttle visibility</h2>
        <p>
          This beta replaces dedicated in-vehicle hardware by using approved
          participants as live location contributors through their phones.
        </p>
        <p>
          Public status remains visible even with one reporter. Reliability rises
          when multiple reporters agree on shuttle position.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn" href="/map">
            Open live map
          </Link>
          <Link className="btn secondary" href="/register">
            Create account
          </Link>
        </div>
      </div>

      <div className="grid">
        <article className="panel">
          <h3>Reporter approval model</h3>
          <p>
            Anyone can request to report. Admin approval is required before
            location pings count toward live shuttle estimates.
          </p>
        </article>

        <article className="panel">
          <h3>Route-constrained validation</h3>
          <p>
            Pings are accepted only if they fall on the preprogrammed main or
            alternate Bellville to D6 path corridor.
          </p>
        </article>
      </div>
    </section>
  );
}
