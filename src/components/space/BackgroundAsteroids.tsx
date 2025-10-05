// src/components/space/BackgroundAsteroids.tsx
import { lazy, Suspense, type ComponentType } from "react";

// Props aceitos pelo AsteroidScene (o mesmo que você usa na Home)
type AsteroidSceneProps = {
  speedMultiplier?: number;
};

// 👉 ajuste o caminho se seu AsteroidScene estiver em outro lugar
const AsteroidScene = lazy<ComponentType<AsteroidSceneProps>>(async () => {
  const mod = await import("../AsteroidScene");
  // funciona com export default OU export nomeado { AsteroidScene }
  return { default: (mod as any).AsteroidScene ?? mod.default };
});

type Props = {
  /** velocidade relativa do fundo (1.0 ~ igual à Home) */
  speed?: number;
  /** força do escurecimento radial (0–1) */
  overlayStrength?: number;
};

export default function BackgroundAsteroids({
  speed = 1.15,
  overlayStrength = 0.35,
}: Props) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* campo de asteroides em canvas (atrás de tudo) */}
      <Suspense fallback={null}>
        <AsteroidScene speedMultiplier={speed} />
      </Suspense>

      {/* leve gradiente para dar contraste ao conteúdo */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(1200px 1200px at 60% 60%, rgba(0,0,0,${
            overlayStrength * 0.15
          }) 0%, rgba(0,0,0,${overlayStrength}) 100%)`,
        }}
      />
    </div>
  );
}
