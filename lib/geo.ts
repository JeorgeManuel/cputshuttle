import type { LatLng } from "@/types/route";

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function toLocalXY(origin: LatLng, point: LatLng): { x: number; y: number } {
  const latMeters = 111320;
  const lngMeters = 111320 * Math.cos(toRad(origin[0]));
  return {
    x: (point[1] - origin[1]) * lngMeters,
    y: (point[0] - origin[0]) * latMeters
  };
}

function segmentDistanceMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const origin = a;
  const pXY = toLocalXY(origin, p);
  const aXY = toLocalXY(origin, a);
  const bXY = toLocalXY(origin, b);

  const abx = bXY.x - aXY.x;
  const aby = bXY.y - aXY.y;
  const apx = pXY.x - aXY.x;
  const apy = pXY.y - aXY.y;

  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) {
    return Math.sqrt(apx * apx + apy * apy);
  }

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  const closestX = aXY.x + abx * t;
  const closestY = aXY.y + aby * t;
  const dx = pXY.x - closestX;
  const dy = pXY.y - closestY;

  return Math.sqrt(dx * dx + dy * dy);
}

export function minDistanceToPathMeters(point: LatLng, path: LatLng[]): number {
  if (path.length < 2) {
    return Number.POSITIVE_INFINITY;
  }

  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length - 1; i += 1) {
    const d = segmentDistanceMeters(point, path[i], path[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

export function isWithinCorridor(
  point: LatLng,
  mainPath: LatLng[],
  alternatePath: LatLng[],
  corridorBufferM: number
): boolean {
  const dMain = minDistanceToPathMeters(point, mainPath);
  const dAlt = minDistanceToPathMeters(point, alternatePath);
  return Math.min(dMain, dAlt) <= corridorBufferM;
}
