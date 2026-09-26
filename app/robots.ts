import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nextpredictor.vercel.app";

export default function robots(): MetadataRoute.Robots {
  // everything allowed, including /data: the pages render from that JSON, so crawlers need it to see the content
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE}/sitemap.xml`, host: SITE };
}
