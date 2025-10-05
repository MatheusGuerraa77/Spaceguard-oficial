// src/components/space/BackgroundAsteroids.tsx
import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  /** Força do escurecimento das bordas (0 a 0.5 recomendado). */
  overlayStrength?: number;
};

type Particle = {
  x: number;
  y: number;
  r: number;
  sides: number; // 0 => estrela; 5..8 => “asteroide”
  vx: number;
  vy: number;
  tone: number;
};

export default function BackgroundAsteroids({ overlayStrength = 0.22 }: Props) {
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

      // === NÃO PINTA FUNDO: mantemos transparente ===
      // ctx.clearRect(0, 0, w, h);

      // quantidade proporcional à área (sutil)
      const density = 170; // por milhão de px
      const area = w * h;
      const target = Math.round((area / 1_000_000) * density);

      const p: Particle[] = [];
      for (let i = 0; i < target; i++) {
        const isAsteroid = Math.random() < 0.22;
        const r = isAsteroid ? rand(1.4, 3.6) : rand(0.5, 1.2);
        const sides = isAsteroid ? Math.floor(rand(5, 8.99)) : 0;
        const ang = rand(0, Math.PI * 2);
        // velocidade discreta
        const v = (isAsteroid ? 0.75 : 0.5) * (12 / 60);
        p.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r,
          sides,
          vx: Math.cos(ang) * v,
          vy: Math.sin(ang) * v,
          tone: isAsteroid ? rand(0.35, 0.7) : rand(0.75, 1),
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

      // dt
      let dt = 1 / 60;
      if (lastTsRef.current != null) {
        dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      }
      lastTsRef.current = ts;

      // limpa (sem pintar cor de fundo!)
      ctx.clearRect(0, 0, w, h);

      // partículas
      const arr = particlesRef.current;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];

        if (!reduceMotion) {
          p.x += p.vx * (dt * 60);
          p.y += p.vy * (dt * 60);
        }

        // wrap
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;

        if (p.sides === 0) {
          // estrelas
          ctx.fillStyle = `rgba(255,255,255,${0.08 * p.tone})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // “asteroides” discretos
          const shade = Math.floor(200 * p.tone);
          ctx.fillStyle = `rgba(${shade},${shade + 10},${shade + 25},0.09)`;
          drawPoly(p.x, p.y, p.r, p.sides);
          ctx.fill();
        }
      }

      // leve vinheta nas bordas — **bem leve**
      if (overlayStrength > 0) {
        const g = ctx.createRadialGradient(
          w * 0.5,
          h * 0.5,
          Math.min(w, h) * 0.15,
          w * 0.5,
          h * 0.5,
          Math.max(w, h) * 0.75
        );
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, `rgba(0,0,0,${Math.min(overlayStrength, 0.4)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
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
  }, [overlayStrength, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1, // atrás de tudo
        pointerEvents: "none",
        // Transparente; nada de background-color aqui
      }}
    />
  );
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
