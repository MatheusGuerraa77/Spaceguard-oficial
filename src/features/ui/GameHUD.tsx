import { motion } from "framer-motion";
import { Trophy, Flame, Target } from "lucide-react";
import { useGame } from "@/game/GameContext";

export default function GameHUD() {
  const { score, combo, missionProgress } = useGame(); // << aqui

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 flex items-center justify-center z-40">
      <motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 flex items-center gap-5 shadow-lg"
      >
        {/* Score */}
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-300" />
          <span className="text-[11px] text-white/70">Score</span>
          <span className="text-white font-semibold">{Math.round(score)}</span>
        </div>

        {/* Combo */}
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-[11px] text-white/70">Combo</span>
          <span className="text-white font-semibold">x{combo}</span>
        </div>

        {/* Missão (progress bar) */}
        <div className="h-5 w-px bg-white/10" />
        <div className="hidden sm:flex items-center gap-2 min-w-[180px]">
          <Target className="w-4 h-4 text-sky-300" />
          <span className="text-[11px] text-white/70 truncate">Missão</span>
          <div className="relative w-[120px] h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              key={missionProgress}
              initial={{ width: 0 }}
              animate={{ width: `${missionProgress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-400 to-indigo-400"
            />
          </div>
          <span className="text-[11px] text-white/70 w-10 text-right tabular-nums">
            {Math.round(missionProgress)}%
          </span>
        </div>
      </motion.div>
    </div>
  );
}
