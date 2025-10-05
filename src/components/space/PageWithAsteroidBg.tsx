import React from "react";
import BackgroundAsteroids from "@/components/space/BackgroundAsteroids";

/**
 * Envolve a página e injeta o fundo animado atrás do conteúdo.
 */
export default function PageWithAsteroidBg({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen py-8">
      <BackgroundAsteroids />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
