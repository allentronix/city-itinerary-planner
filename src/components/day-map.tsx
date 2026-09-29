import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import type { LocatedPlace } from "../utils/geo";

// OpenStreetMap's free map images. Fine for a small app with the credit shown;
// heavy traffic would need a commercial map provider.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MARKER_SIZE = 24;

// Numbered HTML markers, which avoid Leaflet's image-based pins (they break in bundlers).
function numberedIcon(number: number) {
  return divIcon({
    html: String(number),
    className: "day-map-marker",
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
  });
}

interface DayMapProps {
  // The day's stops in visiting order.
  stops: LocatedPlace[];
}

// A map of one day's stops, numbered and joined in visiting order.
function DayMap({ stops }: DayMapProps) {
  const points = stops.map((stop) => [stop.lat, stop.lon] as [number, number]);

  return (
    <MapContainer
      bounds={points}
      boundsOptions={{ padding: [30, 30], maxZoom: 16 }}
      scrollWheelZoom={false}
      className="z-0 h-64 w-full border"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

      <Polyline
        positions={points}
        pathOptions={{ color: "#1e293b", weight: 3, dashArray: "6 6" }}
      />

      {stops.map((stop, index) => (
        <Marker
          key={`${stop.id}-${index}`}
          position={[stop.lat, stop.lon]}
          icon={numberedIcon(index + 1)}
          title={stop.name}
        >
          <Tooltip direction="top" offset={[0, -MARKER_SIZE / 2]}>
            {stop.name}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default DayMap;
