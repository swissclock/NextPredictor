"use client";

import Link from "next/link";
import { Check, CloudRain, Coins, HeartPulse, Plane, Timer, X } from "lucide-react";
import { kickoffTime, outcomeOf, pct } from "@/lib/format";
import type { Flag, MatchCard } from "@/lib/types";
import { ConfidenceDot, ProbBar, TeamLogo, cx } from "./ui";

function FlagIcon({ f }: { f: Flag }) {
  const common = "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-medium";
  switch (f.type) {
    case "absences":
      return <span className={cx(common, "bg-bad/10 text-bad")} title={`${f.n} key absence(s) – ${f.side}`}><HeartPulse size={11} />{f.n}</span>;
    case "short_rest":
      return <span className={cx(common, "bg-warn/10 text-warn")} title={`${f.side} team: ${f.days} days rest`}><Timer size={11} />{f.days}d</span>;
    case "travel":
      return <span className={cx(common, "bg-panel-2 text-muted")} title={`${f.km} km away trip`}><Plane size={11} /></span>;
    case "weather":
      return <span className={cx(common, "bg-panel-2 text-muted")} title="Weather affects scoring"><CloudRain size={11} /></span>;
    case "value":
      return <span className={cx(common, "bg-good/10 text-good")} title={`Model sees +${((f.edge ?? 0) * 100).toFixed(0)}% edge vs bookmaker`}><Coins size={11} /></span>;
  }
}

/** The model's pick is simply its most likely outcome; name it in words so nobody has to read it off the bar. */
export function pickOf(m: MatchCard) {
  const i = m.p.indexOf(Math.max(...m.p));
  const text = i === 1 ? "Draw" : `${(i === 0 ? m.home : m.away).short} win`;
  return { i, text, p: m.p[i], tone: ["text-home", "text-draw", "text-away"][i] };
}

export function MatchRow({ m }: { m: MatchCard }) {
  const done = m.status === "FT" && m.score;
  const live = m.status === "LIVE";
  const actual = outcomeOf(m.score);
  const pick = pickOf(m);
  const hit = done ? pick.i === actual : null;
  const exact = done && m.score ? m.top_score === `${m.score[0]}-${m.score[1]}` : false;
  const tieP = m.tie?.p_home_progress;

  return (
    <Link href={`/match/?id=${m.sid}`}
      className="group grid grid-cols-[52px_1fr] items-center gap-x-3 gap-y-2 px-3 py-3 transition hover:bg-panel-2/60 sm:grid-cols-[56px_1fr_190px_170px] sm:px-4">
      {/* time / status */}
      <div className="row-span-3 flex flex-col items-center justify-center text-center sm:row-span-1">
        {live ? (
          <span className="rounded bg-bad px-1.5 py-0.5 text-[10px] font-bold text-white">LIVE</span>
        ) : done ? (
          <span className="text-[11px] font-semibold text-muted" title="Full time">FT</span>
        ) : (
          <span className="num text-sm font-medium">{kickoffTime(m.kickoff)}</span>
        )}
      </div>

      {/* teams, with the real score once the match is over */}
      <div className="min-w-0 space-y-1.5">
        {([["home", 0], ["away", 1]] as const).map(([side, i]) => {
          const t = m[side];
          const won = done && m.score && (i === 0 ? m.score[0] > m.score[1] : m.score[1] > m.score[0]);
          return (
            <div key={side} className="flex items-center gap-2.5">
              <TeamLogo src={t.logo} name={t.name} size={22} />
              <span className={cx("truncate text-[15px]", won ? "font-semibold" : "font-medium", done && !won && "text-muted")}>
                {t.name}
              </span>
              {t.name_he && <span className="hidden truncate text-xs text-faint md:inline" dir="rtl">{t.name_he}</span>}
              {done && m.score && (
                <span className={cx("num ml-auto w-5 text-right text-[15px]", won ? "font-bold" : "font-semibold text-muted")}>{m.score[i]}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* chances: the pick's segment is drawn solid, the other two faded */}
      <div className="col-start-2 sm:col-start-auto">
        <ProbBar p={m.p} height={7} highlight={pick.i} />
        <div className="mt-1 flex justify-between text-[11px] num">
          <span className={cx("text-home", pick.i === 0 && "font-semibold")}>{pct(m.p[0])}</span>
          <span className={cx("text-draw", pick.i === 1 && "font-semibold")}>{pct(m.p[1])} draw</span>
          <span className={cx("text-away", pick.i === 2 && "font-semibold")}>{pct(m.p[2])}</span>
        </div>
        {tieP !== undefined && (
          <div className="mt-1 text-[11px] text-muted">
            To progress: <span className="num font-semibold text-ink">{pct(tieP)}</span> / <span className="num">{pct(1 - tieP)}</span>
          </div>
        )}
      </div>

      {/* the prediction in words, and how it went */}
      <div className="col-start-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs sm:col-start-auto sm:flex-col sm:items-end sm:justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-faint">Pick</span>
          <span className={cx("font-semibold", pick.tone)}>{pick.text}</span>
          {hit !== null && (
            <span className={cx("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              hit ? "bg-good/15 text-good" : "bg-bad/10 text-bad")}>
              {hit ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}{hit ? "right" : "wrong"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted">
          <span title="Most likely exact score">
            {done ? "Predicted" : "Likely score"} <b className="num text-ink">{m.top_score}</b>
            {exact && <span className="ml-1 font-semibold text-good">exact</span>}
          </span>
          <span title="Probability of over 2.5 goals">O2.5 <b className="num text-ink">{pct(m.over25)}</b></span>
        </div>
        <div className="flex items-center gap-1.5">
          {m.flags.map((f, i) => <FlagIcon key={i} f={f} />)}
          <ConfidenceDot level={m.confidence} />
        </div>
      </div>
    </Link>
  );
}
