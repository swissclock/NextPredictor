"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { pct, shortDate } from "@/lib/format";
import type { MarketTracker } from "@/lib/types";
import { Pill, Section, Stat, cx } from "./ui";

const BOOKS = [
  { key: "bet365", name: "Bet365", color: "var(--series-a)" },
  { key: "winner", name: "Winner", color: "var(--series-b)" },
] as const;
const OUTCOME = ["home win", "draw", "away win"];

/** Our odds-free model against Bet365 and Winner on finished games (Track record page). */
export function MarketTrackerSection({ t, compNames }: { t?: MarketTracker; compNames: Record<string, string> }) {
  if (!t || !t.n) return null;
  const all = t.summary?.find((s) => s.group === "All");
  return (
    <Section title="Model vs market"
      subtitle={`Our odds-free model against Bet365 and Winner, margins removed · ${t.n.toLocaleString("en-GB")} finished games since ${t.since ? shortDate(t.since) + " " + t.since.slice(0, 4) : "2024"}`}>
      <div className="space-y-6">
        {t.summary && t.summary.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Who is more accurate (RPS, lower is better)</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[340px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="py-2">Games</th><th className="text-right">n</th>
                    <th className="text-right">Ours</th><th className="text-right">Bet365</th><th className="text-right">Winner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {t.summary.map((s) => {
                    const best = Math.min(s.ours, s.bet365, s.winner);
                    const cell = (v: number) => <td className={cx("num text-right", v === best ? "font-semibold text-ink" : "text-muted")}>{v.toFixed(4)}</td>;
                    return (
                      <tr key={s.group} className={cx(s.group === "All" && "font-medium")}>
                        <td className="truncate py-2 pr-2">{s.group}</td>
                        <td className="num text-right text-faint">{s.n.toLocaleString("en-GB")}</td>
                        {cell(s.ours)}{cell(s.bet365)}{cell(s.winner)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {all && (
              <p className="mt-2 text-[11px] text-faint">
                Margin taken: Bet365 {pct(all.margin_bet365, 1)}, Winner {pct(all.margin_winner, 1)} on average.
              </p>
            )}
          </div>
        )}

        {t.disagree && t.disagree.length > 0 && (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">When we disagree, who is right?</h3>
            <p className="mb-2 text-xs text-muted">Games grouped by how much more we rated one result than Bet365 did, and how often that result happened.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[340px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="py-2">We rated it higher by</th><th className="text-right">n</th>
                    <th className="text-right">We said</th><th className="text-right">Market</th><th className="text-right">Happened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {t.disagree.map((d) => {
                    const closer = Math.abs(d.ours - d.happened) < Math.abs(d.market - d.happened) ? "ours" : "market";
                    return (
                      <tr key={d.lo}>
                        <td className="num whitespace-nowrap py-2">{d.hi >= 1 ? `${Math.round(d.lo * 100)}+ pts` : `${Math.round(d.lo * 100)}–${Math.round(d.hi * 100)} pts`}</td>
                        <td className="num text-right text-faint">{d.n.toLocaleString("en-GB")}</td>
                        <td className={cx("num text-right", closer === "ours" ? "font-semibold" : "text-muted")}>{pct(d.ours)}</td>
                        <td className={cx("num text-right", closer === "market" ? "font-semibold" : "text-muted")}>{pct(d.market)}</td>
                        <td className="num text-right">{pct(d.happened)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-faint">Bold = the side whose number was closer to what happened.</p>
          </div>
        )}

        {t.bets && Object.keys(t.bets).length > 0 && (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">If you had bet our disagreements</h3>
            <p className="mb-3 text-xs text-muted">
              One unit on the result with the best expected value by our numbers, whenever that value was positive at the
              bookmaker&apos;s price. A test of whether the model knows something the price doesn&apos;t, not betting advice.
            </p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {BOOKS.map((b) => {
                const v = t.bets?.[b.key];
                return v ? (
                  <Stat key={b.key} label={`At ${b.name}`} value={`${v.roi >= 0 ? "+" : ""}${(v.roi * 100).toFixed(1)}%`}
                    sub={`return per unit · ±${(v.ci * 100).toFixed(0)}% · ${v.n.toLocaleString("en-GB")} bets`}
                    tone={v.roi - v.ci > 0 ? "text-good" : v.roi + v.ci < 0 ? "text-bad" : undefined} />
                ) : null;
              })}
            </div>
            <PnlChart bets={t.bets} />
          </div>
        )}

        {t.recent && t.recent.length > 0 && (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Recent big disagreements</h3>
            <p className="mb-2 text-xs text-muted">Finished games where we rated a result at least 5 points higher than Bet365.</p>
            <ul className="divide-y divide-line">
              {t.recent.slice(0, 25).map((r) => (
                <li key={r.id} className="flex items-center gap-2 py-2 text-sm sm:gap-3">
                  {r.hit ? <Check size={15} className="shrink-0 text-good" aria-label="happened" /> : <X size={15} className="shrink-0 text-faint" aria-label="did not happen" />}
                  <span className="num w-12 shrink-0 text-xs text-faint">{shortDate(r.kickoff)}</span>
                  <span className="min-w-0 flex-1 truncate">{r.home} <b className="num">{r.score[0]}–{r.score[1]}</b> {r.away}</span>
                  <span className="hidden shrink-0 text-xs text-muted sm:inline">{compNames[r.comp] ?? r.comp} · {OUTCOME[r.k]}</span>
                  <span className="num shrink-0 text-xs"><b>{pct(r.ours)}</b> <span className="text-faint">vs</span> {pct(r.market)}</span>
                  {r.source === "live" && <Pill tone="accent" className="hidden sm:inline-flex">live</Pill>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-faint">
              Ours vs market for the result we favoured. Games before this tracker went live come from the walk-forward
              backtest (opening prices); live games use the prices at our last update before kickoff.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}

/** Cumulative profit in units for each bookmaker, one shared time axis, crosshair tooltip on hover. */
function PnlChart({ bets }: { bets: NonNullable<MarketTracker["bets"]> }) {
  // drawn at its real width (not a scaled viewBox) so labels stay readable on phones
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 480 ? 180 : 220, L = 36, R = 74, T = 12, B = 24;
  const series = BOOKS.filter((b) => bets[b.key]?.curve.length).map((b) => ({ ...b, pts: bets[b.key].curve }));
  const [hover, setHover] = useState<number | null>(null);
  const { t0, t1, lo, hi } = useMemo(() => {
    const ts = series.flatMap((s) => s.pts.map(([d]) => Date.parse(d)));
    const vs = series.flatMap((s) => s.pts.map(([, v]) => v)).concat(0);
    return { t0: Math.min(...ts), t1: Math.max(...ts), lo: Math.min(...vs), hi: Math.max(...vs) };
  }, [series]);
  if (!series.length) return null;
  const x = (d: string | number) => L + ((typeof d === "string" ? Date.parse(d) : d) - t0) / Math.max(1, t1 - t0) * (W - L - R);
  const pad = (hi - lo) * 0.08 || 1;
  const y = (v: number) => T + (hi + pad - v) / (hi - lo + 2 * pad) * (H - T - B);
  const ticks = niceTicks(lo, hi);
  const at = (pts: [string, number][], t: number) => {
    let v: number | null = null;
    for (const [d, c] of pts) { if (Date.parse(d) <= t) v = c; else break; }
    return v;
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.min(t1, Math.max(t0, t0 + ((px - L) / (W - L - R)) * (t1 - t0))));
  };
  return (
    <div>
      <div className="mb-1 flex items-center gap-4 text-[11px] text-muted">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />{s.name}</span>
        ))}
        <span className="ml-auto text-faint">cumulative units</span>
      </div>
      <div ref={box} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block w-full touch-none" role="img"
          aria-label="Cumulative profit in units from betting our disagreements at Bet365 and Winner"
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={v === 0 ? 1.2 : 0.6}
                strokeDasharray={v === 0 ? undefined : "2 3"} />
              <text x={L - 6} y={y(v) + 3} fontSize={10} textAnchor="end" fill="var(--faint)">{v > 0 ? `+${v}` : v}</text>
            </g>
          ))}
          {[t0, (t0 + t1) / 2, t1].map((tt, i) => (
            <text key={i} x={x(tt)} y={H - 6} fontSize={10} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} fill="var(--faint)">
              {new Date(tt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
            </text>
          ))}
          {series.map((s) => {
            const last = s.pts[s.pts.length - 1];
            return (
              <g key={s.key}>
                <polyline points={s.pts.map(([d, v]) => `${x(d)},${y(v)}`).join(" ")} fill="none" stroke={s.color}
                  strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                <text x={x(last[0]) + 6} y={y(last[1]) + 3} fontSize={10} fill="var(--muted)">{s.name} {last[1] > 0 ? "+" : ""}{Math.round(last[1])}</text>
              </g>
            );
          })}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--faint)" strokeWidth={0.8} />
              {series.map((s) => {
                const v = at(s.pts, hover);
                return v === null ? null : <circle key={s.key} cx={x(hover)} cy={y(v)} r={4} fill={s.color} stroke="var(--panel)" strokeWidth={2} />;
              })}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-md border border-line bg-panel px-2 py-1 text-[11px] shadow"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: x(hover) > W / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}>
            <div className="text-faint">{new Date(hover).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
            {series.map((s) => {
              const v = at(s.pts, hover);
              return v === null ? null : (
                <div key={s.key} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name} <b className="num">{v > 0 ? "+" : ""}{v.toFixed(1)}</b>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function niceTicks(lo: number, hi: number): number[] {
  const span = Math.max(1, hi - lo);
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((s) => span / s <= 5) ?? 1000;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
  if (!out.includes(0)) out.push(0);
  return out.sort((a, b) => a - b);
}
