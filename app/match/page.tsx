"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  FactorsPanel, MarketsPanel, ModelBreakdown, NewsPanel, ScoreHeatmap, TeamPanel, ValuePanel, WhatIf,
} from "@/components/match-panels";
import { pickOf } from "@/components/match-row";
import { CompIcon, ConfidenceDot, ErrorBox, Pill, ProbBar, Section, Skeleton, TeamLogo, cx } from "@/components/ui";
import { useJson } from "@/lib/data";
import { kickoffTime, longDate, outcomeOf, pct, shortDate } from "@/lib/format";
import type { IndexData, MatchDetail } from "@/lib/types";

export default function MatchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MatchInner />
    </Suspense>
  );
}

function MatchInner() {
  const id = useSearchParams().get("id");
  const { data: d, error } = useJson<MatchDetail>(id ? `match/${id}.json` : null);
  const { data: index } = useJson<IndexData>("index.json");
  if (!id) return <ErrorBox message="No match selected." />;
  if (error) return <ErrorBox message={`This match isn't in the current prediction window (${error}).`} />;
  if (!d) return <Loading />;

  const comp = index?.comps[d.comp];
  const mk = d.prediction.markets;
  const done = d.status === "FT" && d.score;
  const pick = pickOf(d);
  const actual = outcomeOf(d.score);
  const weights = index?.weights[d.prediction.domain];
  const tie = d.prediction.tie;

  return (
    <div className="space-y-4 pt-1">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All matches</Link>

      {/* header */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel-2/50 px-4 py-2 text-xs text-muted sm:px-6">
          <span className="flex items-center gap-1.5"><CompIcon comp={d.comp} size={13} />{comp?.name ?? d.comp}{d.stage ? ` · ${d.stage}` : ""}{d.round && d.round !== d.stage ? ` · ${d.round}` : ""}</span>
          <span className="flex items-center gap-2">
            {d.venue && <span className="flex items-center gap-1"><MapPin size={12} />{d.venue}{d.neutral ? " (neutral)" : ""}</span>}
            <span>{longDate(d.kickoff)} · {kickoffTime(d.kickoff)}</span>
          </span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-6 sm:px-8">
          <TeamHead t={d.home} elo={d.home_team.elo} align="right" />
          <div className="text-center">
            {done && d.score ? (
              <div className="num text-4xl font-bold tracking-tight">{d.score[0]}<span className="mx-1 text-faint">–</span>{d.score[1]}</div>
            ) : (
              <div className="num text-3xl font-semibold text-muted">{d.top_score.replace("-", " – ")}</div>
            )}
            <div className="mt-1 text-[11px] uppercase tracking-wide text-faint">
              {done ? `FT · we said ${pick.text.toLowerCase()} ${d.top_score}` : `likely score · ${pick.text.toLowerCase()}`}
            </div>
          </div>
          <TeamHead t={d.away} elo={d.away_team.elo} align="left" />
        </div>
        <div className="px-4 pb-5 sm:px-8">
          <div className="mb-2 grid grid-cols-3 text-center">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className={cx("num text-2xl font-semibold", ["text-home", "text-draw", "text-away"][i])}>{pct(d.p[i])}</div>
                <div className="text-xs text-muted">{[`${d.home.short} win`, "Draw", `${d.away.short} win`][i]}
                  <span className="num ml-1 text-faint">({mk.fair_odds[i].toFixed(2)})</span></div>
              </div>
            ))}
          </div>
          <ProbBar p={d.p} height={10} highlight={done ? actual : undefined} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <Pill>xG {mk.lambda[0].toFixed(2)} – {mk.lambda[1].toFixed(2)}</Pill>
            <Pill>Over 2.5 {pct(mk.over["2.5"])}</Pill>
            <Pill>BTTS {pct(mk.btts)}</Pill>
            <Pill><ConfidenceDot level={d.prediction.confidence.label} /> {d.prediction.confidence.label} confidence</Pill>
            {d.prematch && <Pill tone="accent">pre-match prediction, locked at kickoff</Pill>}
          </div>
        </div>
      </div>

      {tie && tie.p_home_progress !== undefined && (
        <Section title={tie.leg === 2 ? "Second leg — who goes through?" : "First leg — tie outlook"}
          subtitle={tie.leg === 2 && tie.first_leg
            ? `First leg: ${d.away.short} ${tie.first_leg.hg}–${tie.first_leg.ag} ${d.home.short}. Includes extra time & penalties.`
            : "Simulates this leg plus the return leg with venues swapped, extra time and penalties."}>
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-home">{d.home.short} {pct(tie.p_home_progress)}</span>
            <span className="text-away">{pct(1 - tie.p_home_progress)} {d.away.short}</span>
          </div>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full">
            <div className="bg-home" style={{ width: `${tie.p_home_progress * 100}%` }} />
            <div className="flex-1 bg-away" />
          </div>
        </Section>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Section title="Score probabilities" subtitle="Chance of each exact final score, in %">
          <ScoreHeatmap matrix={mk.matrix} home={d.home.short} away={d.away.short} actual={done ? d.score : null} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {mk.top_scores.slice(0, 6).map((s) => (
              <span key={s.score} className="num rounded-md bg-panel-2 px-2 py-1 text-xs"><b>{s.score}</b> <span className="text-muted">{pct(s.p, 1)}</span></span>
            ))}
          </div>
          {mk.top_scores[0].score !== mk.pick_score && (
            <p className="mt-3 text-xs text-muted">
              {mk.top_scores[0].score} is the single most likely score, but the most likely result is{" "}
              {pick.i === 1 ? "a draw" : `a win for ${pick.i === 0 ? d.home.short : d.away.short}`}. A draw&apos;s chance sits in a few scores (0-0, 1-1, 2-2) while a win&apos;s is spread
              over many (1-0, 2-0, 2-1, 3-1…), so the score shown with the pick is the most likely score of that result.
            </p>
          )}
        </Section>
        <MarketsPanel mk={mk} home={d.home.short} away={d.away.short} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FactorsPanel d={d} />
        <ModelBreakdown d={d} weights={weights} />
      </div>

      <ValuePanel d={d} />
      {!done && <WhatIf d={d} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <TeamPanel t={d.home_team} side="home" />
        <TeamPanel t={d.away_team} side="away" />
      </div>

      {d.h2h.length > 0 && (
        <Section title="Head to head" subtitle="Most recent meetings in tracked competitions">
          <ul className="divide-y divide-line">
            {d.h2h.map((h, i) => {
              const homeIsHome = h.home_id === d.home.id;
              const [l, r] = homeIsHome ? [d.home.short, d.away.short] : [d.away.short, d.home.short];
              return (
                <li key={i} className="flex items-center gap-2 py-1.5 text-sm sm:gap-3">
                  {/* date and competition stacked on phones, so the team names keep the width */}
                  <span className="w-16 shrink-0 text-[11px] leading-tight text-faint sm:flex sm:w-32 sm:gap-2 sm:text-xs">
                    <span className="num block sm:w-20">{shortDate(h.date + "T12:00:00Z")} {h.date.slice(0, 4)}</span>
                    <span className="block">{h.comp}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-right leading-tight break-words sm:truncate">{l}</span>
                  <span className="num w-10 shrink-0 text-center font-semibold">{h.hg}–{h.ag}</span>
                  <span className="min-w-0 flex-1 leading-tight break-words sm:truncate">{r}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <NewsPanel news={d.news} home={d.home.short} away={d.away.short} />
    </div>
  );
}

function TeamHead({ t, elo, align }: { t: MatchDetail["home"]; elo: number; align: "left" | "right" }) {
  return (
    <div className={cx("flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:gap-3",
      align === "right" ? "sm:flex-row-reverse sm:text-right" : "sm:text-left")}>
      <TeamLogo src={t.logo} name={t.name} size={56} />
      <div className="min-w-0">
        <div className="text-base font-semibold leading-tight break-words sm:truncate sm:text-xl">{t.name}</div>
        {t.name_he && <div className="truncate text-xs text-muted" dir="rtl">{t.name_he}</div>}
        <div className="num text-xs text-faint">Elo {elo}</div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="space-y-4 pt-6">
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
    </div>
  );
}
