// server/src/routes/neo.ts
import { Router } from "express";
import { getNeoFeed, getNeoBrowse, getNEO, searchNEO } from "../services/nasa";

const r = Router();

r.get("/feed", async (req, res) => {
  try {
    const start = String(req.query.start || "");
    const end = req.query.end ? String(req.query.end) : undefined;
    const data = await getNeoFeed(start, end);
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(e?.status || 500).json({ ok: false, error: e.message || "Erro no feed" });
  }
});

r.get("/browse", async (req, res) => {
  try {
    const page = Number(req.query.page ?? 0);
    const size = Number(req.query.size ?? 20);
    const data = await getNeoBrowse(page, size);
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(e?.status || 500).json({ ok: false, error: e.message || "Erro no browse" });
  }
});

r.get("/lookup/:id", async (req, res) => {
  try {
    const data = await getNEO(req.params.id);
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(e?.status || 500).json({ ok: false, error: e.message || "Erro no lookup" });
  }
});

r.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "");
    const data = await searchNEO(q);
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(e?.status || 500).json({ ok: false, error: e.message || "Erro na busca" });
  }
});

export default r;
