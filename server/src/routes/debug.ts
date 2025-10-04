import { Router } from 'express';
import { pingDB } from '../db';

const router = Router();

router.get('/db-ping', async (_req, res, next) => {
  try {
    const now = await pingDB();
    res.json({ ok: true, now });
  } catch (e) { next(e); }
});

export default router;
