import type { SimulationResponse, NEOSearchResponse } from '@/types/dto';

export const mockSimulationResponse: SimulationResponse = {
  energy_J: 1.254e16,
  energy_Mt: 3.0,
  crater_km: 0.85,
  Mw_est: 5.8,
  notes: [
    'Estimativa educacional baseada em modelos simplificados',
    '1 Mt = 4.184×10¹⁵ J (equivalente TNT)',
    'Cratera estimada usando pi-scaling aproximado',
    'Magnitude sísmica calculada com fração de acoplamento',
  ],
  zones: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          zone: 1,
          name: 'Zona 1 - Forte',
          description: 'Danos severos esperados',
          color: '#EF4444',
          radius_km: 15,
        },
        geometry: {
          type: 'Point',
          coordinates: [-46.6333, -23.5505],
        },
      },
      {
        type: 'Feature',
        properties: {
          zone: 2,
          name: 'Zona 2 - Moderada',
          description: 'Danos moderados esperados',
          color: '#F59E0B',
          radius_km: 35,
        },
        geometry: {
          type: 'Point',
          coordinates: [-46.6333, -23.5505],
        },
      },
      {
        type: 'Feature',
        properties: {
          zone: 3,
          name: 'Zona 3 - Leve',
          description: 'Efeitos leves esperados',
          color: '#FBBF24',
          radius_km: 65,
        },
        geometry: {
          type: 'Point',
          coordinates: [-46.6333, -23.5505],
        },
      },
    ],
  },
};

export const mockNEOSearchResponse: NEOSearchResponse = [
  {
    id: '3122',
    name: 'Florence',
    estimated_diameter_m: 4500,
  },
  {
    id: '433',
    name: 'Eros',
    estimated_diameter_m: 16840,
  },
  {
    id: '99942',
    name: 'Apophis',
    estimated_diameter_m: 370,
  },
];
