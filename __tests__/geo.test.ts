import { haversineMeters, minDistanceToPathMeters, isWithinCorridor } from "@/lib/geo";
import type { LatLng } from "@/types/route";

describe("haversineMeters", () => {
  it("returns 0 for same point", () => {
    const p: LatLng = [-33.9, 18.6];
    expect(haversineMeters(p, p)).toBe(0);
  });

  it("computes known distance between Cape Town and Bellville roughly", () => {
    // Cape Town CBD approx (-33.9249, 18.4241)
    // Bellville approx (-33.9000, 18.6300)
    const capeTown: LatLng = [-33.9249, 18.4241];
    const bellville: LatLng = [-33.9, 18.63];
    const dist = haversineMeters(capeTown, bellville);
    // Roughly 19-20 km apart
    expect(dist).toBeGreaterThan(15000);
    expect(dist).toBeLessThan(25000);
  });

  it("is symmetric", () => {
    const a: LatLng = [-33.9, 18.5];
    const b: LatLng = [-33.85, 18.55];
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 5);
  });

  it("computes short distance accurately", () => {
    // Two points ~111m apart (0.001 degrees latitude)
    const a: LatLng = [0, 0];
    const b: LatLng = [0.001, 0];
    const dist = haversineMeters(a, b);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(120);
  });
});

describe("minDistanceToPathMeters", () => {
  it("returns POSITIVE_INFINITY for path with fewer than 2 points", () => {
    const point: LatLng = [-33.9, 18.6];
    expect(minDistanceToPathMeters(point, [])).toBe(Number.POSITIVE_INFINITY);
    expect(minDistanceToPathMeters(point, [[-33.9, 18.6]])).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns 0 for point on the path", () => {
    const path: LatLng[] = [[-33.9, 18.5], [-33.9, 18.7]];
    const point: LatLng = [-33.9, 18.6];
    const dist = minDistanceToPathMeters(point, path);
    // Should be very close to 0 (on the line)
    expect(dist).toBeLessThan(1);
  });

  it("returns distance to nearest segment", () => {
    // Path going east along latitude -33.9
    const path: LatLng[] = [[-33.9, 18.5], [-33.9, 18.6], [-33.9, 18.7]];
    // Point 0.01 degrees north of path midpoint
    const point: LatLng = [-33.89, 18.6];
    const dist = minDistanceToPathMeters(point, path);
    // ~1.1 km north (0.01 deg lat ~ 1113m)
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1200);
  });

  it("handles single-segment path", () => {
    const path: LatLng[] = [[-33.9, 18.5], [-33.9, 18.7]];
    // Point perpendicular to midpoint
    const point: LatLng = [-33.89, 18.6];
    const dist = minDistanceToPathMeters(point, path);
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1200);
  });
});

describe("isWithinCorridor", () => {
  const mainPath: LatLng[] = [[-33.9, 18.5], [-33.9, 18.6], [-33.9, 18.7]];
  const altPath: LatLng[] = [[-33.91, 18.5], [-33.91, 18.6], [-33.91, 18.7]];

  it("returns true for point on main path", () => {
    const point: LatLng = [-33.9, 18.6];
    expect(isWithinCorridor(point, mainPath, altPath, 50)).toBe(true);
  });

  it("returns true for point on alternate path", () => {
    const point: LatLng = [-33.91, 18.6];
    expect(isWithinCorridor(point, mainPath, altPath, 50)).toBe(true);
  });

  it("returns false for point far from both paths", () => {
    // ~5.5km away
    const point: LatLng = [-33.85, 18.6];
    expect(isWithinCorridor(point, mainPath, altPath, 100)).toBe(false);
  });

  it("returns true for point within buffer of main path", () => {
    // 0.0001 deg lat ~ 11m from main path
    const point: LatLng = [-33.9001, 18.6];
    expect(isWithinCorridor(point, mainPath, altPath, 50)).toBe(true);
  });

  it("returns false when buffer is 0 and point is not exactly on path", () => {
    const point: LatLng = [-33.8999, 18.6];
    expect(isWithinCorridor(point, mainPath, altPath, 0)).toBe(false);
  });
});
