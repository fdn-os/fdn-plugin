import type { Transition, TargetAndTransition } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Canonical motion tokens — ported from grain-tech/delivery-tracker globals.css.
// One source of truth: every animated component imports from here so the whole
// kit shares the same easings and durations. Infinite/attention pulses stay in
// StyleX keyframes (see ui.tsx) — framer-motion is for enter/exit/tap/swap only.
// ─────────────────────────────────────────────────────────────────────────────

/** --ease-out: cubic-bezier(0.23, 1, 0.32, 1) — the default enter easing. */
export const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];
/** --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1). */
export const easeInOut: [number, number, number, number] = [0.77, 0, 0.175, 1];

/** Zero-duration transition for prefers-reduced-motion. */
export const instant: Transition = { duration: 0 };

// ── popoverEnter — THE shared enter motion (Select, Menu, Modal, dropdowns) ──
// delivery-tracker: opacity 0→1 + translateY(-2px→0), 120–150ms ease-out.
// Exit reverses at ~100ms so closing animates too.
export const popoverEnterTransition: Transition = { duration: 0.14, ease: easeOut };
export const popoverExitTransition: Transition = { duration: 0.1, ease: easeOut };
export const popoverMotion = {
  initial: { opacity: 0, y: -2 },
  animate: { opacity: 1, y: 0, transition: popoverEnterTransition },
  exit: { opacity: 0, y: -2, transition: popoverExitTransition },
} satisfies Record<string, TargetAndTransition>;

// ── Modal — popoverEnter plus a subtle scale (0.98→1) on the panel ───────────
export const modalPanelMotion = {
  initial: { opacity: 0, y: -2, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: popoverEnterTransition },
  exit: { opacity: 0, y: -2, scale: 0.98, transition: popoverExitTransition },
} satisfies Record<string, TargetAndTransition>;
export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: easeOut } },
} satisfies Record<string, TargetAndTransition>;

// ── iconSwap — AnimatePresence mode="wait" swap (e.g. sun ⇄ moon) ────────────
// delivery-tracker: spring, duration 0.25, bounce 0.15; scale 0.8→1 + opacity.
export const iconSwapTransition: Transition = { type: "spring", duration: 0.25, bounce: 0.15 };
export const iconSwapMotion = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
} satisfies Record<string, TargetAndTransition>;

// ── toast — bottom-right stack enter/exit ────────────────────────────────────
// delivery-tracker tracking-content.tsx: {opacity:0, y:12} ⇄ {opacity:1, y:0}, 0.18s.
export const toastTransition: Transition = { duration: 0.18 };
export const toastMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
} satisfies Record<string, TargetAndTransition>;

// ── buttonPress — scale 0.97 on whileTap (:active parity in StyleX) ──────────
export const pressTransition: Transition = { duration: 0.16, ease: easeOut };
export const buttonTap: TargetAndTransition = { scale: 0.97 };

// ── Tabs — the layoutId active-pill indicator slide ──────────────────────────
// Same spring family as iconSwap so the kit's springs feel related.
export const tabIndicatorTransition: Transition = { type: "spring", duration: 0.3, bounce: 0.15 };
