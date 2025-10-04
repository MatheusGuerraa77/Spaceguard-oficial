import { z } from 'zod';

// Simulation Request Schema
export const SimulationRequestSchema = z.object({
  diameter_m: z.number().positive('Diâmetro deve ser maior que zero'),
  density_kgm3: z.number().positive('Densidade deve ser maior que zero'),
  velocity_ms: z.number().positive('Velocidade deve ser maior que zero'),
  angle_deg: z.number().min(0).max(90, 'Ângulo deve estar entre 0° e 90°'),
  lat: z.number().min(-90).max(90, 'Latitude deve estar entre -90° e 90°'),
  lon: z.number().min(-180).max(180, 'Longitude deve estar entre -180° e 180°'),
  terrain: z.enum(['ocean', 'land']),
  coupling: z.number().min(0).max(0.05).optional().default(0.02),
  delta_v_ms: z.number().optional(),
  days_before: z.number().positive().optional(),
});

export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

// Simulation Response Schema
export const SimulationResponseSchema = z.object({
  energy_J: z.number(),
  energy_Mt: z.number(),
  crater_km: z.number().nullable(),
  Mw_est: z.number(),
  zones: z.any(), // GeoJSON.FeatureCollection
  notes: z.array(z.string()),
});

export type SimulationResponse = z.infer<typeof SimulationResponseSchema>;

// NEO Search Response
export const NEOSearchItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  estimated_diameter_m: z.number(),
  orbit: z.any().optional(),
});

export const NEOSearchResponseSchema = z.array(NEOSearchItemSchema);

export type NEOSearchItem = z.infer<typeof NEOSearchItemSchema>;
export type NEOSearchResponse = z.infer<typeof NEOSearchResponseSchema>;

// NEO Lookup Response
export const NEOLookupResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  estimated_diameter_m: z.number(),
  absolute_magnitude_h: z.number().optional(),
  is_potentially_hazardous: z.boolean().optional(),
  close_approach_data: z.any().optional(),
  orbital_data: z.any().optional(),
});

export type NEOLookupResponse = z.infer<typeof NEOLookupResponseSchema>;
