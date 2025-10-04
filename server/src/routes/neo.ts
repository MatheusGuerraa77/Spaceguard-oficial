import { Router } from 'express';
import { getNEO, searchNEO } from '../services/nasa';

const router = Router();

router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (!q) return res.json({ ok: true, data: [] });
    const data = await searchNEO(q);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await getNEO(req.params.id);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
});

export default router;
