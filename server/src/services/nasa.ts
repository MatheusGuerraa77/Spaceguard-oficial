import axios from 'axios';

const NASA_API = 'https://api.nasa.gov/neo/rest/v1';
const apiKey = () => {
  const k = process.env.NASA_API_KEY;
  if (!k) throw new Error('Missing NASA_API_KEY');
  return k;
};

// 🔁 Busca em várias páginas do /neo/browse e filtra por nome/designação/id
export async function searchNEO(query: string) {
  const q = normalize(query);
  const pageCount = 10;               // busca até 10 páginas (≈1000 objetos)
  const size = 100;

  const all: any[] = [];
  for (let page = 0; page < pageCount; page++) {
    const { data } = await axios.get(`${NASA_API}/neo/browse`, {
      params: { api_key: apiKey(), size, page },
      timeout: 15000,
    });
    const chunk = data?.near_earth_objects ?? [];
    all.push(...chunk);
    // sai cedo se atingimos o total
    if (!data?.page || page >= (data.page.total_pages ?? pageCount) - 1) break;
  }

  const filtered = all.filter((n) => {
    const name = normalize(n.name);
    const des  = normalize(n.designation);
    const id   = String(n.neo_reference_id || n.id || '').toLowerCase();
    return name.includes(q) || des.includes(q) || id.includes(q);
  });

  return filtered.slice(0, 12).map((n) => ({
    id: n.id,
    neo_reference_id: n.neo_reference_id,
    name: n.name,
    designation: n.designation,
    est_diameter_m: meanDiameterMeters(n),
    absolute_magnitude_h: n.absolute_magnitude_h,
    is_potentially_hazardous_asteroid: n.is_potentially_hazardous_asteroid,
  }));
}

export async function getNEO(id: string) {
  const { data } = await axios.get(`${NASA_API}/neo/${id}`, {
    params: { api_key: apiKey() },
  });
  return {
    id: data.id,
    name: data.name,
    designation: data.designation,
    est_diameter_m: meanDiameterMeters(data),
    absolute_magnitude_h: data.absolute_magnitude_h,
    close_approach_data: (data.close_approach_data ?? []).map((c: any) => ({
      date: c.close_approach_date_full || c.close_approach_date,
      velocity_kms: Number(c.relative_velocity.kilometers_per_second),
      miss_distance_km: Number(c.miss_distance.kilometers),
      orbiting_body: c.orbiting_body,
    })),
  };
}

function meanDiameterMeters(n: any) {
  const m = n.estimated_diameter?.meters;
  if (!m) return null;
  return (Number(m.estimated_diameter_min) + Number(m.estimated_diameter_max)) / 2;
}

// remove parênteses, vírgulas e normaliza
function normalize(s: string) {
  return (s || '')
    .toString()
    .toLowerCase()
    .replace(/[()_,\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
