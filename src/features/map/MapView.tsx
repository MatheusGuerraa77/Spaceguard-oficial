// src/features/map/MapView.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  impactPoint: [number, number]; // [lat, lon]
  mitigatedPoint?: [number, number];
  zones?: any; // GeoJSON FeatureCollection
  onMapClick?: (lat: number, lon: number) => void;
  showComparison?: boolean;
}

export function MapView({ impactPoint, mitigatedPoint, zones, onMapClick, showComparison }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);

  // init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: impactPoint,
      zoom: 8,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    overlayRef.current = L.layerGroup().addTo(map);

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }
  }, [impactPoint, onMapClick]);

  // update overlays
  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;

    overlay.clearLayers();

    // Impact marker
    const impactIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: #EF4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(impactPoint, { icon: impactIcon })
      .addTo(overlay)
      .bindPopup('<strong>Ponto de Impacto Original</strong>');

    // mitigated + line
    if (showComparison && mitigatedPoint) {
      const mitigatedIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 24px;
          height: 24px;
          background: #22C55E;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(mitigatedPoint, { icon: mitigatedIcon })
        .addTo(overlay)
        .bindPopup('<strong>Ponto Após Mitigação</strong>');

      L.polyline([impactPoint, mitigatedPoint], {
        color: '#22C55E',
        weight: 2,
        dashArray: '5, 10',
      }).addTo(overlay);
    }

    // zones
    if (zones?.features?.length) {
      zones.features.forEach((feature: any) => {
        const { radius_km, color, name, description } = feature.properties;
        const coords = feature.geometry.coordinates; // [lon, lat]
        L.circle([coords[1], coords[0]], {
          radius: radius_km * 1000,
          color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
        })
          .addTo(overlay)
          .bindPopup(`<strong>${name}</strong><br/>${description}`);
      });
    }

    map.setView(impactPoint, showComparison ? 7 : 8);
  }, [impactPoint, mitigatedPoint, zones, showComparison]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg" data-testid="map-view" />;
}
