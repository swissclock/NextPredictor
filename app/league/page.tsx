"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ErrorBox, Skeleton, Sparkline, TeamLogo, cx } from "@/components/ui";
import { useJson } from "@/lib/data";
import { ago, pct } from "@/lib/format";
import type { LeagueData, LeagueRow } from "@/lib/types";

const TABS = [
  { c: "ISR1", label: "Ligat HaAl" },
  { c: "EPL", label: "Premier League" },
  { c: "UCL", label: "Champions League" },
  { c: "UEL", label: "Europa League" },
  { c: "UECL", label: "Conference League" },
  { c: "NATIONS", label: "National teams" },
];

export default function LeaguePage() {
  return (
    <Suspense fallback={<Skeleton className="mt-6 h-96" />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const c = useSearchParams().get("c") ?? "ISR1";
  const router = useRouter();
  const { data, error } = useJson<LeagueData>(`league/${c}.json`);

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tables &amp; ratings</h1>
        <p className="mt-1 text-sm text-muted">
          Current standings plus {data?.simulated ? `${(data.simulated / 1000).toFixed(0)}k` : "Monte-Carlo"} simulated
          seasons from the live ratings.
        </p>
      </div>
      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button key={t.c} onClick={() => router.replace(`/league/?c=${t.c}`)}
            className={cx("whitespace-nowrap rounded-full border px-3 py-1 text-sm transition",
              c === t.c ? "border-ink bg-ink text-bg" : "border-line bg-panel text-muted hover:text-ink")}>{t.label}</button>
        ))}
      </div>
      {error ? <ErrorBox message={error} /> : !data ? <Skeleton className="h-96" /> :
        data.simulated ? <SimTable d={data} /> : <PowerTable d={data} />}
    </div>
  );
}

function heat(p?: number) {
  if (p === undefined || p < 0.005) return {};
  return { background: `color-mix(in srgb, var(--accent) ${Math.round(Math.min(1, p) * 70 + 8)}%, transparent)` };
}
function heatBad(p?: number) {
  if (p === undefined || p < 0.005) return {};
  return { background: `color-mix(in srgb, var(--bad) ${Math.round(Math.min(1, p) * 70 + 8)}%, transparent)` };
}

function SimTable({ d }: { d: LeagueData }) {
  const isr = d.comp === "ISR1";
  const cols = isr
    ? [["p_title", "Title"], ["p_europe", "Top 3"], ["p_top6", "Top 6"], ["p_relegation", "Relegated"]]
    : [["p_title", "Title"], ["p_top4", "Top 4"], ["p_top5", "Top 5"], ["p_relegation", "Relegated"]];
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="w-8 py-2.5 pl-4">#</th>
              <th className="py-2.5">Team</th>
              <th className="num text-center">P</th>
              <th className="num text-center">W-D-L</th>
              <th className="num text-center">GD</th>
              <th className="num text-center">Pts</th>
              <th className="num text-center" title="Expected final points">xPts</th>
              {cols.map(([, l]) => <th key={l} className="text-center">{l}</th>)}
              <th className="text-center">Finish</th>
              <th className="pr-4 text-center">Elo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {d.teams.map((t, i) => (
              <tr key={t.id} className="hover:bg-panel-2/50">
                <td className="num py-2 pl-4 text-muted">{i + 1}</td>
                <td className="py-2"><TeamCell t={t} /></td>
                <td className="num text-center text-muted">{t.pl}</td>
                <td className="num text-center text-muted">{t.w}-{t.d}-{t.l}</td>
                <td className="num text-center">{t.gd! > 0 ? "+" : ""}{t.gd}</td>
                <td className="num text-center font-semibold">{t.pts}</td>
                <td className="num text-center text-muted">{t.exp_pts?.toFixed(0)}</td>
                {cols.map(([k]) => {
                  const v = t[k as keyof LeagueRow] as number | undefined;
                  return (
                    <td key={k} className="px-1 text-center">
                      <span className="num inline-block min-w-12 rounded-md px-1.5 py-0.5 text-xs font-medium"
                        style={k === "p_relegation" ? heatBad(v) : heat(v)}>{v === undefined ? "–" : v < 0.005 ? "·" : pct(v)}</span>
                    </td>
                  );
                })}
                <td className="px-2"><PosDist dist={t.pos_dist} /></td>
                <td className="pr-4"><div className="flex items-center justify-center gap-2"><span className="num text-xs">{t.elo}</span><Sparkline values={t.elo_trend} width={48} height={16} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-2.5 text-[11px] text-faint">
        {d.remaining} fixtures left to simulate. {isr ? "Includes the championship/relegation split after round 26 (points carried over). " : ""}
        Updated {ago(d.generated_at)}.
      </p>
    </div>
  );
}

function PosDist({ dist }: { dist?: number[] }) {
  if (!dist) return null;
  const max = Math.max(...dist);
  return (
    <div className="flex h-5 items-end justify-center gap-px" title="Distribution of final position (1st → last)">
      {dist.map((p, i) => (
        <div key={i} className="w-1 rounded-sm bg-accent" style={{ height: `${Math.max(1, (p / max) * 20)}px`, opacity: p > 0 ? 0.35 + 0.65 * (p / max) : 0.1 }} />
      ))}
    </div>
  );
}

function TeamCell({ t }: { t: LeagueRow }) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamLogo src={t.logo} name={t.name} size={22} />
      <div className="min-w-0">
        <div className="truncate font-medium">{t.name}</div>
        {t.name_he && <div className="truncate text-[11px] text-faint" dir="rtl">{t.name_he}</div>}
      </div>
    </div>
  );
}

function PowerTable({ d }: { d: LeagueData }) {
  const rows = d.comp === "UEFA-NATIONS" ? d.teams : d.teams.filter((t) => t.rating !== undefined);
  const nat = d.kind === "nation";
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="w-8 py-2.5 pl-4">#</th>
              <th className="py-2.5">Team</th>
              <th className="text-center">Elo</th>
              {!nat && <th className="text-center" title="Goals scored vs an average entrant, 100 = average">Attack</th>}
              {!nat && <th className="text-center" title="100 = average, higher = concedes less">Defence</th>}
              <th className="pr-4 text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((t, i) => (
              <tr key={t.id} className="hover:bg-panel-2/50">
                <td className="num py-2 pl-4 text-muted">{i + 1}</td>
                <td className="py-2"><TeamCell t={t} /></td>
                <td className="num text-center font-semibold">{t.elo}</td>
                {!nat && <td className="num text-center">{t.att_idx ? Math.round(t.att_idx * 100) : "–"}</td>}
                {!nat && <td className="num text-center">{t.def_idx ? Math.round(100 / t.def_idx) : "–"}</td>}
                <td className="pr-4"><div className="flex justify-center"><Sparkline values={t.elo_trend} width={64} height={18} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-2.5 text-[11px] text-faint">
        {nat ? "European national teams ranked by Elo (all internationals since 1990)." :
          "This season's entrants ranked by combined attack/defence strength. Cross-league strength is calibrated through European results."}{" "}
        <Link href="/method/" className="underline">How ratings work</Link>
      </p>
    </div>
  );
}
