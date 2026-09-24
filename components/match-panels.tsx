"use client";

import { useMemo, useState } from "react";
import { Check, ExternalLink, RotateCcw } from "lucide-react";
import { pct, shortDate, signedPct } from "@/lib/format";
import { quickMarkets } from "@/lib/poisson";
import type { MatchDetail, Markets, NewsItem, NewsLabel, TeamBlock, Triple } from "@/lib/types";
import { Pill, ProbBar, Section, Sparkline, Stat, TeamLogo, cx } from "./ui";

/* ---------------- score matrix heatmap ---------------- */
export function ScoreHeatmap({ matrix, home, away, actual }: {
  matrix: number[][]; home: string; away: string; actual?: [number, number] | null;
}) {
  const max = Math.max(...matrix.flat());
  const n = 6;
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="mb-1 pl-8 text-center text-[11px] font-medium text-away">{away} goals →</div>
        <div className="flex">
          <div className="flex w-8 items-center justify-center">
            {/* reads bottom-to-top like a normal y-axis label; rows count down from 0, so the arrow (leading, rotated
                with the text) points down */}
            <span className="-rotate-90 whitespace-nowrap text-[11px] font-medium text-home">← {home} goals</span>
          </div>
          <table className="border-separate border-spacing-[3px]">
            <thead>
              <tr>
                <th />
                {[...Array(n)].map((_, j) => <th key={j} className="num w-11 text-[11px] font-medium text-muted">{j}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...Array(n)].map((_, i) => (
                <tr key={i}>
                  <th className="num w-5 pr-1 text-right text-[11px] font-medium text-muted">{i}</th>
                  {[...Array(n)].map((_, j) => {
                    const v = matrix[i]?.[j] ?? 0;
                    const a = Math.pow(v / max, 0.75);
                    const isActual = actual && actual[0] === i && actual[1] === j;
                    const tone = i > j ? "var(--home)" : i === j ? "var(--draw)" : "var(--away)";
                    return (
                      <td key={j} title={`${i}-${j}: ${pct(v, 1)}`}
                        className={cx("num h-9 w-11 rounded-md text-center text-[11px] font-medium", isActual && "ring-2 ring-ink")}
                        style={{ background: `color-mix(in srgb, ${tone} ${Math.round(a * 85)}%, var(--panel-2))`,
                          color: a > 0.55 ? "white" : "var(--text)" }}>
                        {(v * 100).toFixed(v >= 0.1 ? 0 : 1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- markets ---------------- */
function Row({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 text-xs text-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="num w-11 text-right text-xs font-semibold">{pct(value)}</span>
      <span className="num w-10 text-right text-[11px] text-faint">{sub ?? (1 / Math.max(value, 1e-4)).toFixed(2)}</span>
    </div>
  );
}

export function MarketsPanel({ mk, home, away }: { mk: Markets; home: string; away: string }) {
  const [tab, setTab] = useState<"goals" | "result" | "handicap">("goals");
  return (
    <Section title="Markets" subtitle="Every figure comes from the same score matrix · right column = fair odds"
      right={
        <div className="flex rounded-lg bg-panel-2 p-0.5 text-xs">
          {(["goals", "result", "handicap"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cx("rounded-md px-2 py-1 capitalize", tab === t ? "bg-panel font-medium shadow-sm" : "text-muted")}>{t}</button>
          ))}
        </div>
      }>
      {tab === "goals" && (
        <div>
          {["0.5", "1.5", "2.5", "3.5", "4.5"].map((t) => <Row key={t} label={`Over ${t}`} value={mk.over[t]} />)}
          <Row label="Both teams score" value={mk.btts} />
          <Row label={`${home} over 1.5`} value={mk.team_goals_over.home["1.5"]} />
          <Row label={`${away} over 1.5`} value={mk.team_goals_over.away["1.5"]} />
        </div>
      )}
      {tab === "result" && (
        <div>
          <Row label="Home win" value={mk.p[0]} />
          <Row label="Draw" value={mk.p[1]} />
          <Row label="Away win" value={mk.p[2]} />
          <Row label="Home or draw (1X)" value={mk.double_chance["1X"]} />
          <Row label="Either wins (12)" value={mk.double_chance["12"]} />
          <Row label="Away or draw (X2)" value={mk.double_chance["X2"]} />
          <Row label={`${home} clean sheet`} value={mk.clean_sheet[0]} />
          <Row label={`${away} clean sheet`} value={mk.clean_sheet[1]} />
          <Row label={`${home} win to nil`} value={mk.win_to_nil[0]} />
          <Row label={`${away} win to nil`} value={mk.win_to_nil[1]} />
        </div>
      )}
      {tab === "handicap" && (
        <div>
          <p className="mb-2 text-xs text-muted">Asian handicap on {home}. Push = stake returned.</p>
          {Object.entries(mk.asian_handicap).map(([line, v]) => (
            <Row key={line} label={`${home} ${Number(line) > 0 ? "+" : ""}${line}`} value={v.win}
              sub={v.push > 0.001 ? `p ${pct(v.push)}` : undefined} />
          ))}
          <div className="mt-3 border-t border-line pt-2">
            <p className="mb-1 text-xs text-muted">Winning margin</p>
            <div className="flex items-end gap-1">
              {Object.entries(mk.margin).map(([k, v]) => {
                const max = Math.max(...Object.values(mk.margin));
                const d = Number(k);
                return (
                  <div key={k} className="flex flex-1 flex-col items-center gap-1">
                    <span className="num text-[10px] text-muted">{pct(v)}</span>
                    <div className="w-full rounded-t" style={{ height: `${(v / max) * 60}px`,
                      background: d > 0 ? "var(--home)" : d === 0 ? "var(--draw)" : "var(--away)" }} />
                    <span className="num text-[10px] text-faint">{d > 0 ? `+${d}` : d}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ---------------- factor waterfall ---------------- */
export function FactorsPanel({ d }: { d: MatchDetail }) {
  const pr = d.prediction;
  const [bh, ba] = pr.base_lambda;
  const [fh, fa] = pr.markets.lambda;
  return (
    <Section title="What moved the prediction" subtitle="Model expected goals, then real-world adjustments">
      <div className="grid grid-cols-2 gap-2">
        <Stat label={`${d.home.short} base xG`} value={bh.toFixed(2)} sub={<>final <b className="num text-home">{fh.toFixed(2)}</b></>} />
        <Stat label={`${d.away.short} base xG`} value={ba.toFixed(2)} sub={<>final <b className="num text-away">{fa.toFixed(2)}</b></>} />
      </div>
      {pr.factors.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No significant context adjustments for this match.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {pr.factors.map((f, i) => (
            <li key={i} className="flex items-center gap-3 py-2 text-sm">
              <span className={cx("h-2 w-2 shrink-0 rounded-full",
                f.side === "home" ? "bg-home" : f.side === "away" ? "bg-away" : "bg-draw")} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{f.label} <span className="text-xs font-normal text-muted">
                  · {f.side === "both" ? "both teams" : f.side === "home" ? d.home.short : d.away.short} goals</span></div>
                {f.detail && <div className="truncate text-xs text-muted">{f.detail}</div>}
              </div>
              <Pill tone={f.kind === "learned" ? "accent" : "default"}>{f.kind === "learned" ? "learned from data" : "prior"}</Pill>
              <span className={cx("num w-16 text-right font-semibold", f.mult >= 1 ? "text-good" : "text-bad")}>{signedPct(f.mult)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-panel-2 p-2"><div className="text-muted">Rest</div>
          <div className="num font-medium">{fmtRest(pr.features.rest_h)} / {fmtRest(pr.features.rest_a)}</div></div>
        <div className="rounded-lg bg-panel-2 p-2"><div className="text-muted">Away trip</div>
          <div className="num font-medium">{Math.round(pr.features.travel_km)} km</div></div>
        <div className="rounded-lg bg-panel-2 p-2"><div className="text-muted">Weather</div>
          <div className="num font-medium">{pr.weather ? `${Math.round(pr.weather.temp)}° · ${pr.weather.precip}mm · ${Math.round(pr.weather.wind)}km/h` : "–"}</div></div>
      </div>
    </Section>
  );
}

function fmtRest(x: number | null) {
  return x === null || x === undefined ? "–" : `${x > 30 ? "30+" : x.toFixed(0)}d`;
}

/* ---------------- model breakdown ---------------- */
const MODEL_NAMES: Record<string, { name: string; desc: string }> = {
  elo: { name: "Team ratings", desc: "Elo rating of each side" },
  dc: { name: "Attack & defence", desc: "Team strengths from recent goals" },
  dcx: { name: "Attack & defence (xG)", desc: "The same, also using expected goals" },
  market: { name: "Bookmakers", desc: "Odds turned into expected goals" },
  independent: { name: "Our model (no odds)", desc: "The blend without bookmaker input" },
  ensemble_base: { name: "Blend", desc: "Weighted mix, before injuries and other context" },
};

export function ModelBreakdown({ d, weights }: { d: MatchDetail; weights?: Record<string, number> }) {
  const b = d.prediction.breakdown;
  const order = ["elo", "dc", "dcx", "market", "independent", "ensemble_base"].filter((k) => b[k]);
  return (
    <Section title="Model breakdown" subtitle={`Confidence ${d.prediction.confidence.label} · models disagree by ±${pct(d.prediction.confidence.model_spread, 1)}`}>
      <div className="space-y-3">
        {order.map((k) => (
          <div key={k} className={cx(k === "ensemble_base" && "border-t border-line pt-3")}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <span className="text-sm font-medium">{MODEL_NAMES[k]?.name ?? k}</span>
                {weights?.[k] !== undefined && <span className="ml-1.5 text-[11px] text-faint">weight {pct(weights[k])}</span>}
                <div className="truncate text-[11px] text-muted">{MODEL_NAMES[k]?.desc}</div>
              </div>
              <span className="num shrink-0 text-xs text-muted">xG {b[k].lambda[0].toFixed(2)}–{b[k].lambda[1].toFixed(2)}</span>
            </div>
            <ProbBar p={b[k].p} height={6} labels />
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- value vs market ---------------- */
export function ValuePanel({ d }: { d: MatchDetail }) {
  const v = d.prediction.value;
  if (!v) return null;
  const names = [d.home.short, "Draw", d.away.short];
  return (
    <Section title="Model vs bookmaker" subtitle="Our odds-free prediction against the bookmakers' prices, with their margin removed">
      <div className="grid grid-cols-3 gap-2">
        {names.map((n, i) => (
          <div key={n} className="rounded-xl bg-panel-2 p-3 text-center">
            <div className="truncate text-xs text-muted">{n}</div>
            <div className="num mt-1 text-lg font-semibold">{v.odds[i].toFixed(2)}</div>
            <div className="num text-[11px] text-muted">market {pct(v.implied[i])} · us {pct(v.model_p[i])}</div>
            <div className={cx("num mt-1 text-xs font-semibold", v.edge[i] > 0.03 ? "text-good" : v.edge[i] < -0.03 ? "text-bad" : "text-muted")}>
              {v.edge[i] >= 0 ? "+" : ""}{(v.edge[i] * 100).toFixed(1)}% EV
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-faint">
        Backtests show closing odds are very sharp; treat small edges as noise. Not betting advice.
      </p>
    </Section>
  );
}

/* ---------------- what-if simulator ---------------- */
export function WhatIf({ d }: { d: MatchDetail }) {
  const pr = d.prediction;
  const [h0, a0] = pr.markets.lambda;
  const [adj, setAdj] = useState({ hAtt: 0, aAtt: 0, hDef: 0, aDef: 0, neutral: false });
  const [off, setOff] = useState<Record<string, boolean>>({});
  const players = [
    ...d.home_team.absences.map((a) => ({ ...a, side: "home" as const })),
    ...d.away_team.absences.map((a) => ({ ...a, side: "away" as const })),
  ].filter((a) => a.mult !== undefined && Math.abs(a.mult - 1) > 0.002);

  const res = useMemo(() => {
    let lh = h0 * (1 + adj.hAtt / 100) * (1 + adj.aDef / 100);
    let la = a0 * (1 + adj.aAtt / 100) * (1 + adj.hDef / 100);
    if (adj.neutral && !d.neutral) {
      const hfa = Math.exp(0.2); // typical home effect removed symmetrically
      lh /= Math.sqrt(hfa); la *= Math.sqrt(hfa);
    }
    // toggling a player *back in* removes exactly the effect the model applied for his absence
    for (const p of players) {
      if (!off[p.player] || !p.mult) continue;
      const ownSide = (p.side === "home") === (p.target === "own");
      if (ownSide) lh /= p.mult; else la /= p.mult;
    }
    return { lh, la, m: quickMarkets(lh, la, pr.rho) };
  }, [adj, off, h0, a0, pr.rho, players, d.neutral]);

  const base = useMemo(() => quickMarkets(h0, a0, pr.rho), [h0, a0, pr.rho]);
  const changed = JSON.stringify(adj) !== JSON.stringify({ hAtt: 0, aAtt: 0, hDef: 0, aDef: 0, neutral: false }) ||
    Object.values(off).some(Boolean);

  const slider = (key: "hAtt" | "aAtt" | "hDef" | "aDef", label: string, hint: string, tone: string) => (
    <label className="block">
      <div className="flex justify-between text-xs"><span className="font-medium">{label}</span>
        <span className={cx("num font-semibold", tone)}>{adj[key] > 0 ? "+" : ""}{adj[key]}%</span></div>
      <input type="range" min={-40} max={40} step={5} value={adj[key]} className="w-full"
        onChange={(e) => setAdj({ ...adj, [key]: Number(e.target.value) })} />
      <div className="text-[11px] text-faint">{hint}</div>
    </label>
  );

  return (
    <Section title="What-if simulator"
      subtitle={`Know something the model doesn't? The model expects ${h0.toFixed(2)} goals for ${d.home.short} and ${a0.toFixed(2)} for ${d.away.short}. Each slider scales one of those; every probability updates.`}
      right={changed ? <button onClick={() => { setAdj({ hAtt: 0, aAtt: 0, hDef: 0, aDef: 0, neutral: false }); setOff({}); }}
        className="flex items-center gap-1 text-xs text-muted hover:text-ink"><RotateCcw size={12} /> reset</button> : undefined}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          {slider("hAtt", `Goals ${d.home.short} score`, "Up: attackers in form or back from injury. Down: a key forward is missing.", "text-home")}
          {slider("hDef", `Goals ${d.home.short} let in`, "Up: defenders or the goalkeeper missing. Down: a tighter defence than usual.", "text-home")}
          {slider("aAtt", `Goals ${d.away.short} score`, "Up: attackers in form or back from injury. Down: a key forward is missing.", "text-away")}
          {slider("aDef", `Goals ${d.away.short} let in`, "Up: defenders or the goalkeeper missing. Down: a tighter defence than usual.", "text-away")}
          {!d.neutral && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={adj.neutral} onChange={(e) => setAdj({ ...adj, neutral: e.target.checked })} />
              Play at a neutral venue
            </label>
          )}
          {players.length > 0 && (
            <div>
              <div className="mb-1 text-xs text-muted">Players the model expects to miss the match. Tap one who will play after all:</div>
              <div className="flex flex-wrap gap-1.5">
                {players.map((p) => (
                  <button key={p.side + p.player} onClick={() => setOff({ ...off, [p.player]: !off[p.player] })}
                    className={cx("rounded-full border px-2 py-0.5 text-xs transition",
                      off[p.player] ? "border-accent bg-accent-soft text-accent" : "border-line text-muted")}>
                    {off[p.player] && <Check size={11} strokeWidth={3} className="-ml-0.5 inline" />}{p.player} <span className="text-faint">({p.side === "home" ? d.home.short : d.away.short})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-panel-2 p-2">
                <div className="text-[11px] text-muted">{[d.home.short, "Draw", d.away.short][i]}</div>
                <div className={cx("num text-lg font-semibold", ["text-home", "text-draw", "text-away"][i])}>{pct(res.m.p[i])}</div>
                <Delta a={res.m.p[i]} b={base.p[i]} />
              </div>
            ))}
          </div>
          <ProbBar p={res.m.p as Triple} height={8} />
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-panel-2 p-2"><div className="text-muted">Expected goals</div>
              <div className="num font-semibold">{res.lh.toFixed(2)} – {res.la.toFixed(2)}</div></div>
            <div className="rounded-lg bg-panel-2 p-2"><div className="text-muted">Over 2.5</div>
              <div className="num font-semibold">{pct(res.m.over["2.5"])}</div><Delta a={res.m.over["2.5"]} b={base.over["2.5"]} /></div>
            <div className="rounded-lg bg-panel-2 p-2"><div className="text-muted">BTTS</div>
              <div className="num font-semibold">{pct(res.m.btts)}</div><Delta a={res.m.btts} b={base.btts} /></div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {res.m.top.slice(0, 5).map((s) => (
              <span key={s.score} className="num rounded-md bg-panel-2 px-2 py-1 text-xs"><b>{s.score}</b> <span className="text-muted">{pct(s.p)}</span></span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Delta({ a, b }: { a: number; b: number }) {
  const d = (a - b) * 100;
  if (Math.abs(d) < 0.5) return <div className="text-[10px] text-faint">±0</div>;
  return <div className={cx("num text-[10px] font-medium", d > 0 ? "text-good" : "text-bad")}>{d > 0 ? "+" : ""}{d.toFixed(1)}pt</div>;
}

/* ---------------- form & team ---------------- */
export function TeamPanel({ t, side }: { t: TeamBlock; side: "home" | "away" }) {
  const tone = side === "home" ? "var(--home)" : "var(--away)";
  return (
    <Section title={t.name} subtitle={t.name_he ?? undefined}
      right={<TeamLogo src={t.logo} name={t.name} size={30} />}>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Elo" value={t.elo} sub={<Sparkline values={t.elo_trend} width={70} height={18} color={tone} />} />
        <Stat label="Attack" value={t.attack ? `${Math.round(t.attack * 100)}` : "–"} sub="100 = avg side" />
        <Stat label="Defence" value={t.defence ? `${Math.round(100 / t.defence)}` : "–"} sub="higher = tighter" />
      </div>
      <div className="mt-3">
        <div className="mb-1.5 text-xs text-muted">Recent form (newest first)</div>
        <div className="flex gap-1">
          {t.form.map((f, i) => (
            <span key={i} title={`${f.date} ${f.home ? "vs" : "@"} ${f.opp} ${f.gf}-${f.ga} (${f.comp})`}
              className={cx("flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white",
                f.res === "W" ? "bg-good" : f.res === "D" ? "bg-draw" : "bg-bad")}>{f.res}</span>
          ))}
        </div>
        <ul className="mt-2 space-y-1">
          {t.form.slice(0, 5).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span className="num w-12 text-faint">{shortDate(f.date + "T12:00:00Z")}</span>
              <span className="w-10 text-faint">{f.comp}</span>
              <span className="text-muted">{f.home ? "vs" : "@"}</span>
              <span className="min-w-0 flex-1 truncate">{f.opp}</span>
              <span className={cx("num font-semibold", f.res === "W" ? "text-good" : f.res === "L" ? "text-bad" : "text-muted")}>{f.gf}–{f.ga}</span>
            </li>
          ))}
        </ul>
      </div>
      {t.events && t.events.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-1.5 text-xs text-muted">Team news</div>
          <ul className="space-y-1">
            {t.events.map((e, i) => {
              const lab = NEWS_LABEL[e.type as NewsLabel];
              return (
                <li key={i} className="flex gap-2 text-xs">
                  <Pill tone={lab?.tone ?? "default"}>{lab?.text ?? e.type.replace("_", " ")}</Pill>
                  <span className="text-muted" dir="auto">
                    {e.link ? <a href={e.link} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{e.summary}</a> : e.summary}
                    {e.outlets && e.outlets.length > 0 && <span className="text-faint"> · {outletsText(e.outlets[0], e.outlets)}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {t.absences.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-1.5 text-xs text-muted">Availability</div>
          <ul className="space-y-1">
            {t.absences.map((a) => (
              <li key={a.player} className="flex items-center gap-2 text-xs">
                <Pill tone={a.status === "doubt" ? "warn" : "bad"}>{a.status}</Pill>
                <span className="font-medium">{a.player}</span>
                {a.source === "news-model" && <Pill tone="accent">from news</Pill>}
                <span className="text-faint">{a.role}</span>
                <span className="min-w-0 flex-1 truncate text-muted" title={a.note}>{a.note}</span>
                {a.chance !== null && <span className="num text-faint">{pct(a.chance)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

const NEWS_LABEL: Record<NewsLabel, { text: string; tone: "bad" | "warn" | "good" | "default" }> = {
  out_injured: { text: "Injured", tone: "bad" },
  suspended: { text: "Suspended", tone: "bad" },
  doubtful: { text: "Doubtful", tone: "warn" },
  returning: { text: "Returning", tone: "good" },
  left_club: { text: "Left the club", tone: "default" },
  manager_change: { text: "Coach change", tone: "warn" },
  crisis: { text: "Turmoil", tone: "bad" },
  squad_news: { text: "Squad news", tone: "warn" },
};

function outletsText(publisher: string | undefined, outlets: string[] | undefined) {
  const others = (outlets ?? []).filter((o) => o !== publisher).length;
  return others > 0 ? `${publisher} +${others}` : publisher;
}

export function NewsPanel({ news, home, away }: { news: { home: NewsItem[]; away: NewsItem[] }; home: string; away: string }) {
  // an article mentioning both sides appears in both lists: show it once, labelled with both teams
  const merged = new Map<string, NewsItem & { team: string }>();
  for (const [items, team] of [[news.home, home], [news.away, away]] as const) {
    for (const n of items) {
      const key = `${n.label ?? ""}|${n.player ?? ""}|${n.title}`;
      const prev = merged.get(key);
      merged.set(key, prev ? { ...prev, team: `${prev.team} · ${team}` } : { ...n, team });
    }
  }
  // stories (what the news model found) first, then the other headlines, newest first within each
  const all = [...merged.values()].sort((a, b) =>
    Number(!!b.label) - Number(!!a.label) || (b.published ?? "").localeCompare(a.published ?? ""));
  if (!all.length) return null;
  return (
    <Section title="Latest news"
      subtitle="Israeli sports press and Google News. A local language model reads each headline; repeat reports of the same news are grouped into one story.">
      <ul className="divide-y divide-line">
        {all.slice(0, 12).map((n, i) => {
          const lab = n.label ? NEWS_LABEL[n.label] : null;
          const title = n.link ? (
            <a href={n.link} target="_blank" rel="noopener noreferrer" className="group inline-flex gap-1.5 hover:text-accent">
              <span dir="auto">{n.title}</span><ExternalLink size={12} className="mt-1 shrink-0 text-faint group-hover:text-accent" />
            </a>
          ) : <span dir="auto">{n.title}</span>;
          return (
            <li key={i} className="py-2.5 text-sm">
              {lab && (
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Pill tone={lab.tone}>{lab.text}</Pill>
                  <span className="text-xs font-medium">{n.player ?? n.team}</span>
                </div>
              )}
              <div>{title}</div>
              {!lab && n.lede && <p className="mt-0.5 line-clamp-2 text-xs text-muted" dir="auto">{n.lede}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-faint">
                <span>{n.team}</span>·<span>{outletsText(n.publisher, n.outlets)}</span>
                {n.published && <>·<span>{shortDate(n.published)}</span></>}
                {!lab && n.players?.map((p) => <Pill key={p} tone="accent">{p}</Pill>)}
                {n.tags?.split(",").filter(Boolean).map((t) => <Pill key={t} tone={t === "injury" || t === "suspension" ? "bad" : t === "manager" || t === "crisis" ? "warn" : "default"}>{t}</Pill>)}
              </div>
              {n.articles && n.articles.length > 1 && (
                <details className="mt-1.5 text-xs">
                  <summary className="cursor-pointer text-muted hover:text-ink">{n.articles.length} reports</summary>
                  <ul className="mt-1 space-y-1 border-l border-line pl-3">
                    {n.articles.map((a, j) => (
                      <li key={j} className="text-muted">
                        {a.link ? <a href={a.link} target="_blank" rel="noopener noreferrer" className="hover:text-accent" dir="auto">{a.title}</a>
                          : <span dir="auto">{a.title}</span>}
                        <span className="text-faint"> · {a.publisher} · {shortDate(a.published)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
