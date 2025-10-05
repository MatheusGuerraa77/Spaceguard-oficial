// src/features/map/MapView.tsx
import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
  useMapEvent,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type Zone = {
  level: 1 | 2 | 3;      // 1 = forte, 2 = moderada, 3 = leve
  radius_km: number;     // raio em km
};

type MapViewProps = {
  impactPoint: [number, number];   // [lat, lon]
  zones?: Zone[];                  // vindo da simulação
  onMapClick?: (lat: number, lon: number) => void;
};

// ---------- helpers de estilo ----------
const styles = {
  ring1: { color: "#ef4444", fill: true, fillColor: "#ef4444", fillOpacity: 0.25, weight: 2 },
  ring2: { color: "#f59e0b", fill: true, fillColor: "#f59e0b", fillOpacity: 0.18, weight: 2 },
  ring3: { color: "#eab308", fill: true, fillColor: "#eab308", fillOpacity: 0.12, weight: 2 },
};

// fallback suave quando não há zones calculadas
function fallbackZones(): Zone[] {
  return [
    { level: 1, radius_km: 10 },
    { level: 2, radius_km: 25 },
    { level: 3, radius_km: 50 },
  ];
}

// Componente para centralizar quando impactPoint muda
function FlyTo({ center }: { center: LatLngExpression }) {
  const map = useMap();
  const firstRun = useRef(true);

  useEffect(() => {
    // na primeira render usa setView pra não animar (fica “clean”)
    if (firstRun.current) {
      firstRun.current = false;
      map.setView(center, Math.max(map.getZoom(), 9));
      return;
    }
    map.flyTo(center, Math.max(map.getZoom(), 9), { duration: 0.7 });
  }, [center, map]);

  return null;
}

// Captura clique no mapa (não use MapContainer.onClick — o tipo não aceita)
function MapClickHandler({ onClick }: { onClick?: (lat: number, lon: number) => void }) {
  useMapEvent("click", (ev) => {
    if (!onClick) return;
    onClick(ev.latlng.lat, ev.latlng.lng);
  });
  return null;
}

// ---------- legenda ----------
function Legend() {
  const Dot = ({ className }: { className: string }) => (
    <span className={`inline-block w-3 h-3 rounded-full ${className}`} />
  );

  return (
    <div
      className="leaflet-bottom leaflet-left"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="m-3 rounded-lg px-3 py-2 text-[13px]"
        style={{
          background: "rgba(8,12,20,0.90)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.88)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          pointerEvents: "auto",
        }}
      >
        <div className="font-semibold mb-1">Legenda das Zonas de Impacto</div>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Dot className="bg-red-500" />
            <div>
              <div className="font-medium">Zona 1 – Forte</div>
              <div className="text-xs text-white/70">
                Danos severos esperados, destruição significativa
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Dot className="bg-amber-500" />
            <div>
              <div className="font-medium">Zona 2 – Moderada</div>
              <div className="text-xs text-white/70">
                Danos moderados, janelas quebradas, ferimentos possíveis
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Dot className="bg-yellow-400" />
            <div>
              <div className="font-medium">Zona 3 – Leve</div>
              <div className="text-xs text-white/70">
                Efeitos leves, ondas de choque audíveis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- principal ----------
export function MapView({ impactPoint, zones, onMapClick }: MapViewProps) {
  // normaliza zonas (ordena do maior pro menor pra desenhar sem “tampar” as de dentro)
  const rings = useMemo(() => {
    const src = (zones && zones.length > 0 ? zones : fallbackZones()).slice();
    src.sort((a, b) => (b.radius_km ?? 0) - (a.radius_km ?? 0));
    return src;
  }, [zones]);

  const center: LatLngExpression = [impactPoint[0], impactPoint[1]];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={9}
        minZoom={3}
        maxZoom={18}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
        attributionControl
        scrollWheelZoom
        whenReady={() => { /* no-op para satisfazer o tipo */ }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* centraliza/fly ao mudar o ponto */}
        <FlyTo center={center} />

        {/* clique no mapa → devolve lat/lon para o formulário */}
        <MapClickHandler onClick={onMapClick} />

        {/* círculos concêntricos */}
        {rings.map((z) => {
          const rMeters = Math.max(0, (z.radius_km ?? 0) * 1000);
          const style =
            z.level === 1 ? styles.ring1 : z.level === 2 ? styles.ring2 : styles.ring3;

          return (
            <Circle
              key={`${z.level}-${rMeters}`}
              center={center}
              radius={rMeters}
              pathOptions={style as any}
            />
          );
        })}

        {/* marcador central */}
        <CircleMarker
          center={center}
          radius={8}
          pathOptions={{ color: "#ef4444", fillColor: "#fff", fillOpacity: 1, weight: 3 }}
        />
      </MapContainer>

      {/* legenda fixa */}
      <Legend />
    </div>
  );
}

export default MapView;
