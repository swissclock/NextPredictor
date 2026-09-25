"use client";

import { useState, useSyncExternalStore } from "react";
import { Crown, Earth, Flag, Globe, Handshake, Hexagon, Moon, Shield, Star, Sun, Trophy, type LucideIcon } from "lucide-react";
import { pct } from "@/lib/format";
import type { Triple } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function TeamLogo({ src, name, size = 28 }: { src?: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-panel-2 text-[10px] font-semibold text-muted"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {initials}
      </span>
    );
  }
  if (src.startsWith("/flags/")) {  // national-team flag: 4:3, centred in the same square footprint as a badge
    return (
      <span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" onError={() => setErr(true)} loading="lazy"
          className="rounded-[3px] object-cover ring-1 ring-line" style={{ width: size, height: Math.round(size * 0.75) }} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} onError={() => setErr(true)}
      className="shrink-0 object-contain" style={{ width: size, height: size }} loading="lazy" />
  );
}

const COMP_ICON: Record<string, LucideIcon> = {
  ISR1: Flag, EPL: Crown, UCL: Star, UEL: Hexagon, UECL: Shield,
  UNL: Earth, WCQ: Globe, ECQ: Globe, EURO: Trophy, WC: Trophy, FRI: Handshake,
};

/** Minimal line icon for a competition (stands in for the old emoji flags). */
export function CompIcon({ comp, size = 14, className }: { comp: string; size?: number; className?: string }) {
  const Icon = COMP_ICON[comp] ?? Trophy;
  return <Icon size={size} strokeWidth={1.75} aria-hidden className={cx("shrink-0 text-muted", className)} />;
}

/** Three-segment 1X2 bar. `highlight` marks the actual outcome for finished matches. */
export function ProbBar({ p, height = 8, labels = false, highlight }: {
  p: Triple; height?: number; labels?: boolean; highlight?: number | null;
}) {
  const colors = ["var(--home)", "var(--draw)", "var(--away)"];
  return (
    <div className="w-full">
      <div className="flex w-full overflow-hidden rounded-full bg-panel-2" style={{ height }}>
        {p.map((v, i) => (
          <div key={i} style={{ width: `${v * 100}%`, background: colors[i],
            opacity: highlight === undefined || highlight === null || highlight === i ? 1 : 0.28 }}
            className="h-full transition-[width] duration-500 first:rounded-l-full last:rounded-r-full" />
        ))}
      </div>
      {labels && (
        <div className="mt-1.5 flex justify-between text-xs num">
          <span className="text-home font-semibold">{pct(p[0])}</span>
          <span className="text-draw font-semibold">{pct(p[1])}</span>
          <span className="text-away font-semibold">{pct(p[2])}</span>
        </div>
      )}
    </div>
  );
}

export function Pill({ children, tone = "default", className }: {
  children: React.ReactNode; tone?: "default" | "accent" | "warn" | "bad" | "good" | "home" | "away"; className?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-panel-2 text-muted",
    accent: "bg-accent-soft text-accent",
    warn: "bg-warn/15 text-warn",
    bad: "bg-bad/15 text-bad",
    good: "bg-good/15 text-good",
    home: "bg-home/15 text-home",
    away: "bg-away/15 text-away",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Section({ title, subtitle, right, children, className }: {
  title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    // min-w-0: cards sit in CSS grids, whose columns otherwise grow to their widest content (sideways scroll on phones)
    <section className={cx("card min-w-0 p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Sparkline({ values, width = 80, height = 24, color = "var(--accent)" }: {
  values: number[]; width?: number; height?: number; color?: string;
}) {
  if (!values || values.length < 2) return <span className="text-xs text-faint">–</span>;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={color} />
    </svg>
  );
}

export function ConfidenceDot({ level }: { level: "high" | "medium" | "low" | string }) {
  const n = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-0.5" title={`${level} confidence`} aria-label={`${level} confidence`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={cx("h-1.5 w-1.5 rounded-full", i < n ? "bg-accent" : "bg-line")} />
      ))}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} />;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="card p-6 text-sm">
      <p className="font-semibold">Couldn&apos;t load data</p>
      <p className="mt-1 text-muted">{message}</p>
      <p className="mt-3 text-muted">
        Run <code className="num rounded bg-panel-2 px-1.5 py-0.5">python pipeline/cli.py update</code> to generate
        predictions.
      </p>
    </div>
  );
}

function subscribeTheme(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function ThemeToggle() {
  // the theme lives on <html data-theme>, set before paint by the inline script in layout.tsx
  const theme = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme ?? "light", () => null);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode */ }
  };
  return (
    <button onClick={toggle} aria-label="Toggle colour theme"
      className="rounded-lg p-2 text-muted transition hover:bg-panel-2 hover:text-ink">
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl bg-panel-2 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={cx("num mt-0.5 text-lg font-semibold", tone)}>{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

/** A localStorage-backed string preference, safe for static prerendering. */
export function useStoredPref(key: string, fallback: string): [string, (v: string) => void] {
  const subscribe = (cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener("np-pref", cb);
    return () => { window.removeEventListener("storage", cb); window.removeEventListener("np-pref", cb); };
  };
  const read = () => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  const set = (v: string) => {
    try { localStorage.setItem(key, v); } catch { /* private mode */ }
    window.dispatchEvent(new Event("np-pref"));
  };
  return [value, set];
}
