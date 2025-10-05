import React, { useEffect, useRef } from "react";

/**
 * Fundo animado com estrelas e "asteroides" 2D leves em canvas.
 * - Fica FIXO atrás do conteúdo (z-index negativo).
 * - Não captura cliques (pointer-events-none).
 * - Sem dependências externas.
 */
type BaseProps = {
  /** Multiplicador de velocidade geral (1 = padrão) */
  speed?: number;
  /** Força da vinheta (0.0 a 1.0) */
  overlayStrength?: number;
  /** Classe opcional aplicada ao container dos children */
  className?: string;
};

// Agora o componente aceita children
type Props = React.PropsWithChildren<BaseProps>;

type Star = { x: number; y: number; r: number; s: number };
type Asteroid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  vertices: number;
  wobble: number;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function BackgroundAsteroids({
  speed = 1,
  overlayStrength = 0.35,
  className,
  children,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const lastRef = useRef<number>(0);

  // cria/atualiza estrelas e asteroides ao redimensionar
  const setup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = (canvas.width = Math.floor(canvas.clientWidth * dpr));
    const h = (canvas.height = Math.floor(canvas.clientHeight * dpr));

    // densidade baseada na área
    const starCount = Math.floor((w * h) / (1200 * dpr));
    const asteroidCount = Math.floor((w * h) / (220000 * dpr)); // bem mais raros

    // estrelas
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.4, 1.6) * dpr,
        s: rand(0.05, 0.35), // velocidade vertical lenta
      });
    }
    starsRef.current = stars;

    // asteroides simples (polígonos irregulares)
    const asteroids: Asteroid[] = [];
    for (let i = 0; i < asteroidCount; i++) {
      const size = rand(10, 32) * dpr;
      asteroids.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-0.06, 0.06) * dpr,
        vy: rand(0.04, 0.12) * dpr,
        size,
        rot: rand(0, Math.PI * 2),
        vrot: rand(-0.003, 0.003),
        vertices: Math.floor(rand(5, 9)),
        wobble: rand(0.85, 1.2),
      });
    }
    asteroidsRef.current = asteroids;
  };

  // desenho por frame
  const draw = (t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const elapsed = lastRef.current ? t - lastRef.current : 16;
    lastRef.current = t;
    const dt = Math.min(32, elapsed) * (speed / 16); // normaliza delta

    // fundo preto
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // estrelas
    const stars = starsRef.current;
    ctx.save();
    ctx.fillStyle = "#cbd5e1"; // slate-300
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.s * dt;
      if (s.y > h + 4) s.y = -4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // asteroides
    const asteroids = asteroidsRef.current;
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)"; // slate-400 (baixo alpha)
    ctx.fillStyle = "rgba(15, 23, 42, 0.45)"; // slate-900 semi
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.vrot * dt;

      // wrap
      if (a.x < -a.size) a.x = w + a.size;
      if (a.x > w + a.size) a.x = -a.size;
      if (a.y > h + a.size) a.y = -a.size;

      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);

      // polígono irregular
      ctx.beginPath();
      for (let v = 0; v < a.vertices; v++) {
        const ang = (v / a.vertices) * Math.PI * 2;
        const rr = a.size * (0.75 + Math.sin(v * 1.8) * 0.12) * a.wobble;
        const px = Math.cos(ang) * rr;
        const py = Math.sin(ang) * rr;
        if (v === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // vinheta
    const grd = ctx.createRadialGradient(
      w * 0.5,
      h * 0.5,
      Math.min(w, h) * 0.25,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.7
    );
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, `rgba(0,0,0,${overlayStrength})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    // evita rodar em ambientes sem window (SSR)
    if (typeof window === "undefined") return;

    setup();
    rafRef.current = requestAnimationFrame(draw);
    const onResize = () => {
      setup();
    };
    window.addEventListener("resize", onResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, overlayStrength]);

  return (
    <>
      {/* Canvas fixo no fundo */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ display: "block" }}
        />
      </div>

      {/* Conteúdo por cima do fundo (children) */}
      <div className={className}>{children}</div>
    </>
  );
}
