"use client";

import { Check, X } from "lucide-react";
import { ErrorBox, Pill, Section, Skeleton, Stat, cx } from "@/components/ui";
import { useJson } from "@/lib/data";
import { pct, shortDate } from "@/lib/format";
import type { Metric, PerformanceData } from "@/lib/types";

const COMP_NAMES: Record<string, string> = {
  EPL: "Premier League", ISR1: "Ligat HaAl", UCL: "Champions League", UEL: "Europa League", UECL: "Conference League",
  UNL: "Nations League", WCQ: "World Cup qualifying", ECQ: "EURO qualifying", EURO: "EURO finals", WC: "World Cup",
  FRI: "Friendlies", INTQ: "Other qualifiers", CONT: "Continental finals", INT: "Other internationals",
};
const DOMAIN_NAMES: Record<string, string> = {
  club_market: "Premier League (odds available)", club: "Clubs without odds (Ligat HaAl, UEFA cups)", nation: "National teams",
};
const MODEL_LABEL: Record<string, string> = {
  ensemble: "Blend (published)", elo: "Team ratings", dc: "Attack & defence", dcx: "Attack & defence (xG)", market: "Bookmakers", independent: "Our model (no odds)", base_rate: "Base rate",
};
const ABSENCE_LABEL: Record<string, string> = {
  abs_fwd: "Missing forward: own goals", abs_mid: "Missing midfielder: own goals",
  abs_def: "Missing defender: goals conceded", abs_gk: "Missing goalkeeper: goals conceded",
};

type Effect = { coef: number; se: number; n: number; applied?: boolean };
type AbsenceCheck = { none: number; prior: number; learned: number; n_test: number; test_from: string };

function EffectCell({ e }: { e?: Effect }) {
  if (!e) return <td className="text-right">–</td>;
  const eff = (Math.exp(e.coef) - 1) * 100;
  return (
    <td className="num text-right">
      <span className={cx(e.applied ? "font-semibold" : "text-faint")}>{eff >= 0 ? "+" : ""}{eff.toFixed(1)}%</span>
      <span className="ml-1 text-[11px] text-faint">±{(e.se * 196).toFixed(1)}</span>
      {e.applied && <Pill tone="accent" className="ml-1.5">used</Pill>}
    </td>
  );
}

const EFFECT_LABEL: Record<string, string> = {
  rest_att: "Own side on ≤3.5 days rest", rest_def: "Opponent on ≤3.5 days rest", travel_home: "Opponent's travel (per log-km)",
  travel_away: "Own travel (per log-km)", lead: "Second leg: per goal of aggregate lead",
};

export default function Performance() {
  const { data, error } = useJson<PerformanceData>("performance.json");
  if (error) return <ErrorBox message={error} />;
  if (!data) return <Skeleton className="mt-6 h-96" />;

  const comps = Object.entries(data.comps ?? {});
  const total = comps.reduce((s, [, v]) => s + v.ensemble.n, 0);
  const wAvg = (f: (m: { ensemble: Metric; base_rate: Metric }) => number) =>
    comps.reduce((s, [, v]) => s + f(v) * v.ensemble.n, 0) / Math.max(total, 1);
  const rps = wAvg((v) => v.ensemble.rps);
  const base = wAvg((v) => v.base_rate.rps);
  const acc = wAvg((v) => v.ensemble.accuracy ?? 0);

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Track record</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Walk-forward backtest: the models are refit every week using only matches that had already been played, then
          scored on the following week. Settings were tuned on an earlier period, so these numbers are out-of-sample.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Matches tested" value={total.toLocaleString()} sub="out-of-sample" />
        <Stat label="Favourite won" value={pct(acc, 1)} sub="top pick accuracy" />
        <Stat label="RPS" value={rps.toFixed(4)} sub="lower is better" />
        <Stat label="vs base rates" value={`−${((1 - rps / base) * 100).toFixed(1)}%`} sub="error reduction" tone="text-good" />
      </div>

      <Section title="By competition" subtitle="RPS = ranked probability score, the standard accuracy measure for win/draw/loss forecasts">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2">Competition</th><th className="text-right">Matches</th><th className="text-right">Period</th>
                <th className="text-right">Accuracy</th><th className="text-right">RPS</th><th className="text-right">Base rate</th>
                <th className="text-right">Bookmaker</th><th className="text-right">Skill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {comps.sort((a, b) => b[1].ensemble.n - a[1].ensemble.n).map(([c, v]) => (
                <tr key={c}>
                  <td className="py-2 font-medium">{COMP_NAMES[c] ?? c}</td>
                  <td className="num text-right text-muted">{v.ensemble.n}</td>
                  <td className="num text-right text-xs text-faint">{v.period[0].slice(0, 7)} → {v.period[1].slice(0, 7)}</td>
                  <td className="num text-right">{pct(v.ensemble.accuracy, 1)}</td>
                  <td className="num text-right font-semibold">{v.ensemble.rps.toFixed(4)}</td>
                  <td className="num text-right text-muted">{v.base_rate.rps.toFixed(4)}</td>
                  <td className="num text-right text-muted">{v.market ? v.market.rps.toFixed(4) : "–"}</td>
                  <td className="num text-right text-good">{((1 - v.ensemble.rps / v.base_rate.rps) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(data.domains ?? {}).map(([dom, v]) => (
          <Section key={dom} title={DOMAIN_NAMES[dom] ?? dom} subtitle={`Ensemble weights: ${Object.entries(v.weights).filter(([, w]) => w > 0).map(([k, w]) => `${MODEL_LABEL[k] ?? k} ${pct(w)}`).join(" · ")}`}>
            <ModelBars v={v as unknown as Record<string, Metric>} />
            <div className="mt-4"><Calibration pts={v.calibration} /></div>
          </Section>
        ))}
      </div>

      {data.context && (
        <Section title="Context effects learned from history"
          subtitle="How much each factor changes expected goals beyond what team ratings already capture. Only effects that are clear in past results are used.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="py-2">Factor</th><th className="text-right">Clubs</th><th className="text-right">Nations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {Object.keys(EFFECT_LABEL).map((k) => (
                  <tr key={k}>
                    <td className="py-2">{EFFECT_LABEL[k]}</td>
                    {(["club", "nation"] as const).map((dom) => <EffectCell key={dom} e={data.context?.[dom]?.[k]} />)}
                  </tr>
                ))}
                {data.absence && (
                  <tr>
                    <td colSpan={3} className="pt-4 pb-1 text-[11px] uppercase tracking-wide text-muted">
                      Missing players, per regular starter · from 365Scores lineups ({["club", "nation"].map((d) =>
                        `${Number(data.absence?.[d]?._n_matches ?? 0).toLocaleString("en-GB")} ${d === "club" ? "club" : "national-team"}`).join(" and ")} matches)
                    </td>
                  </tr>
                )}
                {data.absence && Object.keys(ABSENCE_LABEL).map((k) => (
                  <tr key={k}>
                    <td className="py-2">{ABSENCE_LABEL[k]}</td>
                    {(["club", "nation"] as const).map((dom) => <EffectCell key={dom} e={data.absence?.[dom]?.[k] as Effect | undefined} />)}
                  </tr>
                ))}
                {data.absence && (
                  <tr>
                    <td colSpan={3} className="pt-2 text-xs text-muted">
                      {(["club", "nation"] as const).map((dom) => {
                        const c = data.absence?.[dom]?._check as unknown as AbsenceCheck | undefined;
                        if (!c) return null;
                        const used = c.learned < c.prior ? "these learned effects" : "the fixed estimates";
                        return (
                          <p key={dom} className="mt-1">
                            <b className="text-ink">{dom === "club" ? "Clubs" : "National teams"}:</b> on the newest {c.n_test.toLocaleString("en-GB")} matches
                            (from {c.test_from}), the ranked probability score was {c.none.toFixed(4)} with no absence
                            adjustment, {c.prior.toFixed(4)} with the fixed estimates and {c.learned.toFixed(4)} with effects
                            learned from the older matches (lower is better). Predictions use {used}.
                          </p>
                        );
                      })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="Live record" subtitle="Predictions logged before kickoff and graded after the final whistle">
        {!data.live || data.live.n === 0 ? (
          <p className="text-sm text-muted">No graded live predictions yet — they appear here as the logged fixtures finish.</p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <Stat label="Graded" value={data.live.n} />
              <Stat label="Accuracy" value={pct(data.live.accuracy, 1)} />
              <Stat label="RPS" value={data.live.rps?.toFixed(4)} />
            </div>
            <ul className="divide-y divide-line">
              {data.live.recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                  {r.hit ? <Check size={15} className="text-good" /> : <X size={15} className="text-faint" />}
                  <span className="num w-14 text-xs text-faint">{shortDate(r.kickoff)}</span>
                  <span className="min-w-0 flex-1 truncate">{r.home} <b className="num">{r.score[0]}–{r.score[1]}</b> {r.away}</span>
                  <span className="num text-xs text-muted">{pct(r.p[0])} / {pct(r.p[1])} / {pct(r.p[2])}</span>
                  {r.exact && <Pill tone="good">exact score</Pill>}
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>
    </div>
  );
}

function ModelBars({ v }: { v: Record<string, Metric> }) {
  const keys = ["base_rate", "elo", "dc", "dcx", "independent", "market", "ensemble"].filter((k) => v[k]?.rps);
  const vals = keys.map((k) => v[k].rps);
  const lo = Math.min(...vals) - 0.004, hi = Math.max(...vals);
  return (
    <div className="space-y-1.5">
      {keys.map((k) => (
        <div key={k} className="flex items-center gap-2 text-xs">
          <span className="w-32 shrink-0 text-muted">{MODEL_LABEL[k] ?? k}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2">
            <div className={cx("h-full rounded-full", k === "ensemble" ? "bg-accent" : k === "base_rate" ? "bg-bad/60" : "bg-draw")}
              style={{ width: `${((v[k].rps - lo) / (hi - lo)) * 100}%` }} />
          </div>
          <span className="num w-14 text-right font-medium">{v[k].rps.toFixed(4)}</span>
        </div>
      ))}
      <p className="pt-1 text-[11px] text-faint">RPS, shorter bar = better.</p>
    </div>
  );
}

function Calibration({ pts }: { pts: { pred: number; obs: number; n: number }[] }) {
  const W = 260, H = 180, P = 26;
  const x = (v: number) => P + v * (W - P - 8);
  const y = (v: number) => H - P - v * (H - P - 8);
  return (
    <div>
      <div className="mb-1 text-xs text-muted">Calibration — when we say X%, it happens X% of the time</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm" role="img" aria-label="Calibration chart">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={0.6} />
            <text x={P - 4} y={y(t) + 3} fontSize={8} textAnchor="end" fill="var(--faint)">{t * 100}</text>
            <text x={x(t)} y={H - P + 12} fontSize={8} textAnchor="middle" fill="var(--faint)">{t * 100}</text>
          </g>
        ))}
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--faint)" strokeDasharray="3 3" strokeWidth={0.8} />
        <polyline points={pts.map((p) => `${x(p.pred)},${y(p.obs)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        {pts.map((p, i) => <circle key={i} cx={x(p.pred)} cy={y(p.obs)} r={Math.min(5, 1.5 + Math.sqrt(p.n) / 12)} fill="var(--accent)" />)}
        <text x={W / 2} y={H - 3} fontSize={8} textAnchor="middle" fill="var(--muted)">predicted %</text>
      </svg>
    </div>
  );
}
