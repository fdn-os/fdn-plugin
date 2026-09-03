import * as stylex from "@stylexjs/stylex";
import { tokens } from "../tokens.stylex";
import { surfaces } from "../components/ui";

const s = stylex.create({
  title: { fontFamily: tokens.fontDisplay, fontSize: tokens.text2xl, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 4px", lineHeight: 1.2 },
  sub: { fontSize: tokens.textSm, color: tokens.muted, margin: "0 0 18px", maxWidth: 620, lineHeight: 1.6 },
  panelPad: { padding: 20 },
  steps: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 0 },
  step: { display: "flex", gap: 12, alignItems: "flex-start", paddingBlock: 14, borderTop: `1px solid ${tokens.line}` },
  stepFirst: { borderTop: 0, paddingTop: 0 },
  num: {
    flexShrink: 0, width: 22, height: 22, borderRadius: tokens.radiusSm, display: "grid", placeItems: "center",
    backgroundColor: tokens.surface2, color: tokens.text, fontSize: tokens.textXs, fontWeight: 700, fontVariantNumeric: "tabular-nums",
  },
  stepText: { margin: 0, fontSize: tokens.textSm, lineHeight: 1.55, color: tokens.text },
  code: {
    fontFamily: tokens.fontMono, fontSize: "0.85em", backgroundColor: tokens.surface2,
    borderWidth: 1, borderStyle: "solid", borderColor: tokens.line, borderRadius: 5, padding: "1px 5px", color: tokens.text,
  },
});

const STEPS = [
  <>Edit <code {...stylex.props(s.code)}>src/routes</code> and register routes in <code {...stylex.props(s.code)}>src/router.tsx</code>.</>,
  <>Compose UI from the kit in <code {...stylex.props(s.code)}>src/components/ui.tsx</code> (Button, Badge, Field/Input/Textarea, Checkbox, Select, Menu, SearchInput, Table, Tabs, Modal, Toast, Skeleton, NavBar, panels) — it matches Foundational's design system, with motion tokens in <code {...stylex.props(s.code)}>src/components/motion.ts</code>.</>,
  <>Add server routes in <code {...stylex.props(s.code)}>worker/index.ts</code>; they run at the edge under <code {...stylex.props(s.code)}>/api/*</code>.</>,
  <>Provision Neon and read it from the Worker via <code {...stylex.props(s.code)}>env.DATABASE_URL</code>.</>,
  <>Reskin everything by editing <code {...stylex.props(s.code)}>src/tokens.stylex.ts</code> — or apply a style guide.</>,
];

export function AboutPage() {
  return (
    <div>
      <h1 {...stylex.props(s.title)}>About this starter</h1>
      <p {...stylex.props(s.sub)}>
        The Foundational builders app boilerplate — TanStack Router + Query + StyleX, built to a static bundle served
        from R2 with a Worker API, styled with Foundational's design system.
      </p>
      <div {...stylex.props(surfaces.panel, s.panelPad)}>
        <ol {...stylex.props(s.steps)}>
          {STEPS.map((text, i) => (
            <li key={i} {...stylex.props(s.step, i === 0 && s.stepFirst)}>
              <span {...stylex.props(s.num)}>{i + 1}</span>
              <p {...stylex.props(s.stepText)}>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
