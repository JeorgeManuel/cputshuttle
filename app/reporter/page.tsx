"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthHeaders } from "@/lib/client-auth";

type SessionResponse = {
  id: string;
  userId: string;
  routeId: string;
  startedAt: string;
  endedAt: string | null;
};

type RouteSummary = {
  id: string;
  name: string;
  mainPath?: Array<[number, number]>;
};

function getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function describeGeoError(error: GeolocationPositionError): string {
  if (error.code === 1) {
    return "Location permission denied. Enable location permission for this site/app and try again.";
  }

  if (error.code === 2) {
    return "Location unavailable. Check phone location services and GPS are enabled.";
  }

  if (error.code === 3) {
    return "Location request timed out. Move to open sky and try again.";
  }

  return error.message || "Could not read device location.";
}

export default function ReporterPage() {
  const { token, user, headers } = useAuthHeaders();
  const [sessionId, setSessionId] = useState<string>("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [motivation, setMotivation] = useState("");
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("bellville-d6");
  const [autoSharing, setAutoSharing] = useState(false);
  const [autoIntervalSec, setAutoIntervalSec] = useState(20);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem("st_reporter_session_id");
    setSessionId(storedSession ?? "");
    const savedRoute = localStorage.getItem("st_selected_route_id");
    if (savedRoute) setSelectedRouteId(savedRoute);
  }, []);

  useEffect(() => {
    async function loadRoutes() {
      const response = await fetch("/api/v1/routes");
      const data = (await response.json()) as { routes: RouteSummary[] };
      setRoutes(data.routes ?? []);

      if (!localStorage.getItem("st_selected_route_id") && data.routes?.length) {
        setSelectedRouteId(data.routes[0].id);
      }
    }

    loadRoutes();
  }, []);

  function stopAutoSharing() {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    setAutoSharing(false);
  }

  useEffect(() => {
    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
      }
    };
  }, []);

  async function postPing(lat: number, lng: number, accuracyM: number) {
    if (!headers || !sessionId) {
      setError("Start a reporter session before sending pings");
      return;
    }

    const response = await fetch("/api/v1/location-pings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        routeId: selectedRouteId,
        sessionId,
        lat,
        lng,
        accuracyM,
        capturedAtClient: new Date().toISOString()
      })
    });

    const data = (await response.json()) as {
      accepted: boolean;
      reason: string | null;
    };

    if (!response.ok || !data.accepted) {
      setError(`Ping rejected: ${data.reason ?? "unknown_reason"}`);
      return;
    }

    setStatus("Ping accepted and recorded for analysis");
  }

  async function locateAndPostPing() {
    if (!headers || !sessionId) {
      setError("Start a reporter session before sending pings");
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser. Use Send test ping (no GPS).");
      return;
    }

    if (!window.isSecureContext) {
      setError(
        "Location needs HTTPS on mobile. Use npm run dev:https, tunnel, or Send test ping (no GPS)."
      );
      return;
    }

    try {
      let position: GeolocationPosition;

      try {
        position = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      } catch {
        position = await getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 30000
        });
      }

      await postPing(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy
      );
    } catch (geoError) {
      const message =
        geoError && typeof geoError === "object" && "code" in geoError
          ? describeGeoError(geoError as GeolocationPositionError)
          : "Could not read device location";

      setError(message);
    }
  }

  async function requestReporterAccess() {
    if (!headers) {
      setError("Login first to request reporter access");
      return;
    }

    setError("");
    setStatus("");

    const response = await fetch("/api/v1/reporter-requests", {
      method: "POST",
      headers,
      body: JSON.stringify({ motivation })
    });
    const data = (await response.json()) as { error?: string; id?: string };

    if (!response.ok) {
      setError(data.error ?? "Could not create reporter request");
      return;
    }

    setStatus(`Reporter request submitted (${data.id})`);
  }

  async function startReporterSession() {
    if (!headers) {
      setError("Login first to start a reporter session");
      return;
    }

    setError("");
    setStatus("");

    const response = await fetch("/api/v1/reporter-sessions", {
      method: "POST",
      headers,
      body: JSON.stringify({ routeId: selectedRouteId })
    });

    const data = (await response.json()) as SessionResponse | { error?: string };
    if (!response.ok) {
      setError((data as { error?: string }).error ?? "Could not start session");
      return;
    }

    const session = data as SessionResponse;
    setSessionId(session.id);
    localStorage.setItem("st_reporter_session_id", session.id);
    localStorage.setItem("st_selected_route_id", selectedRouteId);
    setStatus(`Reporter session active: ${session.id}`);
  }

  async function stopReporterSession() {
    if (!headers || !sessionId) {
      setError("No active reporter session");
      return;
    }

    setError("");
    setStatus("");

    const response = await fetch(`/api/v1/reporter-sessions/${sessionId}/stop`, {
      method: "POST",
      headers
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Could not stop session");
      return;
    }

    stopAutoSharing();
    localStorage.removeItem("st_reporter_session_id");
    setSessionId("");
    setStatus("Reporter session stopped");
  }

  async function sendPing() {
    setError("");
    setStatus("Fetching your location...");
    await locateAndPostPing();
  }

  async function startAutoLocationUpdates() {
    if (!headers || !sessionId) {
      setError("Start a reporter session before enabling auto-share");
      return;
    }

    if (autoSharing) {
      return;
    }

    const intervalMs = Math.max(5, autoIntervalSec) * 1000;
    setError("");
    setStatus(`Auto-share enabled (${Math.max(5, autoIntervalSec)}s interval)`);
    setAutoSharing(true);

    await locateAndPostPing();

    autoTimerRef.current = setInterval(() => {
      void locateAndPostPing();
    }, intervalMs);
  }

  async function sendTestPingNoGps() {
    if (!headers || !sessionId) {
      setError("Start a reporter session before sending pings");
      return;
    }

    setError("");
    setStatus("Sending test ping using selected route coordinates...");

    const route = routes.find((item) => item.id === selectedRouteId);
    const path = route?.mainPath ?? [];

    if (path.length === 0) {
      setError("No route coordinates found for selected route");
      return;
    }

    const point = path[Math.floor(path.length / 2)];
    await postPing(point[0], point[1], 25);
  }

  return (
    <section style={{ padding: "24px 0 36px" }}>
      <article className="panel" style={{ marginBottom: 16 }}>
        <h2>Reporter controls</h2>
        <p className="hint">
          Login first, request approval, start a session, then send pings.
        </p>
        <p className="hint">
          Current user: {user ? `${user.displayName} (${user.role})` : "Not logged in"}
        </p>
        <p className="hint">
          Reporter count reflects unique user accounts with recent accepted pings.
          Two devices on the same login still count as one reporter.
        </p>
        {!token ? (
          <p className="hint">No session found. Open Login or Register from the top navigation.</p>
        ) : null}
        <label className="field" style={{ marginTop: 8 }}>
          Active route
          <select
            value={selectedRouteId}
            onChange={(event) => {
              const next = event.target.value;
              setSelectedRouteId(next);
              localStorage.setItem("st_selected_route_id", next);
            }}
          >
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
        </label>
      </article>

      <article className="panel stack">
        <label className="field">
          Reporter motivation (optional)
          <textarea
            value={motivation}
            onChange={(event) => setMotivation(event.target.value)}
            rows={3}
            placeholder="Why you want to help test"
          />
        </label>

        <div className="row">
          <button type="button" onClick={requestReporterAccess}>
            Request reporter access
          </button>
          <button type="button" className="secondary" onClick={startReporterSession}>
            Start session
          </button>
          <button type="button" className="secondary" onClick={stopReporterSession}>
            Stop session
          </button>
          <button type="button" onClick={startAutoLocationUpdates}>
            Start auto-share
          </button>
          <button type="button" className="secondary" onClick={stopAutoSharing}>
            Stop auto-share
          </button>
        </div>

        <label className="field" style={{ maxWidth: 260 }}>
          Auto-share interval (seconds)
          <input
            type="number"
            min={5}
            step={1}
            value={autoIntervalSec}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) setAutoIntervalSec(next);
            }}
          />
        </label>

        <p className="hint">Active session: {sessionId || "none"}</p>
        <p className="hint">Auto-share: {autoSharing ? "enabled" : "disabled"}</p>
      </article>

      {status ? <p className="status ok">{status}</p> : null}
      {error ? <p className="status err">{error}</p> : null}
    </section>
  );
}
