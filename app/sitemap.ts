import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import type { IndexData } from "@/lib/types";

// Built with the site (static export), so the match pages listed are the ones in the current four-day window; the
// scheduled job rebuilds after every update.
export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nextpredictor.vercel.app";
const TABLES = ["ISR1", "EPL", "UCL", "UEL", "UECL", "NATIONS"];

function readIndex(): IndexData | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "index.json"), "utf8"));
  } catch {
    return null;  // no pipeline data (e.g. the public front-end repo): list the fixed pages only
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const index = readIndex();
  const updated = index?.generated_at ? new Date(index.generated_at) : new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: updated, changeFrequency: "hourly", priority: 1 },
    ...TABLES.map((c) => ({ url: `${SITE}/league/?c=${c}`, lastModified: updated, changeFrequency: "daily" as const, priority: 0.7 })),
    { url: `${SITE}/performance/`, lastModified: updated, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE}/method/`, changeFrequency: "monthly", priority: 0.4 },
  ];
  const matches = (index?.days ?? []).flatMap((d) => d.matches).map((m) => ({
    url: `${SITE}/match/?id=${m.sid}`, lastModified: updated, changeFrequency: "hourly" as const, priority: 0.8,
  }));
  return [...pages, ...matches];
}
