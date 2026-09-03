import * as stylex from "@stylexjs/stylex";
import { tokens } from "../tokens.stylex";

// A dependency-free, StyleX-styled SVG bar chart — data-viz as part of the design system, no chart lib.
const styles = stylex.create({
  svg: { width: "100%", height: 180, display: "block", overflow: "visible" },
  bar: { fill: tokens.accent },
  label: { fill: tokens.muted, fontSize: 11 },
});

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const gap = 8;
  const barW = (100 - gap * (n - 1)) / n;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...stylex.props(styles.svg)}>
      {data.map((d, i) => {
        const h = (d.value / max) * 82;
        const x = i * (barW + gap);
        return (
          <g key={d.label}>
            <rect x={x} y={88 - h} width={barW} height={h} rx={1.5} {...stylex.props(styles.bar)} />
            <text x={x + barW / 2} y={98} textAnchor="middle" {...stylex.props(styles.label)}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
