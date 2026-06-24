"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveEstimate, ShuttleRouteSeed } from "@/types/route";
import { reliabilityLabel } from "@/lib/reliability";

type RouteResponse = { routes: ShuttleRouteSeed[] };
type LiveResponse = { estimates: LiveEstimate[] };

export default function MapPrototype() {
  const [routes, setRoutes] = useState<ShuttleRouteSeed[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [estimates, setEstimates] = useState<LiveEstimate[]>([]);

  const route = useMemo(
    () => routes.find((item) => item.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
  );

  useEffect(() => {
    async function loadRoutes() {
      try {
        const response = await fetch("/api/v1/routes");
        if (!response.ok) {
          console.error("Failed to load routes:", response.status);
          return;
        }
        const data = (await response.json()) as RouteResponse;
        const loadedRoutes = data.routes ?? [];
        setRoutes(loadedRoutes);

        const saved = localStorage.getItem("st_map_route_id");
        const hasSaved = saved && loadedRoutes.some((item) => item.id === saved);
        const nextId = hasSaved ? (saved as string) : loadedRoutes[0]?.id ?? "";
        setSelectedRouteId(nextId);
      } catch (error) {
        console.error("Network error while loading routes:", error);
      }
    }

    loadRoutes();
  }, []);

  useEffect(() => {
    if (!selectedRouteId) return;
    const routeId = selectedRouteId;

    let active = true;

    async function loadLive() {
      try {
        const response = await fetch(`/api/v1/routes/${routeId}/live`);
        if (!response.ok) {
          console.error("Failed to load live estimates:", response.status);
          return;
        }
        const data = (await response.json()) as LiveResponse;
        if (active) {
          setEstimates(data.estimates ?? []);
        }
      } catch (error) {
        console.error("Network error while loading live estimates:", error);
      }
    }

    loadLive();
    const timer = window.setInterval(loadLive, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedRouteId]);

  const center = useMemo<[number, number]>(() => {
    if (!route) return [-33.919, 18.54];
    const middle = route.mainPath[Math.floor(route.mainPath.length / 2)];
    return [middle[0], middle[1]];
  }, [route]);

  if (!route) {
    return <p>Loading route data...</p>;
  }

  return (
    <div className="grid">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h2>{route.name} Live Prototype</h2>
        <label className="field" style={{ marginTop: 8, maxWidth: 340 }}>
          Display route
          <select
            value={selectedRouteId}
            onChange={(event) => {
              const next = event.target.value;
              setSelectedRouteId(next);
              localStorage.setItem("st_map_route_id", next);
              setEstimates([]);
            }}
          >
            {routes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <p>
          Public status is shown even with a single reporter. Reliability score
          rises as more reporters agree on position.
        </p>
        {estimates.length === 0 ? (
          <p className="hint">
            No live reporters currently active. Map is showing route-only mode.
          </p>
        ) : null}
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="map-wrap">
          <MapContainer center={center} zoom={12} scrollWheelZoom className="map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Polyline positions={route.mainPath} pathOptions={{ color: "#1c7f5f", weight: 6 }} />
            <Polyline
              positions={route.alternatePath}
              pathOptions={{ color: "#f4b942", weight: 5, dashArray: "8 6" }}
            />

            {route.stops.map((stop) => (
              <CircleMarker
                key={stop.id}
                center={[stop.lat, stop.lng]}
                radius={6}
                pathOptions={{ color: "#11211d", fillColor: "#11211d", fillOpacity: 0.95 }}
              >
                <Popup>{stop.name}</Popup>
              </CircleMarker>
            ))}

            {estimates.map((est) => (
              <CircleMarker
                key={`${est.shuttleSlot}-${est.generatedAt}`}
                center={[est.lat, est.lng]}
                radius={10}
                pathOptions={{
                  color: est.shuttleSlot === "A" ? "#0f4f3c" : "#a26809",
                  fillColor: est.shuttleSlot === "A" ? "#1c7f5f" : "#f4b942",
                  fillOpacity: 0.85
                }}
              >
                <Popup>
                  Shuttle {est.shuttleSlot} ({est.direction.replace("to_", "to ")})
                  <br />
                  Reliability: {Math.round(est.reliabilityScore * 100)}% ({reliabilityLabel(est.reliabilityScore)})
                  <br />
                  Reporters: {est.reporterCount}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>

      <section className="panel">
        <h3>Main path</h3>
        <p>Solid green line represents the default route corridor.</p>
      </section>

      <section className="panel">
        <h3>Alternative path</h3>
        <p>Dashed amber line represents the rare alternative path corridor.</p>
      </section>
    </div>
  );
}
