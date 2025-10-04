import { Router } from 'express';
import { runSimulation, type SimulationInput } from '../lib/physics';
import { getElevationMeters } from '../services/usgs';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const body = req.body as SimulationInput;
    let terrain = body.terrain;
    if (terrain === 'auto') {
      const elev = await getElevationMeters(body.lat, body.lon);
      if (elev !== null) terrain = elev <= 0 ? 'water' : 'land';
    }
    const out = runSimulation({ ...body, terrain: terrain ?? body.terrain });
    res.json({ ok: true, data: out });
  } catch (e) { next(e); }
});

export default router;
