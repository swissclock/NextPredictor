/**
 * Browser port of pipeline/predictor/models/scoreline.py - used by the what-if simulator so adjustments
 * recompute every market instantly, with exactly the same maths as the pipeline.
 */
const MAX = 10;

function pmf(lam: number): number[] {
  const out: number[] = [];
  let p = Math.exp(-lam);
  for (let k = 0; k <= MAX; k++) {
    out.push(p);
    p = (p * lam) / (k + 1);
  }
  return out;
}

export function scoreMatrix(lh: number, la: number, rho: number): number[][] {
  const ph = pmf(lh);
  const pa = pmf(la);
  let r = Math.max(Math.min(rho, 0.25), -0.25);
  r = Math.max(Math.min(r, 0.9 / Math.max(lh, la, 1e-6)), -0.9 / Math.max(lh * la, 1e-6));
  const m = ph.map((x) => pa.map((y) => x * y));
  m[0][0] *= 1 - lh * la * r;
  m[0][1] *= 1 + lh * r;
  m[1][0] *= 1 + la * r;
  m[1][1] *= 1 - r;
  let s = 0;
  for (const row of m) for (const v of row) s += Math.max(v, 0);
  return m.map((row) => row.map((v) => Math.max(v, 0) / s));
}

export interface QuickMarkets {
  p: [number, number, number];
  over: Record<string, number>;
  btts: number;
  top: { score: string; p: number }[];
  matrix: number[][];
  cs: [number, number];
}

export function quickMarkets(lh: number, la: number, rho: number): QuickMarkets {
  const m = scoreMatrix(lh, la, rho);
  let ph = 0, pd = 0, pa = 0, btts = 0, csH = 0, csA = 0;
  const over: Record<string, number> = { "1.5": 0, "2.5": 0, "3.5": 0 };
  const flat: { score: string; p: number }[] = [];
  for (let i = 0; i <= MAX; i++) {
    for (let j = 0; j <= MAX; j++) {
      const v = m[i][j];
      if (i > j) ph += v; else if (i === j) pd += v; else pa += v;
      if (i > 0 && j > 0) btts += v;
      if (j === 0) csH += v;
      if (i === 0) csA += v;
      for (const t of [1.5, 2.5, 3.5]) if (i + j > t) over[String(t)] += v;
      if (i < 7 && j < 7) flat.push({ score: `${i}-${j}`, p: v });
    }
  }
  flat.sort((a, b) => b.p - a.p);
  return { p: [ph, pd, pa], over, btts, top: flat.slice(0, 6), matrix: m.slice(0, 7).map((r) => r.slice(0, 7)), cs: [csH, csA] };
}
