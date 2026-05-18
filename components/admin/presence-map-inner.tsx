"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export type PresenceMarker = {
  sessionId: string;
  path: string;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  deviceType?: string | null;
  deviceLabel?: string | null;
  sessionDurationSec?: number;
  idleSec?: number;
  lastSeenAt?: string;
};

const pin = L.divIcon({
  html: '<div class="h-3 w-3 rounded-full bg-brand-gold-dark shadow-lg ring-2 ring-white/80"></div>',
  className: "",
  iconSize: [12, 12],
});

function formatDuration(sec?: number): string {
  if (sec == null || sec < 0) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function PresenceMapInner({
  sessions,
}: {
  sessions: PresenceMarker[];
}) {
  const pts = sessions.filter(
    (s) => typeof s.lat === "number" && typeof s.lng === "number"
  );

  const center: [number, number] =
    pts.length > 0
      ? [
          pts.reduce((sum, p) => sum + (p.lat as number), 0) / pts.length,
          pts.reduce((sum, p) => sum + (p.lng as number), 0) / pts.length,
        ]
      : [22.5937, 78.9629];

  return (
    <MapContainer
      center={center}
      zoom={pts.length ? 4 : 4}
      scrollWheelZoom={false}
      className="z-0 overflow-hidden rounded-2xl border border-zinc-800"
      style={{ height: 340, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pts.map((s) => (
        <Marker
          key={s.sessionId}
          position={[s.lat as number, s.lng as number]}
          icon={pin}
        >
          <Popup>
            <div className="text-xs text-zinc-900">
              <p className="font-semibold">{s.sessionId.slice(0, 12)}…</p>
              <p className="font-medium">{s.path}</p>
              <p className="text-zinc-600">
                {[s.city, s.country].filter(Boolean).join(", ") || "Unknown"}
              </p>
              {s.deviceLabel ? (
                <p className="mt-1 text-zinc-600">{s.deviceLabel}</p>
              ) : null}
              <p className="mt-1 text-zinc-500">
                On site {formatDuration(s.sessionDurationSec)}
                {s.idleSec != null && s.idleSec > 0
                  ? ` · idle ${s.idleSec}s`
                  : " · active now"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
