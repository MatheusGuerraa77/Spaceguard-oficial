// src/components/neo/NeoAutocomplete.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { searchNeo } from "@/services/neo";
import type { NEOSearchItem } from "@/types/dto";

type Props = {
  value?: NEOSearchItem | null;
  onSelect: (item: NEOSearchItem) => void;
  placeholder?: string;
};

export default function NeoAutocomplete({ value, onSelect, placeholder }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<NEOSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const label = useMemo(() => {
    if (value) return value.designation ? `${value.name} (${value.designation})` : value.name;
    return "";
  }, [value]);

  useEffect(() => {
    if (!q) {
      setList([]);
      return;
    }
    setLoading(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const id = setTimeout(async () => {
      try {
        const res = await searchNeo(q, { signal: ac.signal });
        setList(res);
        setOpen(true);
      } catch (_) {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 250); // debounce

    return () => {
      clearTimeout(id);
      ac.abort();
    };
  }, [q]);

  return (
    <div className="relative">
      <input
        value={q || label}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || "Busque por nome/designação/ID..."}
        className="w-full h-10 rounded-md bg-white/6 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-sky-400/30"
      />
      {open && (loading || list.length > 0) && (
        <div
          className="absolute z-20 mt-1 w-full rounded-md border border-white/10 bg-[rgba(8,12,20,0.92)] backdrop-blur-xl max-h-72 overflow-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-white/60">Carregando…</div>
          )}
          {!loading &&
            list.map((it) => (
              <button
                key={it.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                onClick={() => {
                  onSelect(it);
                  setQ("");
                  setOpen(false);
                }}
              >
                <div className="text-white/90">
                  {it.name} {it.designation ? `(${it.designation})` : ""}
                </div>
                {!!it.estimated_diameter_m && (
                  <div className="text-[12px] text-white/60">
                    ~{it.estimated_diameter_m.toFixed(0)} m
                  </div>
                )}
              </button>
            ))}
          {!loading && list.length === 0 && (
            <div className="px-3 py-2 text-sm text-white/60">Nenhum resultado</div>
          )}
        </div>
      )}
    </div>
  );
}
