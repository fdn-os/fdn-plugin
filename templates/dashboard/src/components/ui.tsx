import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode,
  type TextareaHTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import * as stylex from "@stylexjs/stylex";
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { darkTheme, tokens } from "../tokens.stylex";
import {
  backdropMotion, buttonTap, iconSwapMotion, iconSwapTransition, instant,
  modalPanelMotion, popoverMotion, pressTransition, tabIndicatorTransition,
  toastMotion, toastTransition,
} from "./motion";
import { FdnMark } from "./FdnMark";

// ─────────────────────────────────────────────────────────────────────────────
// Grain component kit — ported from grain-tech/delivery-tracker: flat, bordered,
// compact. rounded-lg (8px) dominant, 10px popovers, dark primary buttons
// (yellow is accent/focus only), rounded-full badges, borders over shadows
// (shadow reserved for popovers/menus). Inter throughout.
// ─────────────────────────────────────────────────────────────────────────────

// FDN logo mark (the sprout icon) — always bundled so any screen can use it. `withText` pairs it with
// the "Foundational" wordmark. Import `FdnMark` directly for custom placements.
export { FdnMark };
const logo = stylex.create({
  // The mark is an inline SVG filled with `currentColor`, so pinning colour here is what makes it
  // follow the theme — one component, both surfaces, no second asset and no invert filter.
  mark: { display: "block", color: tokens.text },
  wrap: { display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: tokens.text },
  word: { fontWeight: 700, fontSize: tokens.textBase, letterSpacing: "-0.01em", color: tokens.text },
});
export function Logo({ withText = false, size = 22 }: { withText?: boolean; size?: number }) {
  const mark = <FdnMark size={size} {...stylex.props(logo.mark)} />;
  if (!withText) return mark;
  return (
    <span {...stylex.props(logo.wrap)}>
      {mark}
      <span {...stylex.props(logo.word)}>Foundational</span>
    </span>
  );
}

// ── Icons — tiny inline SVGs (no icon dep); stroke follows currentColor ──────
type IconProps = { size?: number };
const iconSvg = (size: number, children: ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const SearchIcon = ({ size = 15 }: IconProps) => iconSvg(size, <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>);
const ChevronDownIcon = ({ size = 14 }: IconProps) => iconSvg(size, <path d="m6 9 6 6 6-6" />);
const CheckIcon = ({ size = 12 }: IconProps) => iconSvg(size, <path d="M20 6 9 17l-5-5" />);
const MinusIcon = ({ size = 12 }: IconProps) => iconSvg(size, <path d="M5 12h14" />);
const XIcon = ({ size = 14 }: IconProps) => iconSvg(size, <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>);
const DotsIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
  </svg>
);
const SunIcon = ({ size = 15 }: IconProps) => iconSvg(size, <>
  <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" />
  <path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" />
  <path d="m19.07 4.93-1.41 1.41" />
</>);
const MoonIcon = ({ size = 15 }: IconProps) => iconSvg(size, <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);
const MonitorIcon = ({ size = 15 }: IconProps) => iconSvg(size, <>
  <rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
</>);
const LogOutIcon = ({ size = 15 }: IconProps) => iconSvg(size, <>
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
</>);
const SortIcon = ({ dir }: { dir: "asc" | "desc" | null }) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <path d="m7 9 5-5 5 5" opacity={dir === "asc" ? 1 : dir === "desc" ? 0 : 0.35} />
    <path d="m7 15 5 5 5-5" opacity={dir === "desc" ? 1 : dir === "asc" ? 0 : 0.35} />
  </svg>
);

// ── Motion helpers ───────────────────────────────────────────────────────────
/** Applies a motion preset (initial/animate/exit), collapsing to instant under prefers-reduced-motion. */
function useMotionPreset(
  preset: { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition },
) {
  const reduce = useReducedMotion();
  if (!reduce) return preset;
  return {
    initial: preset.initial,
    animate: { ...preset.animate, transition: instant },
    exit: { ...preset.exit, transition: instant },
  };
}

// Inline spinner — Button loading state + loading toasts. StyleX keyframes (CSS,
// compositor-friendly); reduced-motion freezes it to a static ring.
const spinKf = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});
const spinnerSx = stylex.create({
  ring: {
    display: "inline-block", flexShrink: 0, width: 12, height: 12, borderRadius: "50%",
    borderWidth: 2, borderStyle: "solid", borderColor: "currentColor", borderTopColor: "transparent",
    animationName: { default: spinKf, "@media (prefers-reduced-motion: reduce)": "none" },
    animationDuration: "0.6s", animationTimingFunction: "linear", animationIterationCount: "infinite",
  },
});
export function Spinner({ size = 12 }: { size?: number }) {
  return <span aria-hidden="true" {...stylex.props(spinnerSx.ring)} style={{ width: size, height: size }} />;
}

// Row-actions context. A form-sized (36px) button inside a compact table row dominates the row, so
// `<TD actions>` flips any Button inside it to the 30px size automatically. Making the correct size
// the DEFAULT rather than a thing to remember is deliberate: a rule you must remember is a rule that
// ships broken. An explicit `size` prop still wins.
const InRowActions = createContext(false);

// ── Button ───────────────────────────────────────────────────────────────────
const btn = stylex.create({
  base: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: tokens.radius, fontFamily: tokens.fontSans, fontWeight: 500, lineHeight: 1,
    cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", userSelect: "none",
    borderWidth: 1, borderStyle: "solid", borderColor: "transparent",
    transitionProperty: "background-color, border-color, color, box-shadow",
    transitionDuration: "140ms", transitionTimingFunction: tokens.ease,
    outline: "none",
    boxShadow: { default: null, ":focus-visible": tokens.focusRing },
  },
  sm: { height: 30, paddingInline: 12, fontSize: tokens.textXs },
  md: { height: 36, paddingInline: 16, fontSize: tokens.textSm },
  iconOnly: { paddingInline: 0, width: 36 },
  iconOnlySm: { paddingInline: 0, width: 30 },
  primary: { backgroundColor: { default: tokens.text, ":hover": tokens.textHover }, color: tokens.bg },
  secondary: {
    backgroundColor: { default: tokens.surface, ":hover": tokens.surface2 },
    color: tokens.text, borderColor: tokens.line,
  },
  ghost: {
    backgroundColor: { default: "transparent", ":hover": tokens.surface2 },
    color: { default: tokens.muted, ":hover": tokens.text },
  },
  accent: { backgroundColor: { default: tokens.accent, ":hover": tokens.accentHover }, color: tokens.onBrand },
  disabled: { opacity: 0.4, cursor: "not-allowed" },
});

type Variant = "primary" | "secondary" | "ghost" | "accent";
// framer-motion redefines these handler props on motion.* elements, so drop the
// React DOM versions from the public prop surface (they were never kit API).
type MotionSafe<T> = Omit<T, "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd">;

export function Button(
  { variant = "primary", size, loading = false, disabled, children, ...props }:
  { variant?: Variant; size?: "sm" | "md"; loading?: boolean } & MotionSafe<ButtonHTMLAttributes<HTMLButtonElement>>,
) {
  const reduce = useReducedMotion();
  // Compact by default inside a table's actions cell; form-sized everywhere else. Explicit wins.
  const inRow = useContext(InRowActions);
  const resolved = size ?? (inRow ? "sm" : "md");
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type="button"
      whileTap={isDisabled || reduce ? undefined : buttonTap}
      transition={pressTransition}
      {...props}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...stylex.props(btn.base, btn[resolved], btn[variant], isDisabled ? btn.disabled : null)}
    >
      {loading && <Spinner />}
      {children}
    </motion.button>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
// Attention keyframes — ported 1:1 from delivery-tracker globals.css. Infinite /
// one-shot CSS pulses stay in StyleX keyframes (never framer-motion).
// `unrelayed-pulse`: the hero attention flash — warning colours breathe up to the
// brand yellow at 50% while scaling to 1.12, 1.4s easeInOut, infinite.
const badgePulseKf = stylex.keyframes({
  "0%, 100%": { backgroundColor: tokens.warningBg, borderColor: tokens.warningBorder, color: tokens.text, transform: "scale(1)" },
  "50%": { backgroundColor: tokens.accent, borderColor: tokens.warningTextStrong, color: tokens.onBrand, transform: "scale(1.12)" },
});
// `badge-nudge`: one-shot attention pop — scale 1 → 1.12 (at 40%) → 1, 0.5s easeOut, ×2.
const badgeNudgeKf = stylex.keyframes({
  "0%": { transform: "scale(1)" },
  "40%": { transform: "scale(1.12)" },
  "100%": { transform: "scale(1)" },
});

const badge = stylex.create({
  base: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: tokens.radiusPill, paddingBlock: 2, paddingInline: 8,
    fontSize: tokens.textXs, fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap",
    borderWidth: 1, borderStyle: "solid", borderColor: "transparent",
  },
  default: { backgroundColor: tokens.surface2, color: tokens.text },
  success: { backgroundColor: tokens.successBg, color: tokens.successText, borderColor: tokens.successBorder },
  warning: { backgroundColor: tokens.warningBg, color: tokens.warningTextStrong, borderColor: tokens.warningBorder },
  danger: { backgroundColor: tokens.dangerBg, color: tokens.dangerText, borderColor: tokens.dangerBorder, fontWeight: 600 },
  info: { backgroundColor: tokens.surface3, color: tokens.text },
  muted: { backgroundColor: tokens.surface2, color: tokens.muted },
  outline: { backgroundColor: tokens.surface, color: tokens.muted, borderStyle: "dashed", borderColor: tokens.line },
  // delivery-tracker `.unrelayed-pulse` — resting state matches the keyframe 0% so
  // reduced-motion (animation: none) leaves a coherent warning badge.
  pulse: {
    backgroundColor: tokens.warningBg, borderColor: tokens.warningBorder, color: tokens.text, fontWeight: 600,
    animationName: { default: badgePulseKf, "@media (prefers-reduced-motion: reduce)": "none" },
    animationDuration: "1.4s",
    animationTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)", // easeInOut
    animationIterationCount: "infinite",
  },
  nudge: {
    animationName: { default: badgeNudgeKf, "@media (prefers-reduced-motion: reduce)": "none" },
    animationDuration: "0.5s",
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)", // easeOut
    animationIterationCount: 2,
  },
});

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted" | "outline";
export function Badge(
  { variant = "default", pulse = false, nudge = false, children }:
  { variant?: BadgeVariant; pulse?: boolean; nudge?: boolean; children: ReactNode },
) {
  return <span {...stylex.props(badge.base, badge[variant], pulse && badge.pulse, nudge && badge.nudge)}>{children}</span>;
}

// ── Field / Label — accessible form scaffolding ─────────────────────────────
// <Field label="Email" hint="…" error="…"><Input/></Field> wires htmlFor,
// aria-describedby and aria-invalid to the control inside via context.
interface FieldCtxValue { id: string; descId?: string; invalid: boolean }
const FieldCtx = createContext<FieldCtxValue | null>(null);

const fieldSx = stylex.create({
  stack: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: tokens.textXs, fontWeight: 600, color: tokens.text, letterSpacing: "0.01em" },
  hint: { margin: 0, fontSize: tokens.textXs, color: tokens.muted, lineHeight: 1.5 },
  error: { margin: 0, fontSize: tokens.textXs, color: tokens.dangerText, fontWeight: 500, lineHeight: 1.5 },
});

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return <label htmlFor={htmlFor} {...stylex.props(fieldSx.label)}>{children}</label>;
}

export function Field(
  { label, hint, error, id: idProp, children }:
  { label: ReactNode; hint?: ReactNode; error?: ReactNode; id?: string; children: ReactNode },
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = hint || error ? `${id}-desc` : undefined;
  const ctx = useMemo<FieldCtxValue>(() => ({ id, descId, invalid: Boolean(error) }), [id, descId, error]);
  return (
    <div {...stylex.props(fieldSx.stack)}>
      <Label htmlFor={id}>{label}</Label>
      <FieldCtx.Provider value={ctx}>{children}</FieldCtx.Provider>
      {error
        ? <p id={descId} role="alert" {...stylex.props(fieldSx.error)}>{error}</p>
        : hint ? <p id={descId} {...stylex.props(fieldSx.hint)}>{hint}</p> : null}
    </div>
  );
}

// ── Input / Textarea / SearchInput ──────────────────────────────────────────
const field = stylex.create({
  input: {
    width: "100%", height: 36, paddingInline: 12, fontSize: tokens.textSm, fontFamily: tokens.fontSans,
    color: tokens.text, backgroundColor: tokens.surface, borderRadius: tokens.radius,
    borderWidth: 1, borderStyle: "solid",
    borderColor: { default: tokens.line, ":focus": tokens.text },
    boxShadow: { default: null, ":focus": `0 0 0 1px ${tokens.text}` },
    outline: "none",
    transitionProperty: "border-color, box-shadow", transitionDuration: "140ms", transitionTimingFunction: tokens.ease,
    "::placeholder": { color: tokens.dim },
  },
  invalid: {
    borderColor: { default: tokens.dangerBorder, ":focus": tokens.dangerText },
    boxShadow: { default: null, ":focus": `0 0 0 1px ${tokens.dangerText}` },
  },
  textarea: { height: "auto", minHeight: 88, paddingBlock: 8, lineHeight: 1.55, resize: "vertical" },
  searchWrap: { position: "relative", display: "block" },
  searchIcon: {
    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
    color: tokens.muted, pointerEvents: "none", display: "flex",
  },
  searchInput: {
    paddingInlineStart: 32,
    // the kit renders its own clear button — hide WebKit's native one
    "::-webkit-search-cancel-button": { display: "none", WebkitAppearance: "none" },
  },
  searchInputClearable: { paddingInlineEnd: 32 },
  clearBtn: {
    position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
    display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24,
    borderWidth: 0, borderRadius: tokens.radiusSm, backgroundColor: { default: "transparent", ":hover": tokens.surface2 },
    color: { default: tokens.muted, ":hover": tokens.text }, cursor: "pointer", padding: 0,
    outline: "none", boxShadow: { default: null, ":focus-visible": tokens.focusRing },
  },
});

/** Merges Field context (id / aria-describedby / aria-invalid) into control props. */
function useFieldWiring(props: { id?: string; "aria-describedby"?: string; "aria-invalid"?: React.AriaAttributes["aria-invalid"] }) {
  const ctx = useContext(FieldCtx);
  const invalid = props["aria-invalid"] ?? (ctx?.invalid ? true : undefined);
  return {
    id: props.id ?? ctx?.id,
    describedBy: props["aria-describedby"] ?? ctx?.descId,
    invalid,
  };
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { id, describedBy, invalid } = useFieldWiring(props);
  return (
    <input {...props} id={id} aria-describedby={describedBy} aria-invalid={invalid}
      {...stylex.props(field.input, invalid ? field.invalid : null)} />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, describedBy, invalid } = useFieldWiring(props);
  return (
    <textarea {...props} id={id} aria-describedby={describedBy} aria-invalid={invalid}
      {...stylex.props(field.input, field.textarea, invalid ? field.invalid : null)} />
  );
}

export function SearchInput(
  { value, onValueChange, placeholder = "Search…", ariaLabel = "Search", style, ...rest }:
  { value: string; onValueChange: (value: string) => void; placeholder?: string; ariaLabel?: string; style?: CSSProperties }
  & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "style" | "type">,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <span {...stylex.props(field.searchWrap)} style={style}>
      <span {...stylex.props(field.searchIcon)}><SearchIcon /></span>
      <input
        ref={inputRef} type="search" value={value} onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder} aria-label={ariaLabel} {...rest}
        {...stylex.props(field.input, field.searchInput, value ? field.searchInputClearable : null)}
      />
      {value && (
        <button
          type="button" aria-label="Clear search" {...stylex.props(field.clearBtn)}
          onClick={() => { onValueChange(""); inputRef.current?.focus(); }}
        >
          <XIcon size={13} />
        </button>
      )}
    </span>
  );
}

// ── Popover plumbing (shared by Select + Menu) ──────────────────────────────
// Portal to <body> with position:fixed so panels with overflow:hidden (rounded
// corners) never clip the menu; flips above the trigger when out of room.
interface PopoverPos { top?: number; bottom?: number; left?: number; right?: number; minWidth: number; maxHeight: number }

function computePopoverPos(trigger: HTMLElement, align: "start" | "end", estHeight: number): PopoverPos {
  const r = trigger.getBoundingClientRect();
  const GAP = 5, MARGIN = 8, MAX_H = 288;
  const spaceBelow = window.innerHeight - r.bottom - MARGIN;
  const spaceAbove = r.top - MARGIN;
  const pos: PopoverPos = { minWidth: r.width, maxHeight: MAX_H };
  if (spaceBelow < Math.min(estHeight, MAX_H) && spaceAbove > spaceBelow) {
    pos.bottom = window.innerHeight - r.top + GAP;
    pos.maxHeight = Math.min(MAX_H, spaceAbove);
  } else {
    pos.top = r.bottom + GAP;
    pos.maxHeight = Math.min(MAX_H, Math.max(spaceBelow, 120));
  }
  if (align === "end") pos.right = Math.max(MARGIN, window.innerWidth - r.right);
  else pos.left = Math.max(MARGIN, r.left);
  return pos;
}

/** Close on outside pointerdown, ancestor scroll, or viewport resize. */
function useDismissable(
  open: boolean, close: () => void,
  triggerRef: React.RefObject<HTMLElement | null>, popRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return; // scrolling inside the menu is fine
      close();
    };
    const onResize = () => close();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close, triggerRef, popRef]);
}

// Enter/exit is framer-motion (popoverMotion in motion.ts) — the panel renders as
// a motion.div inside AnimatePresence so CLOSING animates too (the old CSS
// keyframe could only animate open).
const pop = stylex.create({
  panel: {
    position: "fixed", zIndex: 60, backgroundColor: tokens.surface,
    borderWidth: 1, borderStyle: "solid", borderColor: tokens.line,
    borderRadius: tokens.radiusInput, boxShadow: tokens.shadowLg,
    padding: 4, overflowY: "auto", outline: "none",
  },
  item: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
    width: "100%", textAlign: "left", paddingBlock: 7, paddingInline: 10,
    fontSize: tokens.textSm, fontFamily: tokens.fontSans, lineHeight: 1.4, color: tokens.text,
    backgroundColor: "transparent", borderWidth: 0, borderRadius: 6, cursor: "pointer",
    whiteSpace: "nowrap", outline: "none",
    transitionProperty: "background-color", transitionDuration: "80ms",
  },
  itemActive: { backgroundColor: tokens.surface2 },
  itemSelected: { fontWeight: 600 },
  itemDisabled: { opacity: 0.45, cursor: "default" },
  itemDanger: { color: tokens.dangerText },
  itemCheck: { color: tokens.text, display: "flex" },
});

// ── Select — custom accessible listbox (trigger button + popover list) ──────
const sel = stylex.create({
  trigger: {
    display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 8,
    height: 36, paddingInline: 12, fontSize: tokens.textSm, fontFamily: tokens.fontSans, fontWeight: 500,
    color: tokens.text, backgroundColor: tokens.surface, borderRadius: tokens.radius,
    borderWidth: 1, borderStyle: "solid", borderColor: { default: tokens.line, ":hover": tokens.dim },
    cursor: "pointer", whiteSpace: "nowrap", userSelect: "none", outline: "none", minWidth: 0,
    transitionProperty: "border-color, box-shadow", transitionDuration: "140ms", transitionTimingFunction: tokens.ease,
    boxShadow: { default: null, ":focus-visible": tokens.focusRing },
  },
  triggerSm: { height: 30, paddingInline: 10, fontSize: tokens.textXs },
  triggerOpen: { borderColor: tokens.text },
  triggerDisabled: { opacity: 0.4, cursor: "not-allowed" },
  value: { overflow: "hidden", textOverflow: "ellipsis" },
  placeholder: { color: tokens.dim, fontWeight: 400 },
  chevron: { display: "flex", color: tokens.muted, transitionProperty: "transform", transitionDuration: "150ms" },
  chevronOpen: { transform: "rotate(180deg)" },
});

export interface SelectOption { value: string; label: string; disabled?: boolean }

export function Select(
  { options, value, onChange, placeholder = "Select…", ariaLabel, disabled, size = "md", id: idProp, style }:
  {
    options: SelectOption[]; value: string | null; onChange: (value: string) => void;
    placeholder?: string; ariaLabel?: string; disabled?: boolean; size?: "sm" | "md"; id?: string; style?: CSSProperties;
  },
) {
  const fieldCtx = useContext(FieldCtx);
  const autoId = useId();
  const id = idProp ?? fieldCtx?.id ?? autoId;
  const listId = `${id}-listbox`;
  const reduce = useReducedMotion();
  const popPreset = useMotionPreset(popoverMotion);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const typeahead = useRef({ query: "", at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback((focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);
  const closeOnly = useCallback(() => close(false), [close]);
  useDismissable(open, closeOnly, triggerRef, listRef);

  const openMenu = (edge?: "first" | "last") => {
    if (disabled || options.length === 0 || !triggerRef.current) return;
    setPos(computePopoverPos(triggerRef.current, "start", options.length * 33 + 10));
    setActive(edge === "first" ? 0 : edge === "last" ? options.length - 1 : Math.max(selectedIndex, 0));
    setOpen(true);
  };

  // Focus lives on the listbox; aria-activedescendant tracks the active option.
  useEffect(() => {
    if (open) requestAnimationFrame(() => listRef.current?.focus());
  }, [open]);
  useEffect(() => {
    if (open) optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const move = (delta: number) => {
    if (options.length === 0) return;
    setActive((a) => (a + delta + options.length) % options.length);
  };
  const commit = (index: number) => {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    close(true);
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(active); }
    else if (e.key === "Escape") { e.preventDefault(); close(true); }
    else if (e.key === "Tab") { close(false); }
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // simple typeahead: chars typed within 500ms accumulate; jump to first match
      const now = Date.now();
      const t = typeahead.current;
      t.query = (now - t.at < 500 ? t.query : "") + e.key.toLowerCase();
      t.at = now;
      const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(t.query));
      if (idx >= 0) setActive(idx);
    }
  };

  return (
    <>
      <motion.button
        ref={triggerRef} id={id} type="button" disabled={disabled} style={style}
        whileTap={disabled || reduce ? undefined : buttonTap} transition={pressTransition}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
        aria-label={ariaLabel} aria-describedby={fieldCtx?.descId} aria-invalid={fieldCtx?.invalid || undefined}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!open) openMenu("first"); }
          else if (e.key === "ArrowUp") { e.preventDefault(); if (!open) openMenu("last"); }
        }}
        {...stylex.props(sel.trigger, size === "sm" && sel.triggerSm, open && sel.triggerOpen, disabled ? sel.triggerDisabled : null)}
      >
        <span {...stylex.props(sel.value, !selected && sel.placeholder)}>{selected?.label ?? placeholder}</span>
        <span {...stylex.props(sel.chevron, open && sel.chevronOpen)}><ChevronDownIcon /></span>
      </motion.button>
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={listRef} id={listId} role="listbox" tabIndex={-1}
              initial={popPreset.initial} animate={popPreset.animate} exit={popPreset.exit}
              aria-label={ariaLabel} aria-activedescendant={`${id}-opt-${active}`}
              onKeyDown={onListKeyDown}
              {...stylex.props(pop.panel)}
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, minWidth: pos.minWidth, maxHeight: pos.maxHeight }}
            >
              {options.map((opt, i) => (
                <div
                  key={opt.value} id={`${id}-opt-${i}`} role="option"
                  ref={(node) => { optionRefs.current[i] = node; }}
                  aria-selected={opt.value === value} aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(i)}
                  {...stylex.props(pop.item, i === active && pop.itemActive, opt.value === value && pop.itemSelected, opt.disabled ? pop.itemDisabled : null)}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <span {...stylex.props(pop.itemCheck)}><CheckIcon /></span>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

// ── Menu — action dropdown (trigger button + role="menu" popover) ───────────
export interface MenuItem { label: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean }

export function Menu(
  { items, label, ariaLabel, align = "end", size = "md", variant = "secondary" }:
  {
    items: MenuItem[]; label?: ReactNode; ariaLabel: string;
    align?: "start" | "end"; size?: "sm" | "md"; variant?: Variant;
  },
) {
  const id = useId();
  const menuId = `${id}-menu`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduce = useReducedMotion();
  const popPreset = useMotionPreset(popoverMotion);

  const close = useCallback((focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);
  const closeOnly = useCallback(() => close(false), [close]);
  useDismissable(open, closeOnly, triggerRef, menuRef);

  const openMenu = (edge: "first" | "last" = "first") => {
    if (items.length === 0 || !triggerRef.current) return;
    setPos(computePopoverPos(triggerRef.current, align, items.length * 33 + 10));
    setActive(edge === "first" ? 0 : items.length - 1);
    setOpen(true);
  };

  // Roving focus: the active menuitem holds real focus.
  useEffect(() => {
    if (open) requestAnimationFrame(() => itemRefs.current[active]?.focus());
  }, [open, active]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(items.length - 1); }
    else if (e.key === "Escape") { e.preventDefault(); close(true); }
    else if (e.key === "Tab") { close(true); }
  };

  const isIconOnly = label == null;
  return (
    <>
      <motion.button
        ref={triggerRef} type="button" aria-label={ariaLabel}
        whileTap={reduce ? undefined : buttonTap} transition={pressTransition}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!open) openMenu("first"); }
          else if (e.key === "ArrowUp") { e.preventDefault(); if (!open) openMenu("last"); }
        }}
        {...stylex.props(btn.base, btn[size], btn[variant], isIconOnly && (size === "sm" ? btn.iconOnlySm : btn.iconOnly))}
      >
        {label ?? <DotsIcon />}
      </motion.button>
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={menuRef} id={menuId} role="menu" aria-label={ariaLabel} onKeyDown={onMenuKeyDown}
              initial={popPreset.initial} animate={popPreset.animate} exit={popPreset.exit}
              {...stylex.props(pop.panel)}
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, minWidth: Math.max(pos.minWidth, 160), maxHeight: pos.maxHeight }}
            >
              {items.map((item, i) => (
                <button
                  key={i} type="button" role="menuitem" disabled={item.disabled}
                  ref={(node) => { itemRefs.current[i] = node; }}
                  tabIndex={i === active ? 0 : -1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => { if (item.disabled) return; close(true); item.onSelect(); }}
                  {...stylex.props(pop.item, i === active && pop.itemActive, item.danger && pop.itemDanger, item.disabled ? pop.itemDisabled : null)}
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

// ── Checkbox — custom, keyboard + aria via a real (visually hidden) input ───
const cb = stylex.create({
  // verticalAlign:middle — an inline-flex box otherwise rides the text baseline, and the box's baseline
  // shifts between empty (unchecked) and icon-filled (checked), resizing the host line box by ~3px. In a
  // table header/cell that shared row-height then jittered the whole row on toggle. Anchoring kills it.
  wrap: { display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", position: "relative", verticalAlign: "middle" },
  wrapDisabled: { cursor: "not-allowed", opacity: 0.5 },
  input: {
    position: "absolute", width: 1, height: 1, margin: 0, padding: 0, opacity: 0,
    pointerEvents: "none", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap",
  },
  box: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    width: 18, height: 18, borderRadius: tokens.radiusSm,
    borderWidth: 1.5, borderStyle: "solid", borderColor: tokens.line,
    backgroundColor: tokens.surface, color: tokens.surface2,
    transitionProperty: "background-color, border-color, box-shadow", transitionDuration: "120ms",
    transitionTimingFunction: tokens.ease,
  },
  boxOn: { backgroundColor: tokens.text, borderColor: tokens.text },
  boxFocus: { boxShadow: tokens.focusRing, borderColor: tokens.text },
  label: { fontSize: tokens.textSm, color: tokens.text, lineHeight: 1.3 },
});

export function Checkbox(
  { checked, onChange, indeterminate = false, disabled, label, ariaLabel, id }:
  {
    checked: boolean; onChange: (checked: boolean) => void; indeterminate?: boolean;
    disabled?: boolean; label?: ReactNode; ariaLabel?: string; id?: string;
  },
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  const showMark = checked || indeterminate;
  return (
    <label {...stylex.props(cb.wrap, disabled ? cb.wrapDisabled : null)}>
      <input
        ref={inputRef} id={id} type="checkbox" checked={checked} disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
        onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
        onBlur={() => setFocused(false)}
        {...stylex.props(cb.input)}
      />
      <span aria-hidden="true" {...stylex.props(cb.box, showMark && cb.boxOn, focused && cb.boxFocus)}>
        {checked ? <CheckIcon /> : indeterminate ? <MinusIcon /> : null}
      </span>
      {label != null && <span {...stylex.props(cb.label)}>{label}</span>}
    </label>
  );
}

// ── Table primitives ────────────────────────────────────────────────────────
// <Table minWidth={640}><THead><TH/>…</THead><TBody><TR><TD/>…</TR></TBody></Table>
// Bakes in: horizontal scroll on overflow (wrap in surfaces.panel so the rounded
// corners clip it), compact type, header style, row hover, last-row no-border,
// right-aligned numerics (tabular-nums), sort affordance, and an empty state.
// delivery-tracker `dispatch-flash` — one-shot row highlight: warningBg → transparent, 1.5s easeOut.
const rowFlashKf = stylex.keyframes({
  from: { backgroundColor: tokens.warningBg },
  to: { backgroundColor: "transparent" },
});

const tbl = stylex.create({
  wrap: { overflowX: "auto", width: "100%" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", paddingBlock: 10, paddingInline: 14, fontSize: tokens.textXs, fontWeight: 600,
    color: tokens.muted, borderBottom: `1px solid ${tokens.line}`, whiteSpace: "nowrap",
  },
  right: { textAlign: "right" },
  sortBtn: {
    display: "inline-flex", alignItems: "center", gap: 4, padding: 0, borderWidth: 0,
    backgroundColor: "transparent", fontFamily: tokens.fontSans, fontSize: tokens.textXs, fontWeight: 600,
    color: { default: tokens.muted, ":hover": tokens.text }, cursor: "pointer",
    outline: "none", borderRadius: tokens.radiusSm,
    boxShadow: { default: null, ":focus-visible": tokens.focusRing },
    transitionProperty: "color", transitionDuration: "120ms",
  },
  sortBtnActive: { color: tokens.text },
  tr: {
    borderBottomWidth: { default: 1, ":last-child": 0 }, borderBottomStyle: "solid", borderBottomColor: tokens.line,
    transitionProperty: "background-color", transitionDuration: "100ms",
    backgroundColor: { default: "transparent", ":hover": tokens.surface2 },
  },
  // clickable row (tap-to-select): pointer cursor + a keyboard focus ring so the whole row is an affordance.
  trClickable: {
    cursor: "pointer",
    outline: "none",
    boxShadow: { default: null, ":focus-visible": `inset 0 0 0 2px ${tokens.accent}` },
  },
  // selected row: a persistent tint that outranks the hover shade (hover just deepens it slightly).
  trSelected: {
    backgroundColor: { default: tokens.surface2, ":hover": tokens.surface3 },
  },
  trFlash: {
    animationName: { default: rowFlashKf, "@media (prefers-reduced-motion: reduce)": "none" },
    animationDuration: "1.5s",
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)", // easeOut
    animationIterationCount: 1,
  },
  td: { paddingBlock: 11, paddingInline: 14, fontSize: tokens.textSm, color: tokens.text },
  numeric: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
  muted: { color: tokens.muted },
  strong: { fontWeight: 600 },
  mono: { fontFamily: tokens.fontMono, fontSize: tokens.textXs, color: tokens.muted },
  checkCol: { width: 40, paddingInlineEnd: 2 },
  // Row actions. The CELL stays a real table-cell — `display: flex` on a table-row child gets
  // wrapped in an ANONYMOUS table-cell, so the td's own `width` stops sizing the column (that
  // regression floated a button over the next column once). The flex row is an inner wrapper.
  actionsCol: { width: "1%", whiteSpace: "nowrap", textAlign: "right" },
  // `text-align: right` alone does NOT space inline-flex siblings — this gap is why buttons
  // don't ship flush against each other.
  actionsRow: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  empty: { paddingBlock: 36, paddingInline: 20, textAlign: "center" },
  emptyTitle: { margin: 0, fontSize: tokens.textSm, fontWeight: 600, color: tokens.text },
  emptyHint: { margin: "4px 0 0", fontSize: tokens.textXs, color: tokens.muted },
});

export function Table({ minWidth = 640, children }: { minWidth?: number; children: ReactNode }) {
  return (
    <div {...stylex.props(tbl.wrap)}>
      <table {...stylex.props(tbl.table)} style={{ minWidth }}>{children}</table>
    </div>
  );
}

/** Renders the header row — children are `<TH>` cells. */
export function THead({ children }: { children: ReactNode }) {
  return <thead><tr>{children}</tr></thead>;
}

export type SortDir = "asc" | "desc" | null;
export function TH(
  { align = "left", check = false, sortDir, onSort, children, ...rest }:
  { align?: "left" | "right"; check?: boolean; sortDir?: SortDir; onSort?: () => void; children?: ReactNode }
  & Omit<ThHTMLAttributes<HTMLTableCellElement>, "align">,
) {
  const sortable = onSort != null;
  return (
    <th
      scope="col" {...rest}
      aria-sort={sortable ? (sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : "none") : undefined}
      {...stylex.props(tbl.th, align === "right" && tbl.right, check && tbl.checkCol)}
    >
      {sortable ? (
        <button type="button" onClick={onSort} {...stylex.props(tbl.sortBtn, sortDir != null && tbl.sortBtnActive)}>
          {children}
          <SortIcon dir={sortDir ?? null} />
        </button>
      ) : children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

/** `flash` plays the one-shot dispatch-flash highlight (runs on mount / when it flips true —
 *  change the row's `key` to replay it on demand). */
export function TR(
  { flash = false, selected = false, onClick, children }:
  { flash?: boolean; selected?: boolean; onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void; children: ReactNode },
) {
  return (
    <tr onClick={onClick} {...stylex.props(tbl.tr, onClick && tbl.trClickable, selected && tbl.trSelected, flash && tbl.trFlash)}>
      {children}
    </tr>
  );
}

export function TD(
  { numeric = false, muted = false, strong = false, mono = false, check = false, actions = false, children, ...rest }:
  { numeric?: boolean; muted?: boolean; strong?: boolean; mono?: boolean; check?: boolean; actions?: boolean; children?: ReactNode }
  & Omit<TdHTMLAttributes<HTMLTableCellElement>, "align">,
) {
  const cell = (
    <td {...rest} {...stylex.props(tbl.td, numeric && tbl.numeric, muted && tbl.muted, strong && tbl.strong, mono && tbl.mono, check && tbl.checkCol, actions && tbl.actionsCol)}>
      {actions ? <div {...stylex.props(tbl.actionsRow)}>{children}</div> : children}
    </td>
  );
  // `actions` both gaps the row's controls and makes every Button inside it compact.
  return actions ? <InRowActions.Provider value={true}>{cell}</InRowActions.Provider> : cell;
}

/** Full-width empty state row — keeps the header visible so the table shape reads. */
export function TableEmpty({ colSpan, title = "Nothing here yet", hint }: { colSpan: number; title?: ReactNode; hint?: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} {...stylex.props(tbl.td, tbl.empty)}>
        <p {...stylex.props(tbl.emptyTitle)}>{title}</p>
        {hint && <p {...stylex.props(tbl.emptyHint)}>{hint}</p>}
      </td>
    </tr>
  );
}

// ── Theme — user-toggleable dark mode, defaulting to system preference ──────
// The inline <script> in index.html resolves the same value BEFORE React mounts
// (sets html[data-theme] + background), so a dark load never flashes light.
export type Theme = "light" | "dark";
/**
 * What the USER chose, which is not the same thing as what is rendered. "system" means "no explicit
 * choice" and follows the OS live; `Theme` is the resolved result that gets stamped on the document.
 * Keeping the two apart is what lets a user go BACK to following their OS after picking a side.
 */
export type ThemePref = "system" | "light" | "dark";
const THEME_KEY = "gb-theme";

function systemPrefersDark(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveInitialPref(): ThemePref {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch { /* storage unavailable — fall through to system preference */ }
  return "system";
}

const resolveTheme = (pref: ThemePref, dark: boolean): Theme => (pref === "system" ? (dark ? "dark" : "light") : pref);

/**
 * Theme state for the app shell. Call once in the root layout; spread `darkTheme` onto the shell div
 * when `theme === "dark"` and hand `{theme, toggle}` (or `{pref, setPref}`) to NavBar.
 *
 * Persists only on an explicit choice, so an untouched app keeps following the system — and picking
 * "system" again returns it to that. `toggle` is kept for the two-state control; `setPref` is what
 * the account menu's 3-way control uses.
 */
export function useTheme(): { theme: Theme; toggle: () => void; pref: ThemePref; setPref: (next: ThemePref) => void } {
  const [pref, setPrefState] = useState<ThemePref>(resolveInitialPref);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);
  const theme = resolveTheme(pref, systemDark);

  // Live-follow the OS while — and only while — the preference is "system".
  useEffect(() => {
    if (pref !== "system" || typeof matchMedia !== "function") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    // Select/Menu popovers portal into <body> — outside the themed shell div — so
    // mirror the darkTheme class list on <body> to keep their tokens in sync.
    const classes = (stylex.props(darkTheme).className ?? "").split(" ").filter(Boolean);
    if (theme === "dark") document.body.classList.add(...classes);
    else document.body.classList.remove(...classes);
    // Theme-aware favicon — the Grain mark inverts with the theme (data set pre-paint in index.html).
    const fav = (window as unknown as { __gbFavicon?: Record<string, string> }).__gbFavicon;
    const link = document.getElementById("fdn-favicon") as HTMLLinkElement | null;
    if (fav && link) link.href = fav[theme] ?? fav.light ?? "";
  }, [theme]);

  const setPref = useCallback((next: ThemePref) => {
    try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode etc. — theme still applies */ }
    setPrefState(next);
  }, []);

  // Always lands on an explicit side, matching the two-state control's contract.
  const toggle = useCallback(() => {
    setPrefState((current) => {
      const next: ThemePref = resolveTheme(current, systemPrefersDark()) === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode etc. — theme still applies */ }
      return next;
    });
  }, []);

  return { theme, toggle, pref, setPref };
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button" onClick={onToggle}
      whileTap={reduce ? undefined : buttonTap} transition={pressTransition}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
      {...stylex.props(btn.base, btn.sm, btn.ghost, btn.iconOnlySm)}
    >
      {/* iconSwap — sun ⇄ moon via AnimatePresence mode="wait": spring 0.25 / bounce 0.15, scale 0.8→1 + fade */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={iconSwapMotion.initial} animate={iconSwapMotion.animate} exit={iconSwapMotion.exit}
          transition={reduce ? instant : iconSwapTransition}
          style={{ display: "flex" }}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// ── AccountMenu — avatar trigger, identity, app links, theme, sign-out ──────
// The one place per app for "who am I / my preferences / get me out". NavBar renders it in the
// actions slot. Theme lives HERE rather than as its own bar button, so there is a single place to
// change it, and the bar keeps carrying destinations only.
//
// Accessibility is deliberately fuller than the delivery-tracker original this is modelled on: that
// menu has no ARIA, no Escape and no focus management. This one is a real role="menu" with roving
// focus, reusing the same popover machinery as Menu/Select (computePopoverPos + useDismissable).
const acct = stylex.create({
  avatar: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    width: 28, height: 28, padding: 0, borderWidth: 0, borderRadius: tokens.radiusPill,
    backgroundColor: { default: tokens.surface3, ":hover": tokens.line },
    color: { default: tokens.muted, ":hover": tokens.text },
    fontFamily: tokens.fontSans, fontSize: 10, fontWeight: 600, letterSpacing: "0.02em",
    cursor: "pointer", userSelect: "none", outline: "none",
    transitionProperty: "background-color, color, box-shadow", transitionDuration: "140ms",
    transitionTimingFunction: tokens.ease,
    boxShadow: { default: null, ":focus-visible": tokens.focusRing },
  },
  // Open reads as a ring, so it is obvious which control owns the open panel.
  avatarOpen: { color: tokens.text, boxShadow: `0 0 0 2px ${tokens.surface}, 0 0 0 3px ${tokens.text}` },
  identity: {
    paddingBlock: 7, paddingInline: 10, fontFamily: tokens.fontSans, fontSize: tokens.textXs,
    color: tokens.muted, lineHeight: 1.4, maxWidth: 260,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  identityEmail: {
    display: "block", color: tokens.text, fontWeight: 600, fontSize: tokens.textSm,
    overflow: "hidden", textOverflow: "ellipsis",
  },
  sep: { height: 1, marginBlock: 4, marginInline: -4, backgroundColor: tokens.line },
  itemIcon: { display: "flex", color: tokens.muted },
  // pop.item is space-between (it was built for label + trailing checkmark). These rows are
  // icon + label reading left-to-right, so anchor them or the label drifts to the far edge.
  item: { justifyContent: "flex-start" },
  // The theme row is not selectable itself — it hosts the segmented control.
  row: {
    display: "flex", alignItems: "center", gap: 10, paddingBlock: 6, paddingInline: 10,
    fontFamily: tokens.fontSans, fontSize: tokens.textSm, color: tokens.text, whiteSpace: "nowrap",
  },
  seg: {
    marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0,
    padding: 2, borderWidth: 1, borderStyle: "solid", borderColor: tokens.line,
    borderRadius: tokens.radius, backgroundColor: tokens.bg,
  },
  segBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 24, height: 22, padding: 0, borderWidth: 0, borderRadius: tokens.radiusSm,
    backgroundColor: "transparent", color: { default: tokens.dim, ":hover": tokens.text },
    cursor: "pointer", outline: "none",
    transitionProperty: "background-color, color", transitionDuration: "120ms",
    boxShadow: { default: null, ":focus-visible": tokens.focusRing },
  },
  segBtnOn: { backgroundColor: tokens.surface2, color: tokens.text, boxShadow: tokens.shadowSm },
});

export interface AccountMenuItem {
  label: ReactNode;
  icon?: ReactNode;
  /** Either navigate (href) or run a handler (onSelect). */
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
}

/** "ernest.codes@x" → "EC"; "ernest@x" → "ER". Neutral glyph when there is no identity yet. */
export function initialsFromEmail(email?: string | null): string {
  const local = String(email ?? "").split("@")[0] ?? "";
  const parts = local.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length >= 2) return ((parts[0]![0] ?? "") + (parts[1]![0] ?? "")).toUpperCase();
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return "··";
}

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePref; label: string; Icon: (p: IconProps) => ReactNode }> = [
  { value: "system", label: "Match system", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

export function AccountMenu(
  { email, items = [], pref, onPrefChange, onSignOut, signOutLabel = "Log out", ariaLabel = "Account menu" }:
  {
    /** Signed-in identity. Undefined renders a neutral avatar and no identity header. */
    email?: string | null;
    /** App links. Keep these few: this menu is identity + preferences, not a second nav. */
    items?: AccountMenuItem[];
    /** Theme preference, from useTheme(). Omit both to leave the theme row out entirely. */
    pref?: ThemePref;
    onPrefChange?: (next: ThemePref) => void;
    /** Destructive action. Rendered last, in danger colours. Omit to leave it out. */
    onSignOut?: () => void;
    signOutLabel?: ReactNode;
    ariaLabel?: string;
  },
) {
  const id = useId();
  const menuId = `${id}-account`;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const popPreset = useMotionPreset(popoverMotion);

  const close = useCallback((focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);
  const closeOnly = useCallback(() => close(false), [close]);
  useDismissable(open, closeOnly, triggerRef, menuRef);

  const showTheme = pref !== undefined && onPrefChange !== undefined;
  const openMenu = () => {
    if (!triggerRef.current) return;
    setPos(computePopoverPos(triggerRef.current, "end", (items.length + (showTheme ? 1 : 0) + 2) * 33 + 24));
    setOpen(true);
  };

  // Roving focus across whatever the menu actually contains, in DOM order.
  const focusables = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"],[role="menuitemradio"]') ?? []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => focusables()[0]?.focus());
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close(true); return; }
    if (e.key === "Tab") { close(true); return; }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    const nodes = focusables();
    if (nodes.length === 0) return;
    e.preventDefault();
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home" ? 0
      : e.key === "End" ? nodes.length - 1
      : e.key === "ArrowDown" ? (i + 1 + nodes.length) % nodes.length
      : (i - 1 + nodes.length) % nodes.length;
    nodes[next]?.focus();
  };

  const renderItem = (item: AccountMenuItem, key: string) => {
    const content = (<>{item.icon && <span {...stylex.props(acct.itemIcon)}>{item.icon}</span>}{item.label}</>);
    const styles = stylex.props(pop.item, acct.item, item.danger && pop.itemDanger);
    if (item.href) {
      return (
        <a key={key} role="menuitem" href={item.href} tabIndex={-1}
          onClick={() => close(false)} {...styles}>{content}</a>
      );
    }
    return (
      <button key={key} type="button" role="menuitem" tabIndex={-1}
        onClick={() => { close(true); item.onSelect?.(); }} {...styles}>{content}</button>
    );
  };

  const ActiveThemeIcon = THEME_OPTIONS.find((o) => o.value === pref)?.Icon ?? MonitorIcon;

  return (
    <>
      <motion.button
        ref={triggerRef} type="button"
        aria-label={email ? `${ariaLabel} — ${email}` : ariaLabel} title={email ?? ariaLabel}
        whileTap={reduce ? undefined : buttonTap} transition={pressTransition}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!open) openMenu(); }
        }}
        {...stylex.props(acct.avatar, open && acct.avatarOpen)}
      >
        {initialsFromEmail(email)}
      </motion.button>
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={menuRef} id={menuId} role="menu" aria-label={ariaLabel} onKeyDown={onMenuKeyDown}
              initial={popPreset.initial} animate={popPreset.animate} exit={popPreset.exit}
              {...stylex.props(pop.panel)}
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, minWidth: Math.max(pos.minWidth, 224), maxHeight: pos.maxHeight }}
            >
              {email && (
                <>
                  <div {...stylex.props(acct.identity)}>
                    Signed in as<span {...stylex.props(acct.identityEmail)}>{email}</span>
                  </div>
                  <div {...stylex.props(acct.sep)} role="none" />
                </>
              )}
              {items.map((item, i) => renderItem(item, `item-${i}`))}
              {showTheme && (
                <div {...stylex.props(acct.row)}>
                  <span {...stylex.props(acct.itemIcon)}><ActiveThemeIcon /></span>
                  Theme
                  <span {...stylex.props(acct.seg)} role="group" aria-label="Theme">
                    {THEME_OPTIONS.map(({ value, label, Icon }) => (
                      <button
                        key={value} type="button" role="menuitemradio" tabIndex={-1}
                        aria-checked={pref === value} title={label} aria-label={`Theme: ${label}`}
                        onClick={() => onPrefChange?.(value)}
                        {...stylex.props(acct.segBtn, pref === value && acct.segBtnOn)}
                      >
                        <Icon size={14} />
                      </button>
                    ))}
                  </span>
                </div>
              )}
              {onSignOut && (
                <>
                  <div {...stylex.props(acct.sep)} role="none" />
                  {renderItem({ label: signOutLabel, icon: <LogOutIcon />, onSelect: onSignOut, danger: true }, "signout")}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

// ── NavBar — the one shared 56px product nav ────────────────────────────────
const nav = stylex.create({
  header: {
    position: "sticky", top: 0, zIndex: 40,
    display: "flex", alignItems: "center", gap: 8,
    height: 56, paddingInline: 20,
    backgroundColor: tokens.surface, borderBottom: `1px solid ${tokens.line2}`,
  },
  brand: { display: "inline-flex", alignItems: "center", marginRight: 14, textDecoration: "none", color: tokens.text },
  links: { display: "flex", gap: 2 },
  link: {
    display: "inline-flex", alignItems: "center", height: 30, paddingInline: 12, borderRadius: tokens.radius,
    fontSize: "13px", fontWeight: 500, textDecoration: "none",
    color: { default: tokens.muted, ":hover": tokens.text },
    backgroundColor: { default: "transparent", ":hover": tokens.surface2 },
    transitionProperty: "color, background-color", transitionDuration: "120ms", transitionTimingFunction: tokens.ease,
    outline: "none",
    boxShadow: { default: null, ":focus-visible": tokens.focusRing },
  },
  linkActive: { color: tokens.text, backgroundColor: tokens.surface2, fontWeight: 600 },
  actions: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 },
});
const navActiveClass = stylex.props(nav.link, nav.linkActive).className;

// Kit-level nav links are plain strings; the app's registered router narrows
// Link's `to` type, so we go through a loosely-typed alias (runtime-identical).
const RouterLink = Link as unknown as React.ComponentType<Record<string, unknown>>;

export interface NavItem { to: string; label: ReactNode; exact?: boolean }

/**
 * The one shared product header. Define it ONCE in the root layout and let every route render
 * inside it — a page that renders without it is a dead end, with no way back and no identity.
 *
 * `account` is the preferred way to carry identity/preferences/sign-out: pass it and the bar renders
 * an AccountMenu (which owns the theme control) instead of a bare theme toggle. The older
 * `theme`/`onToggleTheme` pair still renders the two-state toggle, for apps that want nothing else.
 */
export function NavBar(
  { links, theme, onToggleTheme, account, children }:
  {
    links: NavItem[];
    theme?: Theme;
    onToggleTheme?: () => void;
    account?: React.ComponentProps<typeof AccountMenu>;
    children?: ReactNode;
  },
) {
  // Theme belongs in ONE place. With an account menu present that place is the menu, so the
  // standalone toggle is suppressed rather than shown twice.
  const showToggle = !account && theme && onToggleTheme;
  return (
    <header {...stylex.props(nav.header)}>
      <RouterLink to="/" aria-label="Home" {...stylex.props(nav.brand)}>
        <Logo withText />
      </RouterLink>
      <nav aria-label="Main navigation" {...stylex.props(nav.links)}>
        {links.map((link) => (
          <RouterLink
            key={String(link.to)} to={link.to}
            activeOptions={{ exact: link.exact ?? false }}
            activeProps={{ className: navActiveClass, "aria-current": "page" }}
            {...stylex.props(nav.link)}
          >
            {link.label}
          </RouterLink>
        ))}
      </nav>
      {(children || showToggle || account) && (
        <div {...stylex.props(nav.actions)}>
          {children}
          {showToggle && <ThemeToggle theme={theme!} onToggle={onToggleTheme!} />}
          {account && <AccountMenu {...account} />}
        </div>
      )}
    </header>
  );
}

// ── Surfaces — reusable panel styles for composing product screens ──────────
export const surfaces = stylex.create({
  // overflow:hidden clips inner content (e.g. a scrolling table) to the rounded corners
  panel: { backgroundColor: tokens.surface, borderWidth: 1, borderStyle: "solid", borderColor: tokens.line, borderRadius: tokens.radius, overflow: "hidden" },
  // the row above a table: search + filters left, meta right (pair with panel)
  toolbar: {
    display: "flex", alignItems: "center", gap: 8, padding: 12, flexWrap: "wrap",
    borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: tokens.line,
  },
});

// ── Modal / Dialog ───────────────────────────────────────────────────────────
// Portaled to <body> (dark tokens arrive via the darkTheme classes useTheme
// mirrors onto <body>, same as the popovers). Backdrop fades; panel enters with
// popoverEnter plus a subtle 0.98→1 scale; both reverse on exit via AnimatePresence.
const modalSx = stylex.create({
  overlay: {
    position: "fixed", inset: 0, zIndex: 70, backgroundColor: "rgba(0, 0, 0, .3)",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    paddingInline: 16, paddingTop: "12vh", paddingBottom: 24, overflowY: "auto",
  },
  panel: {
    display: "flex", flexDirection: "column", width: "100%", maxHeight: "70vh",
    backgroundColor: tokens.surface, color: tokens.text,
    borderWidth: 1, borderStyle: "solid", borderColor: tokens.line,
    borderRadius: tokens.radiusLg, boxShadow: tokens.shadowLg, outline: "none",
  },
  sm: { maxWidth: 400 },
  md: { maxWidth: 520 },
  lg: { maxWidth: 680 },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0,
    paddingBlock: 14, paddingInline: 18,
    borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: tokens.line,
  },
  title: { margin: 0, fontSize: tokens.textBase, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.3 },
  body: { padding: 18, overflowY: "auto", fontSize: tokens.textSm, lineHeight: 1.55 },
  footer: {
    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexShrink: 0,
    paddingBlock: 12, paddingInline: 18,
    borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: tokens.line,
  },
});

export function Modal(
  { open, onClose, title, children, footer, size = "md" }:
  { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" },
) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const backdropPreset = useMotionPreset(backdropMotion);
  const panelPreset = useMotionPreset(modalPanelMotion);

  // Focus the panel on open; restore focus + unhook Esc on close/unmount.
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => panelRef.current?.focus());
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocused.current?.focus();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={backdropPreset.initial} animate={backdropPreset.animate} exit={backdropPreset.exit}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
          {...stylex.props(modalSx.overlay)}
        >
          <motion.div
            ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
            initial={panelPreset.initial} animate={panelPreset.animate} exit={panelPreset.exit}
            {...stylex.props(modalSx.panel, modalSx[size])}
          >
            <div {...stylex.props(modalSx.header)}>
              <h2 id={titleId} {...stylex.props(modalSx.title)}>{title}</h2>
              <button type="button" aria-label="Close dialog" onClick={onClose}
                {...stylex.props(btn.base, btn.sm, btn.ghost, btn.iconOnlySm)}>
                <XIcon />
              </button>
            </div>
            <div {...stylex.props(modalSx.body)}>{children}</div>
            {footer != null && <div {...stylex.props(modalSx.footer)}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Toast — sonner-like bottom-right stack ───────────────────────────────────
// useToast() → toast.success/error/info/loading(msg, {id?}) (+ dismiss(id)).
// Passing an existing id replaces that toast in place (loading → success flows).
// Motion: {opacity:0, y:12} ⇄ {opacity:1, y:0}, 0.18s (delivery-tracker's toast).
export type ToastKind = "success" | "error" | "info" | "loading";
interface ToastItem { id: number; kind: ToastKind; message: ReactNode }
export interface ToastApi {
  success: (message: ReactNode, opts?: { id?: number }) => number;
  error: (message: ReactNode, opts?: { id?: number }) => number;
  info: (message: ReactNode, opts?: { id?: number }) => number;
  loading: (message: ReactNode, opts?: { id?: number }) => number;
  dismiss: (id: number) => void;
}
const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// success/info auto-dismiss at 3s, error at 6s; loading persists until dismissed/replaced.
const TOAST_TTL: Record<ToastKind, number | null> = { success: 3000, info: 3000, error: 6000, loading: null };
let toastSeq = 0;

const toastSx = stylex.create({
  viewport: {
    position: "fixed", bottom: 16, right: 16, zIndex: 90,
    display: "flex", flexDirection: "column", alignItems: "stretch", gap: 8,
    width: 340, maxWidth: "calc(100vw - 32px)", pointerEvents: "none",
  },
  toast: {
    pointerEvents: "auto", display: "flex", alignItems: "flex-start", gap: 10,
    paddingBlock: 10, paddingInline: 12,
    backgroundColor: tokens.surface, color: tokens.text,
    borderWidth: 1, borderStyle: "solid", borderColor: tokens.line,
    borderLeftWidth: 3, borderRadius: tokens.radiusInput, boxShadow: tokens.shadowLg,
    fontSize: tokens.textSm, lineHeight: 1.45,
  },
  // richColors feel: status-tinted card + strong left accent (delivery-tracker status tokens)
  success: { backgroundColor: tokens.successBg, borderColor: tokens.successBorder, borderLeftColor: tokens.successText },
  error: { backgroundColor: tokens.dangerBg, borderColor: tokens.dangerBorder, borderLeftColor: tokens.dangerText },
  info: { backgroundColor: tokens.warningBg, borderColor: tokens.warningBorder, borderLeftColor: tokens.warningTextStrong },
  loading: { borderLeftColor: tokens.dim },
  icon: { display: "flex", alignItems: "center", flexShrink: 0, marginTop: 3 },
  iconSuccess: { color: tokens.successText },
  iconError: { color: tokens.dangerText },
  iconInfo: { color: tokens.warningTextStrong },
  iconLoading: { color: tokens.muted },
  msg: { flex: 1, minWidth: 0, fontWeight: 500 },
  close: {
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    width: 22, height: 22, padding: 0, marginTop: 1,
    borderWidth: 0, borderRadius: tokens.radiusSm, cursor: "pointer",
    backgroundColor: { default: "transparent", ":hover": "rgba(0, 0, 0, .06)" },
    color: { default: tokens.muted, ":hover": tokens.text },
    outline: "none", boxShadow: { default: null, ":focus-visible": tokens.focusRing },
  },
});
const TOAST_ICON_STYLE: Record<ToastKind, keyof typeof toastSx> = {
  success: "iconSuccess", error: "iconError", info: "iconInfo", loading: "iconLoading",
};

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "loading") return <Spinner />;
  if (kind === "success") return <CheckIcon size={13} />;
  if (kind === "error") return <XIcon size={13} />;
  return ( // info — a small "i" roundel
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const reduce = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: ReactNode, opts?: { id?: number }) => {
    const id = opts?.id ?? ++toastSeq;
    setToasts((list) => [...list.filter((t) => t.id !== id), { id, kind, message }]);
    const prev = timers.current.get(id);
    if (prev) clearTimeout(prev);
    const ttl = TOAST_TTL[kind];
    if (ttl != null) timers.current.set(id, setTimeout(() => dismiss(id), ttl));
    else timers.current.delete(id);
    return id;
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    success: (m, o) => push("success", m, o),
    error: (m, o) => push("error", m, o),
    info: (m, o) => push("info", m, o),
    loading: (m, o) => push("loading", m, o),
    dismiss,
  }), [push, dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {createPortal(
        <div aria-live="polite" {...stylex.props(toastSx.viewport)}>
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <motion.div
                key={t.id} role="status" layout={!reduce}
                initial={toastMotion.initial}
                animate={{ ...toastMotion.animate, transition: reduce ? instant : toastTransition }}
                exit={{ ...toastMotion.exit, transition: reduce ? instant : toastTransition }}
                {...stylex.props(toastSx.toast, toastSx[t.kind])}
              >
                <span aria-hidden="true" {...stylex.props(toastSx.icon, toastSx[TOAST_ICON_STYLE[t.kind]])}>
                  <ToastIcon kind={t.kind} />
                </span>
                <span {...stylex.props(toastSx.msg)}>{t.message}</span>
                <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}
                  {...stylex.props(toastSx.close)}>
                  <XIcon size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

// ── Tabs — segmented triggers with a layoutId sliding active pill ────────────
// Trigger visuals match delivery-tracker (px-3 py-1.5, 13px; active = filled
// pill + font-semibold); the framer-motion layoutId indicator (the pill sliding
// between tabs) is the one addition delivery-tracker lacks. Panels are optional:
// render <TabPanel value="…"> as children of <Tabs> and they wire aria + ids.
export interface TabItem { value: string; label: ReactNode }
interface TabsCtxValue { id: string; value: string }
const TabsCtx = createContext<TabsCtxValue | null>(null);

const tabsSx = stylex.create({
  list: { display: "inline-flex", alignItems: "center", gap: 2 },
  tab: {
    position: "relative", display: "inline-flex", alignItems: "center", height: 30, paddingInline: 12,
    fontSize: "13px", fontWeight: 500, fontFamily: tokens.fontSans, lineHeight: 1, whiteSpace: "nowrap",
    color: { default: tokens.muted, ":hover": tokens.text },
    backgroundColor: "transparent", borderWidth: 0, borderRadius: tokens.radiusPill,
    cursor: "pointer", userSelect: "none", outline: "none",
    boxShadow: { default: null, ":focus-visible": tokens.focusRing },
    transitionProperty: "color", transitionDuration: "120ms", transitionTimingFunction: tokens.ease,
  },
  tabActive: { color: tokens.text, fontWeight: 600 },
  pill: { position: "absolute", inset: 0, backgroundColor: tokens.surface2, borderRadius: tokens.radiusPill },
  label: { position: "relative" },
  panel: { outline: "none" },
});

export function Tabs(
  { tabs, value, onChange, ariaLabel, children }:
  { tabs: TabItem[]; value: string; onChange: (value: string) => void; ariaLabel: string; children?: ReactNode },
) {
  const id = useId();
  const reduce = useReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(tabs.findIndex((t) => t.value === value), 0);
  const hasPanels = children != null;

  // Roving tabindex + automatic activation on arrows/Home/End.
  const onKeyDown = (e: React.KeyboardEvent) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (activeIndex + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (activeIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next == null) return;
    e.preventDefault();
    onChange(tabs[next].value);
    tabRefs.current[next]?.focus();
  };

  const ctx = useMemo<TabsCtxValue>(() => ({ id, value }), [id, value]);
  return (
    <>
      <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} {...stylex.props(tabsSx.list)}>
        {tabs.map((tab, i) => {
          const isActive = tab.value === value;
          return (
            <button
              key={tab.value} type="button" role="tab" id={`${id}-tab-${tab.value}`}
              aria-selected={isActive} aria-controls={hasPanels ? `${id}-panel-${tab.value}` : undefined}
              tabIndex={isActive ? 0 : -1}
              ref={(node) => { tabRefs.current[i] = node; }}
              onClick={() => onChange(tab.value)}
              {...stylex.props(tabsSx.tab, isActive && tabsSx.tabActive)}
            >
              {isActive && (
                <motion.span
                  layoutId={`${id}-pill`} aria-hidden="true"
                  transition={reduce ? instant : tabIndicatorTransition}
                  {...stylex.props(tabsSx.pill)} style={{ borderRadius: 999 }}
                />
              )}
              <span {...stylex.props(tabsSx.label)}>{tab.label}</span>
            </button>
          );
        })}
      </div>
      {hasPanels && <TabsCtx.Provider value={ctx}>{children}</TabsCtx.Provider>}
    </>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("TabPanel must be rendered inside <Tabs>");
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel" id={`${ctx.id}-panel-${value}`} aria-labelledby={`${ctx.id}-tab-${value}`}
      tabIndex={0} {...stylex.props(tabsSx.panel)}
    >
      {children}
    </div>
  );
}

// ── Skeleton — content-shaped loading placeholders ──────────────────────────
// delivery-tracker convention: compose skeleton blocks to match the loaded
// layout; never a centered spinner-in-the-void. Pulse = Tailwind's animate-pulse
// (opacity 1→0.5→1, 2s, cubic-bezier(0.4,0,0.6,1)) on surface2 — the same
// "skeleton pulse" colour delivery-tracker uses (--filled-1).
const skeletonPulseKf = stylex.keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.5 },
});
const skelSx = stylex.create({
  block: {
    backgroundColor: tokens.surface2, borderRadius: tokens.radiusSm,
    animationName: { default: skeletonPulseKf, "@media (prefers-reduced-motion: reduce)": "none" },
    animationDuration: "2s", animationTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)", animationIterationCount: "infinite",
  },
  stack: { display: "flex", flexDirection: "column", gap: 8 },
  srOnly: {
    position: "absolute", width: 1, height: 1, margin: -1, padding: 0,
    overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", borderWidth: 0,
  },
});

/** A single pulsing placeholder block. Size via `width`/`height` (px or CSS string). */
export function Skeleton(
  { width = "100%", height = 12, label = "Loading", style }:
  { width?: number | string; height?: number | string; label?: string; style?: CSSProperties },
) {
  return (
    <div role="status" aria-busy="true" {...stylex.props(skelSx.block)} style={{ width, height, ...style }}>
      <span {...stylex.props(skelSx.srOnly)}>{label}</span>
    </div>
  );
}

/** Placeholder paragraph — `lines` bars with varied widths; the last is shortened. */
export function SkeletonText({ lines = 3, label = "Loading" }: { lines?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" {...stylex.props(skelSx.stack)}>
      <span {...stylex.props(skelSx.srOnly)}>{label}</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} aria-hidden="true" {...stylex.props(skelSx.block)}
          style={{ height: 12, width: i === lines - 1 ? "60%" : `${82 + ((i * 13) % 16)}%` }} />
      ))}
    </div>
  );
}
