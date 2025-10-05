// src/features/scenario/AsteroidPicker.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/debounce";
import { searchNeo } from "@/services/neo";
import type { NEOSearchItem } from "@/types/dto";

type Props = {
  onPick: (neo: NEOSearchItem) => void;
  placeholder?: string;
};

export default function AsteroidPicker({ onPick, placeholder }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<NEOSearchItem[]>([]);
  const [open, setOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const doSearch = async (term: string) => {
    const t = term.trim();

    // exige 2+ caracteres para evitar flood/429
    if (t.length < 2) {
      setItems([]);
      setErr(null);
      setOpen(false);
      return;
    }

    // cancelar requisição anterior
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      setLoading(true);
      setErr(null);
      const data = await searchNeo(t, { signal: ctrl.signal });
      setItems(data);
      setOpen(true);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Falha ao buscar NEOs");
      setItems([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounce maior para reduzir chamadas
  const debounced = useMemo(() => debounce(doSearch, 750), []);

  useEffect(() => {
    debounced(q);
  }, [q, debounced]);

  // Fecha no clique-fora
  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleSelect(it: NEOSearchItem) {
    onPick(it);

    const label = it.name || it.designation || it.id || "";
    setQ(label);

    // fecha dropdown e limpa lista
    setItems([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <div>
        <label className="text-xs text-white/60 block mb-1">
          Selecionar asteroide (NASA NeoWs)
        </label>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70" />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder || "Busque por nome/designação/ID..."}
            className="pl-8"
            onFocus={() => {
              if (q.trim().length >= 2 && items.length > 0) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (q.trim().length >= 2) doSearch(q);
              }
              if (e.key === "Escape") {
                setOpen(false);
                inputRef.current?.blur();
              }
            }}
          />
        </div>
        <p className="text-[11px] text-white/50 mt-1">
          Busque por nome/designação/ID para preencher o formulário com dados reais.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5">
        <div className="px-3 py-2 text-xs text-white/60 flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
            </>
          ) : err ? (
            <span className="text-red-300">{err}</span>
          ) : items.length === 0 ? (
            <span>Nenhum resultado</span>
          ) : (
            <span>{items.length} resultado(s)</span>
          )}
        </div>

        {open && items.length > 0 && (
          <ul className="max-h-56 overflow-auto divide-y divide-white/5">
            {items.map((it) => (
              <li
                key={it.id}
                className="px-3 py-2 hover:bg-white/10 cursor-pointer"
                onClick={() => handleSelect(it)}
              >
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-white/60 flex flex-wrap gap-2">
                  <span>ID: {it.id}</span>
                  {typeof it.estimated_diameter_m === "number" && (
                    <span>⌀ ~{Math.round(it.estimated_diameter_m)} m</span>
                  )}
                  {it.designation && <span>• {it.designation}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
