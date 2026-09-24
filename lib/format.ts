export const TZ = "Asia/Jerusalem";

export function pct(p: number | null | undefined, digits = 0) {
  if (p === null || p === undefined || Number.isNaN(p)) return "–";
  return `${(p * 100).toFixed(digits)}%`;
}

export function kickoffTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

export function dayLabel(date: string, label?: string | null) {
  const d = new Date(`${date}T12:00:00Z`);
  const wd = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const dm = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return { top: label ?? wd, bottom: label ? `${wd} ${dm}` : dm };
}

export function longDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long",
  });
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, day: "numeric", month: "short" });
}

export function ago(iso?: string | null) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export function outcomeOf(score: [number, number] | null) {
  if (!score) return null;
  return score[0] > score[1] ? 0 : score[0] === score[1] ? 1 : 2;
}

export function signedPct(m: number) {
  const v = (m - 1) * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}
