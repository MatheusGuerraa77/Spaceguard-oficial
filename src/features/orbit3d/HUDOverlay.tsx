import { useEffect, useRef } from "react";
import * as d3 from "d3";
import clsx from "clsx";

type Props = {
  className?: string;
  speedKms?: number;
  altitudeKm?: number;
  energyMt?: number;
  active?: boolean;          // << NOVO
};

export default function HUDOverlay({ className, speedKms, altitudeKm, energyMt, active = false }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gradIdRef = useRef(`radGrad-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").interrupt();
    svg.selectAll("*").remove();

    // se não estiver ativo, não desenha nada
    if (!active) return;

    const w = svgRef.current.clientWidth;
    const h = svgRef.current.clientHeight;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.38;

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);
    const nasaBlue = "#0B3D91";
    const nasaRed = "#FC3D21";

    const defs = svg.append("defs");
    const grad = defs.append("radialGradient").attr("id", gradIdRef.current);
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#0b3d91").attr("stop-opacity", 0.20);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#000").attr("stop-opacity", 0.0);

    g.append("circle")
      .attr("r", radius + 16)
      .attr("fill", `url(#${gradIdRef.current})`)
      .attr("opacity", 0.35);

    const rings = [radius * 0.55, radius * 0.75, radius * 0.95];
    g.selectAll("circle.ring")
      .data(rings)
      .enter()
      .append("circle")
      .attr("class", "ring")
      .attr("r", (d) => d)
      .attr("fill", "none")
      .attr("stroke", "#ffffff20")
      .attr("stroke-width", 1);

    const inner = radius * 0.78;
    const outer = radius * 0.92;
    const arcGen = d3.arc<d3.DefaultArcObject>().innerRadius(inner).outerRadius(outer);
    const sweep = g.append("path").attr("fill", nasaBlue).attr("opacity", 0.55);
    function animateSweep() {
      d3.transition()
        .duration(2400)
        .ease(d3.easeCubicInOut)
        .tween("sweep", () => {
          const interp = d3.interpolate(0, Math.PI * 1.8);
          return (t) => {
            const datum: d3.DefaultArcObject = { innerRadius: inner, outerRadius: outer, startAngle: 0, endAngle: interp(t) };
            sweep.attr("d", arcGen(datum) ?? "");
          };
        })
        .on("end", animateSweep);
    }
    animateSweep();

    const ticks = d3.range(0, 360, 10);
    g.selectAll("line.tick")
      .data(ticks)
      .enter()
      .append("line")
      .attr("class", "tick")
      .attr("x1", (d) => Math.cos((d * Math.PI) / 180) * (radius * 0.98))
      .attr("y1", (d) => Math.sin((d * Math.PI) / 180) * (radius * 0.98))
      .attr("x2", (d) => Math.cos((d * Math.PI) / 180) * (radius * 1.02))
      .attr("y2", (d) => Math.sin((d * Math.PI) / 180) * (radius * 1.02))
      .attr("stroke", "#ffffff26")
      .attr("stroke-width", (d) => (d % 30 === 0 ? 2 : 1));

    const fmt1 = d3.format(",.1f");
    const speedVal = speedKms ?? 20;
    const altVal = altitudeKm ?? 800;
    const eVal = energyMt ?? 120;

    const items: Array<{ label: string; color: string; value: string }> = [
      { label: "VELOCIDADE", color: "#ffffff", value: `${fmt1(speedVal)} km/s` },
      { label: "ALTITUDE",  color: nasaBlue,   value: `${d3.format(",.0f")(altVal)} km` },
      { label: "ENERGIA",   color: nasaRed,    value: `${fmt1(eVal)} Mt TNT` },
    ];

    const y0 = -radius * 0.15;
    items.forEach((d, i) => {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("y", y0 + i * 36)
        .attr("fill", "#8ea3b0")
        .attr("font-size", 10)
        .attr("letter-spacing", 2)
        .text(d.label);

      const val = g
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", y0 + i * 36 + 18)
        .attr("fill", d.color)
        .attr("font-size", 20)
        .attr("font-weight", 700);

      const target = i === 0 ? speedVal : i === 1 ? altVal : eVal;
      const formatter = i === 1 ? d3.format(",.0f") : d3.format(",.1f");

      val
        .transition()
        .duration(900)
        .tween("text", () => {
          const interp = d3.interpolateNumber(0, target);
          return (t) => {
            const txt =
              i === 0 ? `${formatter(interp(t))} km/s`
              : i === 1 ? `${formatter(interp(t))} km`
              : `${formatter(interp(t))} Mt TNT`;
            val.text(txt);
          };
        });
    });

    return () => {
      svg.selectAll("*").interrupt();
      svg.selectAll("*").remove();
    };
  }, [speedKms, altitudeKm, energyMt, active]);

  return (
    <div className={clsx("pointer-events-none", className)}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
