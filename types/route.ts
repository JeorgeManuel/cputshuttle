export type LatLng = [number, number];

export type ShuttleRouteSeed = {
  id: string;
  name: string;
  mainPath: LatLng[];
  alternatePath: LatLng[];
  stops: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    sequence: number;
  }[];
};

export type LiveEstimate = {
  routeId: string;
  shuttleSlot: "A" | "B";
  direction: string;
  lat: number;
  lng: number;
  reliabilityScore: number;
  reporterCount: number;
  generatedAt: string;
};
