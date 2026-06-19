import route from "@/data/routes/bellville-d6.json";
import type { ShuttleRouteSeed } from "@/types/route";

export function getBellvilleD6Route(): ShuttleRouteSeed {
  return route as ShuttleRouteSeed;
}

export function getAllRoutes(): ShuttleRouteSeed[] {
  return [route as ShuttleRouteSeed];
}

export function getRouteById(routeId: string): ShuttleRouteSeed | null {
  return getAllRoutes().find((item) => item.id === routeId) ?? null;
}
