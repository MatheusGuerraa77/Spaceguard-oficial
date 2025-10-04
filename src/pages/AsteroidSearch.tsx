// src/pages/AsteroidSearch.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Tipos --------------------------------------------------------
type Asteroid = {
  id: string;              // e.g. "2024 AB"
  name: string;            // nome amigável
  pha: boolean;            // Potentially Hazardous Asteroid
  hMag: number;            // magnitude absoluta (H)
  minDiaKm: number;        // diâmetro mínimo est. (km)
  maxDiaKm: number;        // diâmetro máximo est. (km)
  orbitClass: "Apollo" | "Aten" | "Amor" | "PHA" | "Outro";
  closeApproachDate?: string; // próxima aproximação (mock)
};

// Helpers: dados mockados -------------------------------------
function rnd(min: number, max: number, digits = 2) {
  const n = Math.random() * (max - min) + min;
  const p = Math.pow(10, digits);
  return Math.round(n * p) / p;
}

function makeMockAsteroids(n = 42): Asteroid[] {
  const classes: Asteroid["orbitClass"][] = ["Apollo", "Aten", "Amor", "PHA", "Outro"];
  const list: Asteroid[] = [];
  for (let i = 0; i < n; i++) {
    const pha = Math.random() < 0.25;
    const minDia = rnd(0.05, 2.8, 3);
    const maxDia = rnd(minDia, minDia + rnd(0.01, 1.5), 3);
    const hMag = rnd(16, 26, 1);
    const year = 2025 + Math.floor(Math.random() * 5);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    const id = `${year} ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(
      65 + ((i * 7) % 26)
    )}`;
    list.push({
      id,
      name: `NEO ${id}`,
      pha,
      hMag,
      minDiaKm: minDia,
      maxDiaKm: maxDia,
      orbitClass: classes[Math.floor(Math.random() * classes.length)],
      closeApproachDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
  }
  return list;
}

// UI: badge PHA ------------------------------------------------
function PhaBadge({ pha }: { pha: boolean }) {
  if (!pha) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-xs">
        Não-PHA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-500/10 text-red-300 px-2 py-0.5 text-xs">
      PHA
    </span>
  );
}

// UI: Drawer/Sheet simples ------------------------------------
function DetailsDrawer({
  item,
  onClose,
}: {
  item: Asteroid | null;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex"
      aria-modal
      role="dialog"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/60" />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25 }}
        className="ml-auto h-full w-full max-w-md bg-[#0b0f17] border-l border-white/10 p-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <button
            className="text-sm text-white/70 hover:text-white"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <PhaBadge pha={item.pha} />
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {item.orbitClass}
            </span>
          </div>
          <p>
            <span className="text-white/60">ID: </span>
            {item.id}
          </p>
          <p>
            <span className="text-white/60">Magnitude (H): </span>
            {item.hMag.toFixed(1)}
          </p>
          <p>
            <span className="text-white/60">Diâmetro estimado: </span>
            {item.minDiaKm} – {item.maxDiaKm} km
          </p>
          <p>
            <span className="text-white/60">Próx. aproximação: </span>
            {item.closeApproachDate ?? "—"}
          </p>

          {/* Placeholder de “visualização orbital” (decorativo) */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Visualização (placeholder)</h4>
            <div className="rounded-md border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-3">
              <svg viewBox="0 0 220 120" className="w-full h-36">
                <defs>
                  <radialGradient id="g" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#0B3D91" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0B3D91" stopOpacity="0.0" />
                  </radialGradient>
                </defs>
                <circle cx="110" cy="60" r="26" fill="url(#g)" />
                <circle cx="110" cy="60" r="22" fill="#0a1f3e" />
                <ellipse
                  cx="110"
                  cy="60"
                  rx="90"
                  ry="28"
                  fill="none"
                  stroke="#7aa2ff55"
                />
                <circle cx="32" cy="58" r="3" fill="#7aa2ff" />
                <text x="40" y="62" fontSize="8" fill="#cde3ff">
                  {item.name}
                </text>
              </svg>
              <p className="text-xs text-white/60">
                * Ilustração puramente estética para a página de design.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Componente principal ----------------------------------------
export default function AsteroidSearch() {
  // dados “da API”, mas mockados
  const [data] = useState<Asteroid[]>(() => makeMockAsteroids(48));

  // UI/estado de filtros
  const [q, setQ] = useState("");
  const [onlyPHA, setOnlyPHA] = useState(false);
  const [hMax, setHMax] = useState(26); // quanto menor H, maior o objeto
  const [minDia, setMinDia] = useState(0);
  const [sort, setSort] = useState<"relevance" | "hAsc" | "hDesc" | "diaDesc">(
    "relevance"
  );
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [openItem, setOpenItem] = useState<Asteroid | null>(null);

  // filtro/ordenador
  const filtered = useMemo(() => {
    let rows = data.filter((a) => {
      if (onlyPHA && !a.pha) return false;
      if (a.hMag > hMax) return false;
      if (a.maxDiaKm < minDia) return false;
      if (q) {
        const s = q.toLowerCase();
        const hit =
          a.name.toLowerCase().includes(s) ||
          a.id.toLowerCase().includes(s) ||
          a.orbitClass.toLowerCase().includes(s);
        if (!hit) return false;
      }
      return true;
    });

    rows = rows.sort((a, b) => {
      switch (sort) {
        case "hAsc":
          return a.hMag - b.hMag;
        case "hDesc":
          return b.hMag - a.hMag;
        case "diaDesc":
          return b.maxDiaKm - a.maxDiaKm;
        default:
          // “relevance” mock: PHA primeiro, depois menor H
          if (a.pha !== b.pha) return a.pha ? -1 : 1;
          return a.hMag - b.hMag;
      }
    });
    return rows;
  }, [data, q, onlyPHA, hMax, minDia, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => setPage(1), [q, onlyPHA, hMax, minDia, sort, view]);

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen">
      {/* HERO curtinho */}
      <section className="container px-4 md:px-8 pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-5xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 border border-secondary/30 text-xs backdrop-blur-sm mb-4">
            <span className="h-2 w-2 rounded-full bg-primary" />
            NASA NEO Design – sem API
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Pesquise Asteroides
          </h1>
          <p className="text-white/70 mt-2 max-w-2xl">
            Interface de exploração para objetos próximos à Terra (NEOs). Aqui
            você filtra, ordena e inspeciona asteroides usando dados mockados —
            pronto para plugar em uma API no futuro.
          </p>
        </motion.div>
      </section>

      {/* Filtros e ações */}
      <section className="container px-4 md:px-8">
        <Card className="nasa-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <CardDescription>
              Ajuste a busca. (Sem API – resultados simulados)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* linha 1 */}
            <div className="grid md:grid-cols-6 gap-3">
              <div className="md:col-span-3">
                <label className="text-xs text-white/60">Buscar</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nome, ID ou classe orbital…"
                  className="w-full mt-1 h-10 rounded-md bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs text-white/60">Magnitude (H) máx.</label>
                <input
                  type="number"
                  step={0.1}
                  value={hMax}
                  onChange={(e) => setHMax(Number(e.target.value))}
                  className="w-full mt-1 h-10 rounded-md bg-white/5 border border-white/10 px-3"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs text-white/60">Diâmetro mín. (km)</label>
                <input
                  type="number"
                  step={0.01}
                  value={minDia}
                  onChange={(e) => setMinDia(Number(e.target.value))}
                  className="w-full mt-1 h-10 rounded-md bg-white/5 border border-white/10 px-3"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs text-white/60">Apenas PHA</label>
                <div className="h-10 mt-1 rounded-md bg-white/5 border border-white/10 px-3 flex items-center gap-2">
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

            {/* linha 2 */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/60">Ordenar por</label>
                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value as typeof sort)
                  }
                  className="h-10 rounded-md bg-white/5 border border-white/10 px-3"
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
          <p className="text-white/70 text-sm">
            {filtered.length} resultado(s) • página {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              className="rounded-xl"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>

        {view === "cards" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((a) => (
              <Card
                key={a.id}
                className="nasa-panel card-hover cursor-pointer"
                onClick={() => setOpenItem(a)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{a.name}</CardTitle>
                    <PhaBadge pha={a.pha} />
                  </div>
                  <CardDescription>{a.id}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-white/80 space-y-1">
                  <p>
                    <span className="text-white/60">Classe orbital: </span>
                    {a.orbitClass}
                  </p>
                  <p>
                    <span className="text-white/60">H: </span>
                    {a.hMag.toFixed(1)}
                  </p>
                  <p>
                    <span className="text-white/60">Diâmetro estimado: </span>
                    {a.minDiaKm} – {a.maxDiaKm} km
                  </p>
                  <p className="text-white/60">
                    Próx. aproximação:{" "}
                    <span className="text-white/80">
                      {a.closeApproachDate ?? "—"}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/70">
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
                    onClick={() => setOpenItem(a)}
                  >
                    <td className="px-3 py-2">{a.name}</td>
                    <td className="px-3 py-2 text-white/70">{a.id}</td>
                    <td className="px-3 py-2">
                      <PhaBadge pha={a.pha} />
                    </td>
                    <td className="px-3 py-2">{a.orbitClass}</td>
                    <td className="px-3 py-2">{a.hMag.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      {a.minDiaKm} – {a.maxDiaKm}
                    </td>
                    <td className="px-3 py-2">
                      {a.closeApproachDate ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Drawer de detalhes */}
      <DetailsDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}
