import type { SVGProps } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// The Grain mark — the four-leaf sprout — drawn inline as SVG.
//
// Inline rather than an imported .png for two reasons that both bite a builder:
//  1. it keeps the whole template UTF-8 TEXT, so `commit_source` can carry the entire source tree.
//     A binary has to be sent base64-encoded, and ~100 KB of PNG is ~140 K characters — more than an
//     agent can pass through its context, which is how the asset used to go missing from a repo.
//  2. `fill: currentColor` lets ONE component serve light AND dark surfaces. The old pair of
//     near-black / white PNGs plus a CSS `invert()` filter is gone: the mark follows the ink token.
//
// The path data is the canonical Grain logomark, copied verbatim from grain-core
// (`Icons::FdnMark` / the React `LogomarkIcon` primitive) — keep it that way so the two stay
// diffable. The viewBox is the glyph's TIGHT bounds: the original Figma export window
// (4.5 4.5 12.68 15) carried ~2.5 units of dead canvas left of the glyph against ~0.5 right, so the
// mark rendered visibly off-centre wherever it was boxed. Do not "tidy" it to a 0-origin box.
// ─────────────────────────────────────────────────────────────────────────────
const MARK_W = 9.66;
const MARK_H = 14;

/**
 * The bare mark. `size` is its HEIGHT in px and the width follows the glyph's own ratio, exactly as
 * the PNG's intrinsic aspect used to. Colour comes from `currentColor`, so set it on the parent —
 * the kit's `<Logo>` pins it to the ink token. For mark + wordmark, use `<Logo withText />`.
 */
export function FdnMark({ size = 22, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={`7 5 ${MARK_W} ${MARK_H}`} height={size} width={Number(((size * MARK_W) / MARK_H).toFixed(2))}
      fill="currentColor" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Foundational" {...props}
    >
      <path d="M16.6507 5.0021V9.24877C16.6507 10.1246 16.3378 10.9857 15.8064 11.6787C15.3234 12.3088 14.7059 12.8024 13.9645 13.0964C13.3093 13.3883 12.4566 13.6971 12.4209 13.7076C12.4209 13.6782 12.4209 13.6341 12.4209 13.6109C12.4209 12.2248 12.4209 10.8323 12.4293 9.45039C12.4524 8.27846 12.9144 7.28295 13.7734 6.47646C14.2103 6.06061 14.7038 5.81279 15.2058 5.59436L16.6507 5.0042V5.0021Z" />
      <path d="M7.00433 10.4878C7.31936 10.6096 7.6428 10.7083 7.93892 10.8343C8.33586 11.0023 8.7517 11.1451 9.12134 11.3594C10.1378 11.9516 10.8078 12.8484 11.1039 13.9993C11.2026 14.3816 11.2404 14.7701 11.2383 15.165C11.2362 16.402 11.2383 17.6369 11.2383 18.874C11.2383 18.9139 11.2383 18.9538 11.2383 19C10.8393 18.9727 10.4676 18.8845 10.1105 18.7375C8.80421 18.2019 7.87802 17.2799 7.33407 15.9778C7.11354 15.4464 7.00643 14.894 7.00643 14.3228C7.00643 13.0836 7.00643 11.8277 7.00643 10.5886C7.00643 10.5592 7.00643 10.5319 7.00643 10.4857L7.00433 10.4878Z" />
      <path d="M11.2384 10.9836C11.0452 10.9143 10.8562 10.8533 10.6882 10.7903C10.1946 10.5845 9.73046 10.4081 9.24532 10.1876C8.25402 9.64991 7.54415 8.82662 7.20182 7.7429C7.059 7.29135 6.996 6.7852 7.0002 6.31264C7.0023 5.9241 7.0002 5.53556 7.0002 5.14492C7.0002 5.10921 7.0002 5.05041 7.0002 5C7.16191 5.06301 7.32993 5.12391 7.47694 5.18482C7.96839 5.38644 8.48294 5.56706 8.95549 5.80649C9.87748 6.27064 10.5264 7.00992 10.9213 7.96553C11.1481 8.51369 11.2489 9.08915 11.2384 9.68352V10.9836Z" />
      <path d="M16.6507 13.2181C16.6444 13.7243 16.6801 14.5875 16.5667 15.2448C16.3671 16.1521 15.8841 16.9796 15.2351 17.6412C14.5778 18.3112 13.7671 18.7396 12.8472 18.9454C12.6939 18.979 12.5931 18.9958 12.4229 18.9958C12.4229 18.748 12.4229 18.5212 12.4229 18.2944C12.4229 17.8428 12.4061 17.3661 12.4986 16.9187C12.7317 15.7888 13.3365 14.913 14.2711 14.2514C14.7374 13.9595 15.0734 13.8356 15.5039 13.6613C15.8526 13.5184 16.2936 13.3315 16.6528 13.2202" />
    </svg>
  );
}
