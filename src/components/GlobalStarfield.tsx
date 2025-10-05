// src/components/GlobalStarfield.tsx
import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  /** Densidade base de partículas (por milhão de px). 140–240 fica bom. */
  density?: number;
  /** Velocidade base (px/s em 1080p). 8–20 é sutil. */
  speed?: number;
  /** Opacidade geral do field. */
  alpha?: number;
};

type Particle = {
  x: number;
  y: number;
  r: number;
  sides: number; // 0 = “estrela”; 5..8 = “asteroide”
  vx: number;
  vy: number;
  tone: number; // 0..1 (mistura de cinza)
};

export default function GlobalStarfield({
  density = 200,
  speed = 14,
  alpha = 0.65,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTsRef = useRef<number | null>(null);

  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let running = true;

    const fit = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = w * h;
      const target = Math.round((area / 1_000_000) * density);
      const p: Particle[] = [];
      for (let i = 0; i < target; i++) {
        const isAsteroid = Math.random() < 0.25;
        const r = isAsteroid ? rand(1.6, 4.2) : rand(0.5, 1.3);
        const sides = isAsteroid ? Math.floor(rand(5, 8.99)) : 0;
        const ang = rand(0, Math.PI * 2);
        const v = (isAsteroid ? 1 : 0.6) * (speed / 60);
        p.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r,
          sides,
          vx: Math.cos(ang) * v,
          vy: Math.sin(ang) * v,
          tone: isAsteroid ? rand(0.35, 0.7) : rand(0.7, 1),
        });
      }
      particlesRef.current = p;
    };

    const drawPoly = (cx: number, cy: number, r: number, sides: number) => {
      ctx.beginPath();
      const base = rand(0, Math.PI * 2);
      for (let i = 0; i < sides; i++) {
        const a = base + (i / sides) * Math.PI * 2;
        const rr = r * (0.85 + Math.random() * 0.3);
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const loop = (ts: number) => {
      if (!running) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      let dt = 1 / 60;
      if (lastTsRef.current != null) {
        dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      }
      lastTsRef.current = ts;

      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        Math.min(w, h) * 0.15,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const arr = particlesRef.current;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];

        if (!reduceMotion) {
          p.x += p.vx * (dt * 60);
          p.y += p.vy * (dt * 60);
        }

        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;

        if (p.sides === 0) {
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.08 * p.tone})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const shade = Math.floor(200 * p.tone);
          ctx.fillStyle = `rgba(${shade},${shade + 10},${shade + 25},${
            alpha * 0.09
          })`;
          drawPoly(p.x, p.y, p.r, p.sides);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const onResize = () => {
      fit();
      lastTsRef.current = null;
    };

    fit();
    window.addEventListener("resize", onResize, { passive: true });
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [density, speed, alpha, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        // <- zIndex 0 (acima do fundo do body, abaixo do conteúdo)
        zIndex: 0,
        pointerEvents: "none",
        transform: "translateZ(0)",
      }}
    />
  );
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
