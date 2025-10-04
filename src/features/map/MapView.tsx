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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: impactPoint,
        zoom: 8,
        zoomControl: true,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(mapRef.current);

      // Map click handler
      if (onMapClick) {
        mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    const map = mapRef.current;

    // Clear previous layers (markers and zones)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // Add impact point marker
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
      .addTo(map)
      .bindPopup('<strong>Ponto de Impacto Original</strong>');

    // Add mitigated point if comparison mode
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
        .addTo(map)
        .bindPopup('<strong>Ponto Após Mitigação</strong>');

      // Draw line between points
      L.polyline([impactPoint, mitigatedPoint], {
        color: '#22C55E',
        weight: 2,
        dashArray: '5, 10',
      }).addTo(map);
    }

    // Add zones if provided
    if (zones && zones.features) {
      zones.features.forEach((feature: any) => {
        const { radius_km, color, name, description } = feature.properties;
        const coords = feature.geometry.coordinates;

        L.circle([coords[1], coords[0]], {
          radius: radius_km * 1000, // convert km to meters
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(`<strong>${name}</strong><br/>${description}`);
      });
    }

    // Center map on impact point
    map.setView(impactPoint, showComparison ? 7 : 8);

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [impactPoint, mitigatedPoint, zones, onMapClick, showComparison]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-lg"
      data-testid="map-view"
    />
  );
}
