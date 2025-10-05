// src/pages/AsteroidSearch.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  neoFeed,
  neoLookup,
  extractApproachInfo,
  extractDiameterKm,
  extractVelocityKmS,
} from "@/services/nasaNeo";

type NEO = any;

function fmt(num?: number, digits = 2) {
  if (num == null || Number.isNaN(num)) return "—";
  return Number(num).toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function AsteroidSearch() {
  // janela padrão: hoje até +2 dias (≤ 7)
  const today = new Date();
  const d2 = new Date();
  d2.setDate(today.getDate() + 2);

  const [start, setStart] = useState(today.toISOString().slice(0, 10));
  const [end, setEnd] = useState(d2.toISOString().slice(0, 10));
  const [magMax, setMagMax] = useState(26);
  const [minDiamKm, setMinDiamKm] = useState(0);
  const [onlyPHA, setOnlyPHA] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [items, setItems] = useState<NEO[]>([]);

  // painel侧
  const [openDetail, setOpenDetail] = useState(false);
  const [detail, setDetail] = useState<NEO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  async function loadFeed() {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setErrMsg(null);
    setItems([]);

    try {
      const data = await neoFeed(start, end, { signal: ac.signal });
      const buckets = data?.near_earth_objects || {};
      const all: NEO[] = Object.values(buckets).flat();

      const filtered = all.filter((it: any) => {
        const h = Number(it?.absolute_magnitude_h);
        const dkm = extractDiameterKm(it) ?? 0;
        const pha = !!it?.is_potentially_hazardous_asteroid;
        if (Number.isFinite(magMax) && h > magMax) return false;
        if (dkm < minDiamKm) return false;
        if (onlyPHA && !pha) return false;
        return true;
      });

      filtered.sort((a: any, b: any) => {
        const phaA = a.is_potentially_hazardous_asteroid ? 1 : 0;
        const phaB = b.is_potentially_hazardous_asteroid ? 1 : 0;
        if (phaA !== phaB) return phaB - phaA;
        return Number(a.absolute_magnitude_h) - Number(b.absolute_magnitude_h);
      });

      setItems(filtered);
    } catch (e: any) {
      setErrMsg(
        e?.message ??
          "Falha ao buscar feed (verifique a chave e mantenha a janela ≤ 7 dias)."
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  async function openLookup(id: string) {
    setOpenDetail(true);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const data = await neoLookup(id);
      setDetail(data);
    } catch (e: any) {
      setDetail({ error: e?.message || "Falha ao carregar detalhe" });
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container px-4 md:px-8 py-8">
      <h1 className="text-4xl font-bold mb-2">Pesquise Asteroides</h1>
      <p className="text-muted-foreground mb-6">
        NEOs reais via NASA NeoWs — janela ≤ 7 dias. Clique em um card para ver o detalhe.
      </p>

      {/* filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Início</label>
            <input
              type="date"
              className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Fim</label>
            <input
              type="date"
              className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">H máx.</label>
            <input
              type="number"
              className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3"
              value={magMax}
              onChange={(e) => setMagMax(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">
              Diâmetro mínimo (km)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3"
              value={minDiamKm}
              onChange={(e) => setMinDiamKm(Number(e.target.value))}
            />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyPHA}
              onChange={(e) => setOnlyPHA(e.target.checked)}
            />
            Apenas PHA
          </label>
        </div>

        <div className="flex items-end">
          <button
            onClick={loadFeed}
            disabled={loading}
            className="h-10 px-4 rounded-md bg-primary text-black font-medium disabled:opacity-60"
          >
            {loading ? "Carregando…" : "Atualizar"}
          </button>
        </div>
      </div>

      {errMsg && (
        <div className="mb-4 text-sm rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
          {errMsg}
        </div>
      )}

      {/* lista */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it: any) => {
          const id = String(it.id);
          const name = it.name || it.designation || id;
          const dkm = extractDiameterKm(it);
          const v = extractVelocityKmS(it);
          const ca = extractApproachInfo(it);
          const pha = !!it.is_potentially_hazardous_asteroid;

          return (
            <button
              key={id}
              onClick={() => openLookup(id)}
              className="text-left rounded-xl border border-white/10 bg-card/40 hover:bg-card/60 transition p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold truncate">{name}</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    pha
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {pha ? "PHA" : "Não-PHA"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                H = {fmt(it.absolute_magnitude_h)}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <InfoCell label="Diâmetro" value={`${fmt(dkm, 3)} km`} />
                <InfoCell label="Vel. rel." value={`${fmt(v, 2)} km/s`} />
                <InfoCell label="Aproximação" value={ca.date_full || "—"} />
              </div>
            </button>
          );
        })}
      </div>

      {/* painel lateral */}
      {openDetail && (
        <>
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpenDetail(false)} />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-[rgba(10,15,25,0.98)] border-l border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Detalhe do Asteroide</h2>
              <button
                className="text-sm px-3 py-1 rounded-md border border-white/15 hover:bg-white/5"
                onClick={() => setOpenDetail(false)}
              >
                Fechar
              </button>
            </div>

            {loadingDetail && <div className="text-sm">Carregando…</div>}
            {!loadingDetail && detail && !detail.error && <DetailView neo={detail} />}
            {!loadingDetail && detail?.error && (
              <div className="text-sm text-red-300">{String(detail.error)}</div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-2">
      <div className="text-muted-foreground text-[11px]">{label}</div>
      <div className="font-medium truncate">{value ?? "—"}</div>
    </div>
  );
}

function DetailView({ neo }: { neo: any }) {
  const dkm = extractDiameterKm(neo);
  const v = extractVelocityKmS(neo);
  const ca = extractApproachInfo(neo);

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <div className="text-xl font-semibold truncate">
          {neo?.name || neo?.designation || neo?.id}
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full ${
            neo?.is_potentially_hazardous_asteroid
              ? "bg-red-500/20 text-red-300 border border-red-500/40"
              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          }`}
        >
          {neo?.is_potentially_hazardous_asteroid ? "PHA" : "Não-PHA"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoCell label="ID" value={neo?.id} />
        <InfoCell label="Magnitude (H)" value={fmt(neo?.absolute_magnitude_h)} />
        <InfoCell label="Diâmetro médio" value={`${fmt(dkm, 3)} km`} />
        <InfoCell label="Vel. relativa" value={`${fmt(v, 2)} km/s`} />
        <InfoCell label="Próx. aproximação" value={ca.date_full || "—"} />
        <InfoCell label="Distância mínima" value={`${fmt(ca.miss_km)} km`} />
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Fonte: NASA NeoWs • Órbita: {ca.orbiting_body || "—"}
      </div>
    </div>
  );
}
