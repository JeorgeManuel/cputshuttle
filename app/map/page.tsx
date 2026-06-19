import dynamic from "next/dynamic";

const MapPrototype = dynamic(() => import("@/components/MapPrototype"), {
  ssr: false
});

export default function MapPage() {
  return (
    <section style={{ padding: "24px 0 36px" }}>
      <MapPrototype />
    </section>
  );
}
