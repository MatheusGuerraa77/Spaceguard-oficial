// src/features/orbit3d/SpaceBackground.tsx
import { Canvas } from "@react-three/fiber";
import { createPortal } from "react-dom";
import { Suspense, useMemo } from "react";
// ... seus objetos/scene aqui

export default function SpaceBackground() {
  const mount = useMemo(() => document.getElementById("cosmos-root")!, []);
  if (!mount) return null;

  return createPortal(
    <Canvas className="cosmos-fixed" frameloop="always">
      <Suspense fallback={null}>
        {/* sua cena 3D aqui: luzes, Terra, asteroides, estrelas, etc */}
      </Suspense>
    </Canvas>,
    mount
  );
}
