import { Section } from "@/components/ui";

const SOURCES = [
  ["Ligat HaAl", "Sport5", "results since 2016/17, fixtures, Hebrew names"],
  ["Premier League", "football-data.co.uk", "results since 2005/06, shots, xG, bookmaker odds"],
  ["Premier League team news", "Fantasy Premier League", "official injury status and chance of playing"],
  ["Team news, all other matches", "365Scores", "missing and doubtful players, with the reason"],
  ["Bookmaker odds, every match", "365Scores", "Bet365 and Winner win/draw/loss prices, opening and latest, since 2024/25"],
  ["Champions, Europa & Conference League", "UEFA", "results since 2015/16, including qualifiers"],
  ["National teams", "UEFA and an open archive of internationals", "every men's international since 1990"],
  ["Weather", "Open-Meteo", "forecast at kickoff"],
  ["News", "Israeli sports sites and Google News", "Hebrew and English headlines"],
];

export default function Method() {
  return (
    <div className="space-y-4 pt-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">How it works</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Several models each estimate how many goals both teams will score: team ratings, an attack and defence model,
          and the bookmakers&apos; prices. Their blend, adjusted for injuries, rest and travel, gives the chance of every
          scoreline. The win, draw and loss probabilities and every other number on the
          site come from those scoreline chances.
        </p>
      </div>

      <Section title="Data">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <tbody className="divide-y divide-line">
              {SOURCES.map(([a, b, c]) => (
                <tr key={a}><td className="py-2 pr-3 font-medium">{a}</td><td className="pr-3 text-muted">{b}</td><td className="text-xs text-faint">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Team ratings">
          <p className="text-sm text-muted">
            An Elo rating for every club, updated after each match. All clubs are rated on one scale, so European results
            show how strong Israeli teams are compared with English ones. National teams have their own ratings.
          </p>
        </Section>
        <Section title="Attack and defence">
          <p className="text-sm text-muted">
            A goals model gives each team an attack and a defence strength, with recent matches counting most. Teams with
            few games lean on their league&apos;s average until the evidence builds up. A second version also uses
            expected goals (xG), which is steadier than goals alone.
          </p>
        </Section>
        <Section title="Betting market">
          <p className="text-sm text-muted">
            Bookmaker odds are turned into expected goals and join the blend, because in club football they are more
            accurate than any of our own models. Each match page shows Bet365&apos;s and Winner&apos;s prices next to ours.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li><b className="text-ink">Premier League:</b> closing odds from football-data.co.uk carry the prediction.</li>
            <li><b className="text-ink">Ligat HaAl and European cups:</b> Bet365&apos;s odds (Winner&apos;s when Bet365 has none) weigh
              80%, our expected-goals model 20%.</li>
            <li><b className="text-ink">National teams:</b> the odds weigh only 10%; here our models hold their own.</li>
          </ul>
          <p className="mt-2 text-sm text-muted">
            The site always keeps an odds-free prediction too (&ldquo;Our model&rdquo; on each match page), and the Track
            record page follows how it does against both bookmakers.
          </p>
        </Section>
        <Section title="Tested before it is trusted">
          <p className="text-sm text-muted">
            The blend was tuned on past seasons as if predicting them live, one week at a time, never using later results.
            Its accuracy is then measured on a separate, later period. The Track record page shows those results and every
            prediction made before kickoff since.
          </p>
        </Section>
      </div>

      <Section title="What adjusts a prediction">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li><b className="text-ink">Rest and travel:</b> short turnarounds and long away trips, where past results show a real effect.</li>
          <li><b className="text-ink">Two-legged ties:</b> the first-leg score changes how both teams approach the second leg.</li>
          <li><b className="text-ink">Missing players:</b> each absence counts in proportion to how often the player
            starts (or, in the Premier League, the player&apos;s share of the team&apos;s chances). Absences come from the official injury
            list for the Premier League and from 365Scores&apos; team news elsewhere. Until a match&apos;s list is published,
            a language model running on our own machine reads the Hebrew and English news for injuries, suspensions and
            returns. The size of each effect was checked against two seasons of lineups (see Track record).</li>
          <li><b className="text-ink">Weather:</b> heavy rain or strong wind lowers the expected number of goals a little.</li>
        </ul>
      </Section>

      <Section title="Tested and left out" subtitle="Ideas we checked against past results that did not make predictions better">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li><b className="text-ink">Referees (Ligat HaAl, two seasons):</b> referees really differ in how many yellow and red cards
            they give, but not in penalties, goals or home bias beyond chance, and adding them did not improve predictions.</li>
          <li><b className="text-ink">Calling more draws:</b> picking a draw whenever it is close to the favourite, or whenever 1-1 is the
            single likeliest score, lowered accuracy. A draw is rarely the likeliest result even though one game in four
            ends level, because a win can come from many scores and a draw from only a few.</li>
          <li><b className="text-ink">League-specific scoreline weights:</b> boosting scores like 0-0 or 1-1 by how often each league
            produced them made no difference; the differences between leagues were mostly chance.</li>
          <li><b className="text-ink">Betting against Winner:</b> backing the results our odds-free model rated above Winner&apos;s
            price lost money in every competition, roughly as much as Winner&apos;s 11–18% margin.</li>
        </ul>
      </Section>

      <Section title="Season and tie simulations">
        <p className="text-sm text-muted">
          The rest of each league season is played out 20,000 times to estimate title, Europe and relegation chances,
          including Ligat HaAl&apos;s split into top and bottom groups. Two-legged European ties are simulated through
          extra time and penalties.
        </p>
      </Section>

      <Section title="Limitations">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>Team news lists are published in the days before a match; earlier than that, absences come from the press.</li>
          <li>Domestic cup matches are not included, so rest after a cup tie can be overstated.</li>
          <li>Newly promoted clubs start from an estimate until they have played a few games.</li>
          <li>Bookmaker odds for matches before the 2024/25 season are not available outside the Premier League, so the
            weight given to them was tuned on two seasons only.</li>
          <li>These are probabilities, not certainties: a 60% favourite still fails to win 4 times in 10.</li>
        </ul>
      </Section>
    </div>
  );
}
