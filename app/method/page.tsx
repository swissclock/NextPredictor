import { Section } from "@/components/ui";

const SOURCES = [
  ["Ligat HaAl", "Sport5", "results since 2016/17, fixtures, Hebrew names"],
  ["Premier League", "football-data.co.uk", "results since 2005/06, shots, xG, bookmaker odds"],
  ["Premier League team news", "Fantasy Premier League", "official injury status and chance of playing"],
  ["Team news, all other matches", "365Scores", "missing and doubtful players, with the reason"],
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
          Several models each estimate how many goals both teams will score. Their blend, adjusted for injuries, rest and
          travel, gives the chance of every scoreline. The win, draw and loss probabilities and every other number on the
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
            For Premier League matches, bookmaker odds are turned into expected goals and weigh heavily, because they are
            hard to beat. The site also keeps an odds-free prediction and flags matches where the two disagree.
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
            starts (or, in the Premier League, his share of the team&apos;s chances). Absences come from the official injury
            list for the Premier League and from 365Scores&apos; team news elsewhere. Until a match&apos;s list is published,
            a language model running on our own machine reads the Hebrew and English news for injuries, suspensions and
            returns. The size of each effect was checked against two seasons of lineups (see Track record).</li>
          <li><b className="text-ink">Weather:</b> heavy rain or strong wind lowers the expected number of goals a little.</li>
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
          <li>These are probabilities, not certainties: a 60% favourite still fails to win 4 times in 10.</li>
        </ul>
      </Section>
    </div>
  );
}
