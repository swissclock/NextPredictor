# NextPredictor

**Football match predictions for Ligat HaAl, the Premier League, the Champions, Europa and Conference League, and
European national teams.**

### → [nextpredictor.vercel.app](https://nextpredictor.vercel.app)

For every match in the next few days the site gives the chance of a home win, a draw and an away win, the most likely
scores, and the team news behind the numbers. It updates three times a day, and every prediction is logged before
kickoff so the track record can be checked.

## What's on the site

- **Matches:** today and the next three days, each with a clear pick, the likely score and flags for injuries, short
  rest, long trips or weather.
- **Match pages:** the chance of every exact score, goals markets, the model against the bookmakers, team form,
  missing players, grouped news stories, and a what-if simulator for trying out your own team news.
- **Tables:** Ligat HaAl and Premier League seasons played out 20,000 times for title, Europe and relegation chances,
  plus power rankings for the European competitions and national teams.
- **Track record:** accuracy on matches the model had never seen, calibration, and the live record of every
  prediction made before kickoff.

## How good is it?

Tested on about 7,000 matches from July 2024 to September 2026 that played no part in tuning the model:

| | Model | Bookmakers | Guessing from base rates | Right result picked |
|---|---|---|---|---|
| Premier League | 0.2014 | 0.2013 | 0.2327 | 51.5% |
| Ligat HaAl | 0.2049 | – | 0.2347 | 51.3% |
| Champions League | 0.1936 | – | 0.2332 | 59.0% |
| National teams | 0.1646 | – | 0.2279 | ~60% |

The first three columns are the ranked probability score (lower is better), the standard measure for win/draw/loss
forecasts. In the Premier League the model matches the bookmakers' closing odds, which are very hard to beat.

## How it works

Several models each estimate how many goals both teams will score:

- **Team ratings:** an Elo rating for every club on one shared scale, so European results show how strong Israeli
  teams are compared with English ones. National teams have their own ratings.
- **Attack and defence:** a goals model gives every team an attack and a defence strength, with recent matches
  counting most. A second version also uses expected goals (xG).
- **Bookmakers:** for the Premier League, betting odds are turned into expected goals as well.

Their weighted blend gives the chance of every scoreline, and all probabilities on the site come from it. The weights
were tuned on earlier seasons by predicting them one week at a time, never using results from the future.

The blend is then adjusted for what happens around a match: missing players, short rest, long away trips, the
first-leg score of a two-legged tie, and heavy rain or wind. Team news comes from the official Fantasy Premier League
injury list and from 365Scores. Before a match's list is out, a language model running on our own machine reads
Hebrew and English sports news for injuries, suspensions and returns.

## Data

All free: [Sport5](https://www.sport5.co.il) (Ligat HaAl), [football-data.co.uk](https://www.football-data.co.uk)
(Premier League results and odds), [Fantasy Premier League](https://fantasy.premierleague.com) (Premier League team news),
[UEFA](https://www.uefa.com) (European competitions and national teams),
[martj42/international_results](https://github.com/martj42/international_results) (internationals since 1990),
[365Scores](https://www.365scores.com) (team news and lineups), [Open-Meteo](https://open-meteo.com) (weather),
and Israeli sports sites and Google News (headlines).

## Limitations

- These are probabilities, not certainties: a 60% favourite still fails to win 4 times in 10. Not betting advice.
- Team news lists appear in the days before a match; earlier than that, absences come from the press.
- Domestic cup matches are not included, so rest after a cup tie can be overstated.
- Newly promoted clubs start from an estimate until they have played a few games.

## This repository

This is the website's front end: a static [Next.js](https://nextjs.org) app. It reads the predictions from JSON files
that the prediction engine publishes with each update. The engine itself (data collection, models and backtests) is
not public, so on its own this repository builds a site without data.
