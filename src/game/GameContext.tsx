// src/game/GameContext.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

export type GameEvent =
  | "asteroid_click"
  | "scenario_run"
  | "mitigation_apply"
  | "combo_break"
  | "milestone";

type GameCtx = {
  // estado
  score: number;
  combo: number;
  missionProgress: number; // 0..100 (ex.: barra de missão)

  // ações públicas
  addScore: (delta: number) => void;
  addCombo: (inc?: number) => void;
  resetCombo: () => void;
  triggerMissionEvent: (ev: GameEvent) => void;
};

const Ctx = createContext<GameCtx | null>(null);

export const useGame = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame deve ser usado dentro de <GameProvider />");
  return ctx;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [missionProgress, setMissionProgress] = useState(0);

  const addScore = useCallback((delta: number) => {
    // bônus simples por combo (ex.: +3% por nível de combo)
    const bonus = 1 + Math.min(combo * 0.03, 1); // até +100% máx
    setScore((s) => Math.max(0, Math.round(s + delta * bonus)));
  }, [combo]);

  const addCombo = useCallback((inc = 1) => {
    setCombo((c) => c + inc);
    // cada clique contribui um pouco pra missão
    setMissionProgress((p) => Math.min(100, p + 1.5 * inc));
  }, []);

  const resetCombo = useCallback(() => {
    setCombo(0);
  }, []);

  const triggerMissionEvent = useCallback((ev: GameEvent) => {
    // regra boba de progressão por evento (ajuste como quiser)
    if (ev === "asteroid_click") {
      setMissionProgress((p) => Math.min(100, p + 2));
    } else if (ev === "scenario_run") {
      setMissionProgress((p) => Math.min(100, p + 4));
    } else if (ev === "mitigation_apply") {
      setMissionProgress((p) => Math.min(100, p + 6));
    } else if (ev === "combo_break") {
      resetCombo();
    } else if (ev === "milestone") {
      // poderia disparar algum efeito especial aqui
    }

    // (opcional) dispara um CustomEvent p/ partículas ou sons globais
    try {
      window.dispatchEvent(new CustomEvent("game:event", { detail: { ev, ts: Date.now() } }));
    } catch {}
  }, [resetCombo]);

  const value = useMemo<GameCtx>(() => ({
    score,
    combo,
    missionProgress,
    addScore,
    addCombo,
    resetCombo,
    triggerMissionEvent,
  }), [score, combo, missionProgress, addScore, addCombo, resetCombo, triggerMissionEvent]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
