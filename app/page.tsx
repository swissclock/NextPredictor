"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Flame, Scale, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { MatchRow } from "@/components/match-row";
import { CompIcon, ConfidenceDot, ErrorBox, Pill, Skeleton, TeamLogo, cx, useStoredPref } from "@/components/ui";
import { useJson } from "@/lib/data";
import { ago, dayLabel, longDate, pct } from "@/lib/format";
import type { IndexData, MatchCard } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "ISR1", label: "Ligat HaAl" },
  { key: "EPL", label: "Premier League" },
  { key: "UEFA", label: "European cups" },
  { key: "NAT", label: "National teams" },
];

function inFilter(m: MatchCard, f: string, comps: IndexData["comps"]) {
  if (f === "all") return true;
  if (f === "UEFA") return ["UCL", "UEL", "UECL"].includes(m.comp);
  if (f === "NAT") return comps[m.comp]?.kind === "nation";
  return m.comp === f;
}

export default function Home() {
  const { data, error, loading } = useJson<IndexData>("index.json");
  const [day, setDay] = useState<string | null>(null);
  const [filter, pickFilter] = useStoredPref("filter", "all");

  const days = data?.days ?? [];
  const today = days.find((d) => d.label === "Today")?.date ?? days[1]?.date;
  const selected = day ?? today ?? null;
  const block = days.find((d) => d.date === selected);
  const matches = useMemo(
    () => (block?.matches ?? []).filter((m) => data && inFilter(m, filter, data.comps)),
    [block, filter, data],
  );

  if (error) return <ErrorBox message={error} />;
  if (loading || !data) return <LoadingState />;

  const groups = groupByComp(matches, data.comps);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2 pt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {selected ? longDate(`${selected}T12:00:00Z`) : "Fixtures"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Ligat HaAl · Premier League · Champions, Europa &amp; Conference League · European national teams
          </p>
        </div>
        <p className="text-xs text-faint">Updated {ago(data.generated_at)} · times in Israel</p>
      </div>

      {/* date strip */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {days.map((d) => {
          const { top, bottom } = dayLabel(d.date, d.label);
          const n = d.matches.filter((m) => inFilter(m, filter, data.comps)).length;
          const on = d.date === selected;
          return (
            <button key={d.date} onClick={() => setDay(d.date)}
              className={cx("min-w-[92px] flex-1 rounded-xl border px-3 py-2 text-left transition sm:min-w-[110px]",
                on ? "border-accent bg-accent-soft" : "border-line bg-panel hover:border-faint")}>
              <div className={cx("text-sm font-semibold", on && "text-accent")}>{top}</div>
              <div className="text-[11px] text-muted">{bottom}</div>
              <div className="mt-1 text-[11px] font-medium text-muted num">{n ? `${n} match${n > 1 ? "es" : ""}` : "—"}</div>
            </button>
          );
        })}
      </div>

      {/* league filter */}
      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => pickFilter(f.key)}
            className={cx("whitespace-nowrap rounded-full border px-3 py-1 text-sm transition",
              filter === f.key ? "border-ink bg-ink text-bg" : "border-line bg-panel text-muted hover:text-ink")}>
            {f.label}
          </button>
        ))}
      </div>

      {matches.length > 0 && <Insights matches={matches} />}

      {groups.length === 0 ? (
        <EmptyDay data={data} filter={filter} />
      ) : (
        <div className="space-y-4">
          {groups.map(([comp, ms]) => {
            const meta = data.comps[comp];
            const stage = ms[0].stage || ms[0].round;
            return (
              <section key={comp} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-line bg-panel-2/50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <CompIcon comp={comp} />
                    <h2 className="text-sm font-semibold">{meta?.name ?? comp}</h2>
                    {stage && <span className="text-xs text-muted">· {stage}</span>}
                  </div>
                  {["EPL", "ISR1", "UCL", "UEL", "UECL"].includes(comp) && (
                    <Link href={`/league/?c=${comp}`} className="text-xs text-muted hover:text-accent">Table →</Link>
                  )}
                </div>
                <div className="divide-y divide-line">
                  {ms.map((m) => <MatchRow key={m.id} m={m} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Legend />
    </div>
  );
}

function groupByComp(ms: MatchCard[], comps: IndexData["comps"]) {
  const g = new Map<string, MatchCard[]>();
  for (const m of ms) g.set(m.comp, [...(g.get(m.comp) ?? []), m]);
  return [...g.entries()].sort((a, b) => (comps[a[0]]?.order ?? 99) - (comps[b[0]]?.order ?? 99));
}

function Insights({ matches }: { matches: MatchCard[] }) {
  const open = matches.filter((m) => m.status !== "FT");
  const pool = open.length ? open : matches;
  if (pool.length < 2) return null;
  const maxP = (m: MatchCard) => Math.max(m.p[0], m.p[2]);
  const banker = [...pool].sort((a, b) => maxP(b) - maxP(a))[0];
  const upset = [...pool]
    .filter((m) => maxP(m) > 0.5)
    .sort((a, b) => Math.min(b.p[0], b.p[2]) - Math.min(a.p[0], a.p[2]))[0];
  const goals = [...pool].sort((a, b) => b.lambda[0] + b.lambda[1] - (a.lambda[0] + a.lambda[1]))[0];
  const coin = [...pool].sort((a, b) => Math.abs(a.p[0] - a.p[2]) - Math.abs(b.p[0] - b.p[2]))[0];
  const value = pool.find((m) => m.flags.some((f) => f.type === "value"));
  const items = [
    { icon: ShieldCheck, label: "Strongest favourite", m: banker,
      text: `${banker.p[0] >= banker.p[2] ? banker.home.short : banker.away.short} ${pct(maxP(banker))}` },
    upset && upset.id !== banker.id && { icon: Flame, label: "Upset watch", m: upset,
      text: `${upset.p[0] < upset.p[2] ? upset.home.short : upset.away.short} ${pct(Math.min(upset.p[0], upset.p[2]))}` },
    { icon: TrendingUp, label: "Most goals expected", m: goals, text: `${(goals.lambda[0] + goals.lambda[1]).toFixed(1)} xG · O2.5 ${pct(goals.over25)}` },
    { icon: Scale, label: "Coin flip", m: coin, text: `${pct(coin.p[0])} · ${pct(coin.p[1])} · ${pct(coin.p[2])}` },
    value && { icon: Sparkles, label: "Model vs market", m: value, text: "edge vs bookmaker" },
  ].filter(Boolean) as { icon: typeof Flame; label: string; m: MatchCard; text: string }[];

  return (
    <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
      {items.slice(0, 4).map(({ icon: Icon, label, m, text }) => (
        <Link key={label} href={`/match/?id=${m.sid}`} className="card min-w-[220px] p-3 transition hover:border-faint">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            <Icon size={13} className="text-accent" /> {label}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm font-medium">
            <TeamLogo src={m.home.logo} name={m.home.name} size={18} />
            <span className="truncate">{m.home.short}</span>
            <span className="text-faint">v</span>
            <span className="truncate">{m.away.short}</span>
            <TeamLogo src={m.away.logo} name={m.away.name} size={18} />
          </div>
          <div className="num mt-1 text-xs text-muted">{text}</div>
        </Link>
      ))}
    </div>
  );
}

function EmptyDay({ data, filter }: { data: IndexData; filter: string }) {
  const next = Object.entries(data.next_by_comp)
    .filter(([c]) => filter === "all" || (filter === "UEFA" ? ["UCL", "UEL", "UECL"].includes(c)
      : filter === "NAT" ? data.comps[c]?.kind === "nation" : c === filter))
    .sort((a, b) => a[1].localeCompare(b[1]));
  return (
    <div className="card p-8 text-center">
      <p className="font-medium">No tracked fixtures on this day</p>
      {next.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {next.slice(0, 6).map(([c, k]) => (
            <Pill key={c}><CompIcon comp={c} size={12} /> {data.comps[c]?.short ?? c}: next {new Date(k).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Jerusalem" })}</Pill>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-faint">
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-home" /> home win</span>
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-draw" /> draw</span>
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-away" /> away win</span>
      <span>Pick = the most likely of the three (solid segment)</span>
      <span className="flex items-center gap-1"><ConfidenceDot level="high" /> model confidence</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 pt-2">
      <Skeleton className="h-9 w-72" />
      <div className="flex gap-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 flex-1" />)}</div>
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
    </div>
  );
}
