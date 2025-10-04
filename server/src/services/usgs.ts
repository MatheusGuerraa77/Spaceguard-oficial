import axios from 'axios';

export async function getElevationMeters(lat: number, lon: number): Promise<number | null> {
  try {
    const { data } = await axios.get('https://nationalmap.gov/epqs/pqs.php', {
      params: { x: lon, y: lat, units: 'Meters', output: 'json' },
      timeout: 5000,
    });
    const v = data?.USGS_Elevation_Point_Query_Service?.Elevation_Query?.Elevation;
    return (v !== undefined && v !== null) ? Number(v) : null;
  } catch {
    return null;
  }
}
