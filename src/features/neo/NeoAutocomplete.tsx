// src/features/neo/NeoAutocomplete.tsx
import { useEffect, useMemo, useState } from "react";

// ---- TIPOS QUE EXPORTAMOS ----
export type NeoSuggestion = {
  id: string;
  name: string;

  // Campos que já usamos na mitigação (adicione/ajuste se seu fetch retornar diferente)
  diameter_m?: number;        // diâmetro estimado em metros
  density_kgm3?: number;      // densidade (se tiver; se não, defina default no consumo)
  velocity_ms?: number;       // velocidade em m/s (se vier em km/s, converta no consumo)
  // Se você tiver uma estimativa de localização de impacto (geralmente a API não traz)
  lat?: number;
  lon?: number;
};

export interface NeoAutocompleteProps {
  className?: string;
  placeholder?: string;

  // valor digitado (opcional)
  value?: string;
  onChange?: (value: string) => void;

  // >>> callback que vamos chamar quando o usuário escolher um NEO <<<
  onSelect?: (neo: NeoSuggestion) => void;
}

// -------------------
// OBS: Este componente de exemplo usa uma "lista mockada" de sugestões para ilustrar.
// Substitua pela sua busca real (NASA NeoWs, etc.) mantendo a chamada do `props.onSelect`.
const MOCK_LIST: NeoSuggestion[] = [
  { id: "433", name: "433 Eros", diameter_m: 16800, density_kgm3: 2700, velocity_ms: 20000 },
  { id: "1862", name: "1862 Apollo", diameter_m: 1500, density_kgm3: 3000, velocity_ms: 18000 },
  { id: "99942", name: "99942 Apophis", diameter_m: 370, density_kgm3: 3000, velocity_ms: 30000 },
];

export default function NeoAutocomplete(props: NeoAutocompleteProps) {
  const { className, placeholder = "Digite nome ou ID (ex.: 433 Eros, 99942)", value, onChange, onSelect } = props;

  const [input, setInput] = useState(value ?? "");
  useEffect(() => {
    if (value !== undefined) setInput(value);
  }, [value]);

  const results = useMemo(() => {
    if (!input.trim()) return [];
    const q = input.toLowerCase();
    return MOCK_LIST.filter(
      (neo) => neo.name.toLowerCase().includes(q) || neo.id.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [input]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    onChange?.(e.target.value);
  };

  const handlePick = (neo: NeoSuggestion) => {
    // *** CHAMA O CALLBACK QUE A PAGE ESTÁ PASSANDO ***
    onSelect?.(neo);
  };

  return (
    <div className={className}>
      <input
        value={input}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-10 rounded-md bg-card px-3 text-sm outline-none border border-border"
      />
      {results.length > 0 && (
        <div className="mt-2 rounded-md border border-border bg-card divide-y divide-border">
          {results.map((neo) => (
            <button
              key={neo.id}
              type="button"
              onClick={() => handlePick(neo)}
              className="w-full text-left px-3 py-2 hover:bg-muted"
            >
              <div className="text-sm font-medium">{neo.name}</div>
              <div className="text-xs text-muted-foreground">ID {neo.id}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
