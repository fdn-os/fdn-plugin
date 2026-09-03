import * as stylex from "@stylexjs/stylex";

// The one type stack, spelled out once and shared by `fontSans` + `fontDisplay` below. Deliberately
// webfont-free: the template ships as UTF-8 text only (so `commit_source` can carry the whole source
// tree), which rules out a self-hosted .woff2, and a Google Fonts <link> would add a third-party
// request to every tenant app plus a CSP/privacy cost. This resolves to the platform's own UI face —
// SF Pro, Segoe UI, Roboto — so it looks native everywhere and costs zero bytes.
const systemSans = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Design tokens — ported from grain-tech/delivery-tracker (the canonical Grain design system).
// /fdn:build overwrites these VALUES from the resolved STYLE GUIDE (console admin → Style guides);
// the keys are the contract. Values below = the canonical Grain (light) palette on the system type stack.
export const tokens = stylex.defineVars({
  // surfaces (warm cream family)
  bg: "#FFFCF7", // --background
  bgTint: "#FBF7F3", // --cream
  surface: "#FFFFFF", // --panel
  surface2: "#F6F2ED", // --filled-1
  surface3: "#EAE6E1", // --filled-2
  line: "#E0DCD7", // --border
  line2: "#EAE6E1",

  // ink
  text: "#1A1A1A", // --text-primary
  textHover: "#33302b", // hover shade of `text` (primary button fill) — flips with the theme
  muted: "#7A746D", // --text-secondary
  dim: "#9A9691", // --grey

  // brand (theme-invariant)
  accent: "#FECC07", // --brand-yellow
  accentHover: "#F4C200",
  accentInk: "#8A6A00", // dark amber for accent-as-text / links
  onBrand: "#1A1A1A", // --on-brand: text on the yellow fill
  ink: "#1A1A1A",

  // status (from delivery-tracker) — for badges, pills, toasts
  successBg: "#E3FCEF",
  successText: "#31AA88",
  successBorder: "#8CD9C3",
  warningBg: "#FFF6DD",
  warningText: "#FFBB00",
  warningTextStrong: "#B88000",
  warningBorder: "#F8D86F",
  dangerBg: "#FFECEC",
  dangerText: "#FF2E2E",
  dangerBorder: "#FFB3B3",
  onStatus: "#FFFFFF",

  // radii — delivery-tracker: rounded-lg (8px) dominant, 10px inputs, 15px xl, 5px xs
  radiusSm: "5px",
  radius: "8px",
  radiusInput: "10px",
  radiusLg: "15px",
  radiusPill: "999px",

  // elevation — mostly borders; shadows reserved for popovers/modals (delivery-tracker uses shadow-lg)
  shadowSm: "0 1px 2px rgba(26, 26, 26, .04)",
  shadow: "0 4px 14px rgba(26, 26, 26, .07), 0 1px 3px rgba(26, 26, 26, .05)",
  shadowLg: "0 16px 40px rgba(26, 26, 26, .14), 0 6px 16px rgba(26, 26, 26, .08)",
  focusRing: "0 0 0 3px rgba(254, 204, 7, .18)",

  // type — one stack throughout (delivery-tracker's headings are just the body face at font-bold, not
  // a separate display face). fontDisplay is kept as a hook: a style guide MAY point it at a display
  // face, but that face is then the style guide's job to load — the template ships no font binary.
  fontSans: systemSans,
  fontDisplay: systemSans,
  fontMono: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
  textXs: "0.75rem",
  textSm: "0.875rem",
  textBase: "1rem",
  textLg: "1.125rem",
  textXl: "1.375rem",
  text2xl: "1.5rem",
  text3xl: "1.875rem",

  // motion
  ease: "cubic-bezier(.22, 1, .36, 1)",
});

// Dark theme — the delivery-tracker dark palette mapped onto the same token keys.
// Applied as a className on the app shell (and mirrored on <body> for portaled popovers)
// when the resolved theme is dark; see `useTheme` in components/ui.tsx.
// accent / onBrand / ink and all radii / fonts / type / ease are theme-invariant.
// /fdn:build overwrites these VALUES from the style guide's `content.tokensDark`.
export const darkTheme = stylex.createTheme(tokens, {
  bg: "oklch(0.208 0.011 261)",
  bgTint: "oklch(0.229 0.013 258)",
  surface: "oklch(0.239 0.012 264)",
  surface2: "oklch(0.273 0.018 266)",
  surface3: "oklch(0.300 0.014 262)",
  line: "oklch(0.332 0.015 264)",
  line2: "oklch(0.300 0.014 262)",
  text: "oklch(0.934 0.004 271)",
  textHover: "oklch(0.86 0.004 271)",
  muted: "oklch(0.705 0.013 265)",
  dim: "oklch(0.606 0.013 265)",
  accentHover: "#ffd94d",
  accentInk: "oklch(0.880 0.135 86)",
  successBg: "oklch(0.311 0.046 168)",
  successText: "oklch(0.796 0.109 167)",
  successBorder: "oklch(0.415 0.067 160)",
  warningBg: "oklch(0.314 0.041 87)",
  warningText: "oklch(0.880 0.135 86)",
  warningTextStrong: "oklch(0.880 0.135 86)",
  warningBorder: "oklch(0.413 0.058 91)",
  dangerBg: "oklch(0.276 0.050 21)",
  dangerText: "oklch(0.753 0.149 21)",
  dangerBorder: "oklch(0.351 0.068 21)",
  onStatus: "#1A1A1A",
  shadowSm: "0 1px 2px rgba(0,0,0,.4)",
  shadow: "0 4px 14px rgba(0,0,0,.45), 0 1px 3px rgba(0,0,0,.4)",
  shadowLg: "0 16px 40px rgba(0,0,0,.55), 0 6px 16px rgba(0,0,0,.4)",
  focusRing: "0 0 0 3px rgba(254,204,7,.28)",
});
