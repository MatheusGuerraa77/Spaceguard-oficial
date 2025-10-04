import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Props = { energyMt: number; baseRadiusKm?: number; className?: string };

export default function ImpactOverlay({ energyMt, baseRadiusKm = 50, className }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll("*").remove();

    const w = 600, h = 600;
    const g = svg
      .attr("viewBox", `0 0 ${w} ${h}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${w / 2}, ${h / 2})`);

    // raio ~ Mt^(1/3) (heurística educacional)
    const base = baseRadiusKm * Math.cbrt(Math.max(energyMt, 0.001));
    const scale = d3.scaleLinear().domain([0, 1]).range([0, base]);

    const ring = g.append("circle").attr("fill", "none").attr("stroke", "rgba(252,61,33,0.9)").attr("stroke-width", 3);
    const ring2 = g.append("circle").attr("fill", "none").attr("stroke", "rgba(122,162,255,0.6)").attr("stroke-width", 2);
    g.append("circle").attr("r", 6).attr("fill", "#ffffff");

    const label = g
      .append("text")
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .attr("fill", "#E5E7EB")
      .style("font", "600 14px system-ui");

    let id = 0;
    const tick = () => {
      const t = (Date.now() % 2000) / 2000; // 2s loop
      ring.attr("r", scale(t)).attr("opacity", 1 - t);
      ring2.attr("r", scale((t + 0.35) % 1)).attr("opacity", 1 - ((t + 0.35) % 1));
      label.text(`${Math.round(scale(t))} km`);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [energyMt, baseRadiusKm]);

  return <svg ref={ref} className={className ?? "w-full h-full"} aria-label="Shockwave overlay" />;
}