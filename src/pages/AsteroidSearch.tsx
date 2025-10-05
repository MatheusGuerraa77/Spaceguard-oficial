// src/pages/AsteroidSearch.tsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchNeoFeed, getNeoById } from "@/services/neo";
import SolarBackdrop from "@/components/space/SolarBackdrop";
import type { NEOSearchItem } from "@/types/dto";

/* ==============
   Tipo da página
   ============== */
type Asteroid = {
  id: string;
  name: string;
  pha: boolean;
  hMag: number | null;
  minDiaKm: number | null;
  maxDiaKm: number | null;
  orbitClass: string | null;
  closeApproachDate?: string | null;
  missKm?: number | null;
  velKms?: number | null;
};

/* ---------------- UI bits ---------------- */

function PhaBadge({ pha }: { pha: boolean }) {
  if (!pha) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/20 px-2 py-0.5 text-[11px]">
        Não-PHA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-500/12 text-red-300 ring-1 ring-red-400/20 px-2 py-0.5 text-[11px]">
      PHA
    </span>
  );
}

function Label({ k, v }: { k: string; v: string }) {
  return (
    <p className="text-[13px] leading-6">
      <span className="text-white/60">{k}: </span>
      <span className="text-white/85">{v}</span>
    </p>
  );
}

/* ---------------- Drawer ---------------- */

function DetailsDrawer({
  item,
  onClose,
}: {
  item: Asteroid | null;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex" aria-modal role="dialog" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25 }}
        className="ml-auto h-full w-full max-w-md bg-[#0b0f17]/95 border-l border-white/10 p-5 backdrop-blur-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <button className="text-sm text-white/70 hover:text-white" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="space-y-3 text-sm text-white/85">
          <div className="flex items-center gap-2">
            <PhaBadge pha={item.pha} />
            {item.orbitClass && (
              <span className="px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-[11px]">
                {item.orbitClass}
              </span>
            )}
          </div>
          <Label k="ID" v={item.id} />
          <Label k="Magnitude (H)" v={`${item.hMag ?? "—"}`} />
          <Label
            k="Diâmetro estimado"
            v={
              item.minDiaKm != null && item.maxDiaKm != null
                ? `${item.minDiaKm} – ${item.maxDiaKm} km`
                : "—"
            }
          />
          <Label k="Próx. aproximação" v={`${item.closeApproachDate ?? "—"}`} />
          <Label
            k="Dist. mínima"
            v={item.missKm != null ? `${item.missKm.toLocaleString()} km` : "—"}
          />
          <Label
            k="Vel. relativa"
            v={item.velKms != null ? `${item.velKms.toFixed(2)} km/s` : "—"}
          />

          {/* placeholder visual */}
          <div className="mt-3 rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-3">
            <svg viewBox="0 0 220 120" className="w-full h-36">
              <defs>
                <radialGradient id="sun" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#ffe082" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#ffe082" stopOpacity="0.0" />
                </radialGradient>
              </defs>
              <circle cx="110" cy="60" r="24" fill="url(#sun)" />
              <ellipse cx="110" cy="60" rx="88" ry="26" stroke="#7aa2ff55" fill="none" />
              <circle cx="32" cy="58" r="3" fill="#7aa2ff" />
              <text x="40" y="62" fontSize="8" fill="#cde3ff">
                {item.name}
              </text>
            </svg>
            <p className="text-[11px] text-white/60">* Ilustração estética.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDaysISO = (d = 1) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

/* ---------------- Page ---------------- */

export default function AsteroidSearch() {
  // janela (feed aceita até 7 dias)
  const [start, setStart] = useState<string>(todayISO());
  const [end, setEnd] = useState<string>(plusDaysISO(2));

  // filtros
  const [q, setQ] = useState("");
  const [onlyPHA, setOnlyPHA] = useState(false);
  const [hMax, setHMax] = useState<number>(26);
  const [minDia, setMinDia] = useState<number>(0); // km
  const [sort, setSort] = useState<"relevance" | "hAsc" | "hDesc" | "diaDesc">("relevance");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // dados
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Asteroid[]>([]);
  const [openItem, setOpenItem] = useState<Asteroid | null>(null);

  // Converte NEOSearchItem -> Asteroid (campos não fornecidos pelo browse ficam nulos)
  function normalizeFromSearchItem(list: NEOSearchItem[]): Asteroid[] {
    return list.map((it) => {
      const maxMeters = typeof it.estimated_diameter_m === "number" ? it.estimated_diameter_m : null;
      const maxKm = maxMeters != null ? Math.round((maxMeters / 1000) * 1000) / 1000 : null;

      return {
        id: it.id,
        name: it.name,
        pha: false, // browse não traz PHA; enriquecemos no abrir
        hMag: null,
        minDiaKm: maxKm, // aproximação (ou null)
        maxDiaKm: maxKm,
        orbitClass: (it as any)?.orbit?.orbit_class?.orbit_class_type ?? null,
        closeApproachDate: null,
        missKm: null,
        velKms: null,
      };
    });
  }

  // carregar feed (aceita AbortSignal)
  const load = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setErr(null);

      const items = await fetchNeoFeed({
        start,
        end,
        query: q || undefined,
        phaOnly: onlyPHA || undefined,
        maxH: hMax,
        minDiameterM: minDia > 0 ? minDia * 1000 : undefined, // UI em km -> serviço em metros
        sort: sort === "diaDesc" ? "diameter_desc" : sort === "relevance" ? "relevance" : "name_az",
        signal, // repassa o AbortSignal
      });

      const flattened = normalizeFromSearchItem(items);
      flattened.sort((a, b) => a.name.localeCompare(b.name)); // ordem estável

      setRows(flattened);
      setPage(1);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Erro ao carregar feed.");
    } finally {
      setLoading(false);
    }
  };

  // recarrega com debounce quando filtros/datas mudarem
  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(() => {
      load(ac.signal);
    }, 350);

    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [start, end, q, onlyPHA, hMax, minDia, sort]);

  // filtros + ordenação locais
  const filtered = useMemo(() => {
    let r = rows.filter((a) => {
      if (onlyPHA && !a.pha) return false; // sem detalhe, provavelmente filtra tudo
      if (a.hMag != null && a.hMag > hMax) return false; // hMag é null aqui
      if (a.maxDiaKm != null && a.maxDiaKm < minDia) return false;
      if (q) {
        const s = q.toLowerCase();
        const hit =
          a.name.toLowerCase().includes(s) ||
          a.id.toLowerCase().includes(s) ||
          (a.orbitClass || "").toLowerCase().includes(s);
        if (!hit) return false;
      }
      return true;
    });

    r = r.sort((a, b) => {
      switch (sort) {
        case "hAsc":
          return (a.hMag ?? 999) - (b.hMag ?? 999);
        case "hDesc":
          return (b.hMag ?? -999) - (a.hMag ?? -999);
        case "diaDesc":
          return (b.maxDiaKm ?? -1) - (a.maxDiaKm ?? -1);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return r;
  }, [rows, q, onlyPHA, hMax, minDia, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => setPage(1), [q, onlyPHA, hMax, minDia, sort, view]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  // --- handlers de paginação e de abrir drawer ---
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // abre e enriquece com detalhe da NASA quando disponível
  const openItemHandler = (a: Asteroid) => async () => {
    setOpenItem(a); // abre rápido com os dados do feed
    try {
      const neo = await getNeoById(a.id); // detalhe normalizado
      const ca0: any = Array.isArray(neo.close_approach_data) ? neo.close_approach_data[0] : null;

      setOpenItem((prev) => {
        if (!prev) return prev;

        const velKms = ca0?.relative_velocity?.kilometers_per_second
          ? Number(ca0.relative_velocity.kilometers_per_second)
          : prev.velKms ?? null;

        const approachDate =
          (ca0?.close_approach_date_full ||
            ca0?.close_approach_date ||
            prev.closeApproachDate) ?? null;

        return {
          ...prev,
          pha: neo.is_potentially_hazardous ?? prev.pha,
          hMag: typeof neo.absolute_magnitude_h === "number" ? neo.absolute_magnitude_h : prev.hMag,
          maxDiaKm:
            typeof neo.estimated_diameter_m === "number"
              ? Math.round((neo.estimated_diameter_m / 1000) * 1000) / 1000
              : prev.maxDiaKm,
          minDiaKm:
            typeof neo.estimated_diameter_m === "number"
              ? Math.round((neo.estimated_diameter_m / 1000) * 1000) / 1000
              : prev.minDiaKm,
          closeApproachDate: approachDate,
          velKms,
          missKm: ca0?.miss_distance?.kilometers
            ? Number(ca0.miss_distance.kilometers)
            : prev.missKm ?? null,
        };
      });
    } catch {
      // opcional: toast; drawer já está aberto com dados básicos
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen relative">
      {/* Fundo animado estilão NASA Eyes */}
      <SolarBackdrop />

      {/* HERO */}
      <section className="container px-4 md:px-8 pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-5xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs backdrop-blur-sm mb-4 border-teal-400/20 bg-teal-400/10 text-teal-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            NASA NeoWs – dados reais (via feed normalizado)
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-[0_6px_24px_rgba(122,215,255,0.15)]">
            Pesquise Asteroides
          </h1>
          <p className="text-white/75 mt-2 max-w-2xl">
            Explore NEOs por janela de aproximação, filtre por PHA, magnitude (H), diâmetro e
            ordene resultados.
          </p>
        </motion.div>
      </section>

      {/* Controles */}
      <section className="container px-4 md:px-8">
        <Card className="bg-[rgba(8,12,20,0.82)] backdrop-blur-xl border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Janela & Filtros</CardTitle>
            <CardDescription>O feed aceita no máximo 7 dias por chamada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* linha datas */}
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-white/60">Início</label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full mt-1 h-10 rounded-md bg-white/6 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Fim</label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full mt-1 h-10 rounded-md bg-white/6 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="rounded-xl shadow-[0_8px_24px_rgba(122,215,255,0.25)]"
                  onClick={() => load()}
                  disabled={loading}
                >
                  {loading ? "Carregando..." : "Atualizar"}
                </Button>
              </div>
            </div>

            {/* linha filtros */}
            <div className="grid md:grid-cols-6 gap-3">
              <div className="md:col-span-3">
                <label className="text-xs text-white/60">Buscar</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nome, ID ou classe orbital…"
                  className="w-full mt-1 h-10 rounded-md bg-white/6 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Magnitude (H) máx.</label>
                <input
                  type="number"
                  step={0.1}
                  value={hMax}
                  onChange={(e) => setHMax(Number(e.target.value))}
                  className="w-full mt-1 h-10 rounded-md bg-white/6 border border-white/10 px-3"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Diâmetro mín. (km)</label>
                <input
                  type="number"
                  step={0.01}
                  value={minDia}
                  onChange={(e) => setMinDia(Number(e.target.value))}
                  className="w-full mt-1 h-10 rounded-md bg-white/6 border border-white/10 px-3"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Apenas PHA</label>
                <div className="h-10 mt-1 rounded-md bg-white/6 border border-white/10 px-3 flex items-center gap-2">
                  <input
                    id="onlypha"
                    type="checkbox"
                    checked={onlyPHA}
                    onChange={(e) => setOnlyPHA(e.target.checked)}
                  />
                  <label htmlFor="onlypha" className="text-sm">
                    PHA
                  </label>
                </div>
              </div>
            </div>

            {/* ordenação e view */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/60">Ordenar por</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="h-10 rounded-md bg-white/6 border border-white/10 px-3"
                >
                  <option value="relevance">Relevância (PHA + menor H)</option>
                  <option value="hAsc">H (menor → maior)</option>
                  <option value="hDesc">H (maior → menor)</option>
                  <option value="diaDesc">Diâmetro (maior → menor)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={view === "cards" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setView("cards")}
                >
                  Cards
                </Button>
                <Button
                  variant={view === "table" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setView("table")}
                >
                  Tabela
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Resultados */}
      <section className="container px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/75 text-sm">
            {filtered.length} resultado(s){loading ? " • carregando..." : ""} • página {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" disabled={page <= 1} onClick={goPrev}>
              Anterior
            </Button>
            <Button className="rounded-xl" disabled={page >= totalPages} onClick={goNext}>
              Próxima
            </Button>
          </div>
        </div>

        {err && (
          <div className="text-red-400 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
            Erro: {err}
          </div>
        )}

        {!err &&
          (view === "cards" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((a) => (
                <Card
                  key={a.id}
                  className="bg-[rgba(8,12,20,0.82)] backdrop-blur-xl border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:border-white/20 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_10px_40px_rgba(122,215,255,0.10)] transition-all cursor-pointer"
                  onClick={openItemHandler(a)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{a.name}</CardTitle>
                      <PhaBadge pha={a.pha} />
                    </div>
                    <CardDescription>{a.id}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-white/85 space-y-1">
                    <Label k="Classe orbital" v={`${a.orbitClass ?? "—"}`} />
                    <Label k="H" v={`${a.hMag ?? "—"}`} />
                    <Label
                      k="Diâmetro estimado"
                      v={
                        a.minDiaKm != null && a.maxDiaKm != null
                          ? `${a.minDiaKm} – ${a.maxDiaKm} km`
                          : "—"
                      }
                    />
                    <p className="text-[13px] text-white/60">
                      Próx. aproximação:{" "}
                      <span className="text-white/85">{a.closeApproachDate ?? "—"}</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[rgba(8,12,20,0.6)] backdrop-blur-xl">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/75">
                  <tr>
                    <th className="text-left px-3 py-2">Nome</th>
                    <th className="text-left px-3 py-2">ID</th>
                    <th className="text-left px-3 py-2">PHA</th>
                    <th className="text-left px-3 py-2">Classe</th>
                    <th className="text-left px-3 py-2">H</th>
                    <th className="text-left px-3 py-2">Diâmetro (km)</th>
                    <th className="text-left px-3 py-2">Próx. aprox.</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={openItemHandler(a)}
                    >
                      <td className="px-3 py-2">{a.name}</td>
                      <td className="px-3 py-2 text-white/70">{a.id}</td>
                      <td className="px-3 py-2">
                        <PhaBadge pha={a.pha} />
                      </td>
                      <td className="px-3 py-2">{a.orbitClass ?? "—"}</td>
                      <td className="px-3 py-2">{a.hMag ?? "—"}</td>
                      <td className="px-3 py-2">
                        {a.minDiaKm != null && a.maxDiaKm != null
                          ? `${a.minDiaKm} – ${a.maxDiaKm}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2">{a.closeApproachDate ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>

      <DetailsDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}
