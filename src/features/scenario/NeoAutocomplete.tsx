// src/features/scenario/NeoAutocomplete.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { NEOSearchItem } from "@/types/dto";

// 🚀 Novo: cliente NeoWs
import {
  browseNeos,
  searchNeosByText,
  type NeoWsObject,
  extractDiameterMeters,
} from "@/lib/nasa";

type NeoAutocompleteProps = {
  onPick: (item: NEOSearchItem) => void | Promise<void>;
  placeholder?: string;
  /** Quando true, desabilita o input e mostra estado de carregando externo (ex.: carregando detalhe). */
  loadingExternal?: boolean;
  disabled?: boolean;
  className?: string;
  minChars?: number; // padrão: 2
};

// Mapeia um objeto NeoWs minimal para o seu NEOSearchItem
function mapNeoToSearchItem(neo: NeoWsObject): NEOSearchItem {
  // diâmetro médio em metros (se existir)
  const diameter_m = extractDiameterMeters(neo);

  return {
    id: neo.neo_reference_id ?? neo.id,
    name: neo.name,
    designation: neo.designation,
    estimated_diameter_m: diameter_m,
    // opcional: leva o objeto bruto caso queira usar depois
    // (adicione "raw?: any" no seu tipo se quiser tipar)
    raw: neo as any,
  } as NEOSearchItem;
}

export function NeoAutocomplete({
  onPick,
  placeholder = "Digite nome ou ID (ex.: 433 Eros, 99942)…",
  loadingExternal = false,
  disabled = false,
  className = "",
  minChars = 2,
}: NeoAutocompleteProps) {
  const [q, setQ] = useState("");
  const [list, setList] = useState<NEOSearchItem[]>([]);
  const [loading, setLoading] = useState(false); // loading interno (busca)
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const ulRef = useRef<HTMLUListElement | null>(null);

  // desabilita se estiver explicitamente disabled OU carregando externamente
  const isDisabled = disabled || loadingExternal;

  // Mostra a lista se há resultados ou está carregando e o input tem foco
  const showList = useMemo(
    () => open && (loading || list.length > 0 || !!error),
    [open, loading, list.length, error]
  );

  // 🔹 Sugestões iniciais (browse página 0) quando o usuário focar e não digitou ainda
  useEffect(() => {
    let alive = true;
    // só carrega base quando estiver habilitado e sem texto
    if (isDisabled || q.trim().length > 0) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const base = await browseNeos(0, 25);
        if (!alive) return;
        setList(base.map(mapNeoToSearchItem));
        setActiveIdx(base.length > 0 ? 0 : -1);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Falha ao listar NEOs (browse)");
        setList([]);
        setActiveIdx(-1);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled]); // roda quando habilita/desabilita

  // 🔹 Busca por texto (varre algumas páginas do browse e filtra)
  useEffect(() => {
    if (isDisabled) return;

    // Esvazia quando string curta
    if (!q || q.trim().length < minChars) {
      setError(null);
      // não zera a lista: deixamos as sugestões do browse carregadas acima
      // se quiser limpar totalmente, descomente:
      // setList([]);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const found = await searchNeosByText(q.trim(), 3, 25);
        if (ac.signal.aborted) return;
        const items = found.map(mapNeoToSearchItem);
        setList(items);
        setActiveIdx(items.length > 0 ? 0 : -1);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Falha ao buscar na NeoWs");
        setList([]);
        setActiveIdx(-1);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [q, isDisabled, minChars]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as Node;
      if (
        inputRef.current &&
        !inputRef.current.contains(target) &&
        ulRef.current &&
        !ulRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(item: NEOSearchItem) {
    onPick(item);
    setQ(item.name || item.id);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList || list.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1 >= list.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 < 0 ? list.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < list.length) {
        pick(list[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm text-white/70 mb-1">
        Asteroide (NASA NeoWs)
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          disabled={isDisabled}
          placeholder={placeholder}
          className="w-full h-10 rounded-md bg-white/6 border border-white/10 px-3 pr-20 outline-none focus:ring-2 focus:ring-sky-400/30"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls="neo-autocomplete-listbox"
          role="combobox"
        />

        {/* Indicadores à direita do input */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-white/60 pointer-events-none">
          {loading && "Buscando…"}
          {!loading && loadingExternal && "Carregando…"}
        </div>
      </div>

      {/* Dropdown */}
      {showList && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-white/10 bg-[rgba(8,12,20,0.92)] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          {loading && (
            <div className="px-3 py-2 text-xs text-white/60">Buscando…</div>
          )}

          {!loading && error && (
            <div className="px-3 py-2 text-xs text-red-300">{error}</div>
          )}

          {!loading && !error && list.length === 0 && (
            <div className="px-3 py-2 text-xs text-white/60">
              {q.trim().length < minChars
                ? `Digite ao menos ${minChars} caracteres`
                : "Nenhum resultado"}
            </div>
          )}

          {!loading && !error && list.length > 0 && (
            <ul
              id="neo-autocomplete-listbox"
              role="listbox"
              ref={ulRef}
              className="max-h-60 overflow-y-auto py-1"
            >
              {list.map((it, idx) => {
                const active = idx === activeIdx;
                const km =
                  typeof it.estimated_diameter_m === "number"
                    ? Math.round((it.estimated_diameter_m / 1000) * 1000) / 1000
                    : null;

                return (
                  <li
                    key={it.id}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => e.preventDefault()} // evita blur antes do click
                    onClick={() => pick(it)}
                    className={`px-3 py-2 cursor-pointer ${
                      active ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{it.name}</div>
                        <div className="text-[11px] text-white/60 truncate">
                          ID: {it.id}
                          {it.designation ? ` • ${it.designation}` : ""}
                        </div>
                      </div>
                      <div className="text-[11px] text-white/70 whitespace-nowrap">
                        {km != null ? `${km} km` : "— km"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NeoAutocomplete;
