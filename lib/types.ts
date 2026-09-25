export type Triple = [number, number, number];

export interface CompMeta {
  name: string;
  short: string;
  kind: "club" | "nation";
  order: number;
}

export interface TeamRef {
  id: string;
  name: string;
  short: string;
  logo?: string | null;
  name_he?: string | null;
}

export interface Flag {
  type: "absences" | "short_rest" | "travel" | "weather" | "value";
  side?: "home" | "away";
  n?: number;
  days?: number;
  km?: number;
  edge?: number;
}

export interface Tie {
  leg: 1 | 2;
  first_leg?: { hg: number; ag: number };
  agg_home_lead?: number;
  p_home_progress?: number;
}

export interface MatchCard {
  id: string;
  sid: string;
  comp: string;
  stage?: string | null;
  round?: string | null;
  kickoff: string;
  date: string;
  status: "FT" | "NS" | "LIVE" | "PST";
  score: [number, number] | null;
  home: TeamRef;
  away: TeamRef;
  venue?: string | null;
  neutral: boolean;
  p: Triple;
  lambda: [number, number];
  top_score: string;
  over25: number;
  btts: number;
  confidence: "high" | "medium" | "low";
  flags: Flag[];
  tie?: Tie | null;
  prematch?: boolean;
}

export interface DayBlock {
  date: string;
  label?: string | null;
  matches: MatchCard[];
}

export interface IndexData {
  generated_at: string;
  ingested_at?: string;
  timezone: string;
  comps: Record<string, CompMeta>;
  days: DayBlock[];
  next_by_comp: Record<string, string>;
  model: string;
  weights: Record<string, Record<string, number>>;
  half_life: Record<string, number>;
}

export interface Markets {
  lambda: [number, number];
  p: Triple;
  fair_odds: Triple;
  double_chance: Record<"1X" | "12" | "X2", number>;
  draw_no_bet: [number, number];
  over: Record<string, number>;
  btts: number;
  clean_sheet: [number, number];
  win_to_nil: [number, number];
  asian_handicap: Record<string, { win: number; push: number; lose: number }>;
  team_goals_over: { home: Record<string, number>; away: Record<string, number> };
  margin: Record<string, number>;
  top_scores: { score: string; p: number }[];
  /** most likely score within the most likely result (what the site shows next to the pick) */
  pick_score: string;
  matrix: number[][];
}

export interface Factor {
  factor: string;
  label: string;
  side: "home" | "away" | "both";
  mult: number;
  kind: "learned" | "prior";
  detail?: string | null;
}

export interface Absence {
  player: string;
  status: string;
  chance: number | null;
  role: string;
  importance: number;
  note?: string;
  source?: string;
  /** share of recent matches the player started (365Scores lineups) */
  start_share?: number | null;
  /** his own effect: multiplier on his team's goals ('own') or on the opponent's ('opp') */
  mult?: number;
  target?: "own" | "opp";
  how?: "learned" | "prior";
}

export interface FormItem {
  date: string;
  comp: string;
  home: boolean;
  opp: string;
  opp_id: string;
  gf: number;
  ga: number;
  res: "W" | "D" | "L";
}

export interface TeamBlock {
  id: string;
  name: string;
  short: string;
  name_he?: string | null;
  logo?: string | null;
  color?: string | null;
  country?: string | null;
  elo: number;
  elo_trend: number[];
  attack: number | null;
  defence: number | null;
  form: FormItem[];
  absences: Absence[];
  events?: ClubEvent[];
}

export interface ClubEvent {
  type: string;
  summary: string;
  source?: string;
  outlets?: string[];
  at?: string;
  link?: string | null;
}

/** What the news model says an article (or a story of several) reports. */
export type NewsLabel =
  | "out_injured" | "suspended" | "doubtful" | "returning" | "left_club"
  | "manager_change" | "crisis" | "squad_news";

export interface NewsItem {
  title: string;
  lede?: string | null;
  link: string | null;
  source?: string;
  score?: number;
  players?: string[];
  published?: string;
  publisher?: string;
  tags?: string | null;
  /** set on story cards: one subject + one label, across outlets */
  label?: NewsLabel;
  player?: string | null;
  conf?: number;
  outlets?: string[];
  articles?: { title: string; link: string | null; publisher: string; published: string }[];
}

export interface Prediction {
  markets: Markets;
  breakdown: Record<string, { lambda: [number, number]; p: Triple }>;
  factors: Factor[];
  features: {
    rest_h: number | null;
    rest_a: number | null;
    travel_km: number;
    lead_h: number;
  };
  weather?: { temp: number; precip: number; wind: number; code: number } | null;
  confidence: { score: number; label: string; model_spread: number; data_matches: number };
  tie?: Tie | null;
  value?: { odds: Triple; edge: Triple; implied: Triple; model_p: Triple; odds_o25?: [number, number] } | null;
  rho: number;
  domain: string;
  base_lambda: [number, number];
}

export interface MatchDetail extends MatchCard {
  prediction: Prediction;
  home_team: TeamBlock;
  away_team: TeamBlock;
  h2h: { date: string; comp: string; home_id: string; hg: number; ag: number }[];
  news: { home: NewsItem[]; away: NewsItem[] };
  generated_at: string;
}

export interface LeagueRow {
  id: string;
  name: string;
  short?: string;
  logo?: string | null;
  name_he?: string | null;
  elo: number;
  elo_trend: number[];
  att_idx?: number;
  def_idx?: number;
  rating?: number;
  exp_pts?: number;
  p_title?: number;
  p_top4?: number;
  p_top5?: number;
  p_top6?: number;
  p_europe?: number;
  p_relegation?: number;
  pos_dist?: number[];
  pts?: number;
  gd?: number;
  gf?: number;
  ga?: number;
  pl?: number;
  w?: number;
  d?: number;
  l?: number;
}

export interface LeagueData {
  comp: string;
  name: string;
  kind: string;
  teams: LeagueRow[];
  simulated?: number;
  remaining?: number;
  generated_at: string;
}

export interface Metric {
  n: number;
  rps: number;
  logloss: number;
  brier?: number;
  accuracy?: number;
}

export interface PerformanceData {
  generated_at?: string;
  domains: Record<string, Record<string, Metric | unknown> & {
    ensemble: Metric;
    base_rate: Metric;
    calibration: { bin: number; pred: number; obs: number; n: number }[];
    weights: Record<string, number>;
  }>;
  comps: Record<string, { ensemble: Metric; base_rate: Metric; market?: Metric; period: [string, string] }>;
  context?: Record<string, Record<string, { coef: number; se: number; n: number; applied?: boolean }>>;
  /** learned absence effects per domain; `_n_matches` = matches with 365Scores lineups used */
  absence?: Record<string, Record<string, unknown>>;
  half_life?: Record<string, number>;
  live: {
    n: number;
    accuracy: number | null;
    rps: number | null;
    recent: {
      id: string; kickoff: string; comp: string; home: string; away: string; score: [number, number];
      p: Triple; hit: number; rps: number; top_score: string; exact: boolean;
    }[];
  };
}
