import { useEffect, useRef } from "react";

/**
 * Fundo animado em canvas com:
 * - estrelas
 * - anéis orbitais (Mercúrio, Vênus, Terra, Marte)
 * - “cinturão” de asteroides com milhares de pontos
 * - leve rotação/deriva para dar vida
 *
 * É decorativo (não é simulação real).
 */
export default function SolarBackdrop() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(DPR, DPR);

    const center = { x: w / 2, y: h / 2 + 30 }; // leve deslocamento para baixo

    // Paleta próxima do screenshot
    const col = {
      bg: "#070b13",
      orbit: "#6ea7ff22",
      orbitBold: "#6ea7ff55",
      asteroid: "#79b4ff",
      asteroidDim: "#79b4ff44",
      sun: "#ffe082",
      planet: "#a5b4fc",
      text: "rgba(220,235,255,0.80)",
      textDim: "rgba(220,235,255,0.55)",
      accent: "#ff7b63",
    };

    // Estrelas de fundo
    const stars = Array.from({ length: 400 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2,
      a: 0.5 + Math.random() * 0.5,
    }));

    // “Cinturão de asteroides”: pontos distribuídos num toroide achatado
    const belt: { x: number; y: number; r: number }[] = [];
    const BELT_COUNT = Math.min(4500, Math.floor((w * h) / 350)); // escala por resolução
    for (let i = 0; i < BELT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      // raio entre 260 e 420 px (ajuste para caber nos anéis)
      const R = 260 + Math.random() * 160;
      const jitter = (Math.random() - 0.5) * 34; // espessura do anel
      const x = center.x + Math.cos(angle) * (R + jitter);
      const y = center.y + Math.sin(angle) * (R + jitter) * 0.55; // achatamento
      belt.push({ x, y, r: Math.random() * 1.4 + 0.2 });
    }

    // Anéis orbitais “aproximados” (raios em px)
    const orbits = [
      { name: "MERCÚRIO", R: 70, color: "#b493ff66" },
      { name: "VÊNUS", R: 120, color: "#ffb15e44" },
      { name: "TERRA", R: 170, color: "#7ad7ff66" },
      { name: "MARTE", R: 230, color: "#ff7b6344" },
      { name: "CINTURÃO", R: 320, color: col.orbit }, // “guia” externo
    ];

    // UI helpers
    const clear = () => {
      ctx.fillStyle = col.bg;
      ctx.fillRect(0, 0, w, h);
    };

    const drawStars = (t: number) => {
      for (const s of stars) {
        const flicker = 0.2 * Math.sin(t * 0.001 + s.x * 0.01) + s.a;
        ctx.globalAlpha = Math.max(0.15, Math.min(1, flicker));
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawOrbits = () => {
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.scale(1, 0.58); // achatamento elíptico
      for (const o of orbits) {
        ctx.strokeStyle = o.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, o.R, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Rótulos dos planetas
      ctx.font = "12px Inter, ui-sans-serif, system-ui";
      ctx.fillStyle = col.textDim;
      ctx.textAlign = "center";
      ctx.fillText("SOL", center.x, center.y - 6);
      labelAtRadius("MERCÚRIO", 70);
      labelAtRadius("VÊNUS", 120);
      labelAtRadius("TERRA", 170);
      labelAtRadius("MARTE", 230);
    };

    function labelAtRadius(label: string, R: number) {
      const ang = -Math.PI / 14; // desloca rótulo
      const x = center.x + Math.cos(ang) * R;
      const y = center.y + Math.sin(ang) * R * 0.58;
      ctx.fillText(label, x, y);
    }

    const drawSun = () => {
      const grd = ctx.createRadialGradient(
        center.x,
        center.y,
        0,
        center.x,
        center.y,
        36
      );
      grd.addColorStop(0, col.sun);
      grd.addColorStop(1, "rgba(255,224,130,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 36, 0, Math.PI * 2);
      ctx.fill();
    };

    // rotação lenta do cinturão
    let theta = 0;

    const drawBelt = (t: number) => {
      theta += 0.0004;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(0.08); // inclinação visual
      ctx.translate(-center.x, -center.y);

      for (const p of belt) {
        // rotação leve em torno do centro
        const dx = p.x - center.x;
        const dy = p.y - center.y;
        const x = center.x + dx * cos - dy * sin;
        const y = center.y + dx * sin + dy * cos;

        // parallax sutil (brilho varia com o y)
        const a = 0.25 + ((y / h) * 0.35);
        ctx.globalAlpha = a;
        ctx.fillStyle = col.asteroid;
        ctx.fillRect(x, y, p.r, p.r);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      center.x = w / 2;
      center.y = h / 2 + 30;
      clear();
    };

    const loop = (t: number) => {
      clear();
      drawStars(t);
      drawBelt(t);
      drawOrbits();
      drawSun();
      raf.current = requestAnimationFrame(loop);
    };

    window.addEventListener("resize", onResize);
    raf.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", onResize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 -z-10 pointer-events-none select-none"
      aria-hidden
    />
  );
}
