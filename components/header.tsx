"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle, cx } from "./ui";

const NAV = [
  { href: "/", label: "Matches", short: "Matches" },
  { href: "/league/", label: "Tables & ratings", short: "Tables" },
  { href: "/performance/", label: "Track record", short: "Record" },
  { href: "/method/", label: "How it works", short: "Method" },
];

export function Header() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/match") : path.startsWith(href));
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span className="hidden sm:inline">Next<span className="text-accent">Predictor</span></span>
        </Link>
        <nav className="scrollbar-none -mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={cx("whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition",
                active(n.href) ? "bg-panel-2 font-medium text-ink" : "text-muted hover:text-ink")}>
              <span className="hidden sm:inline">{n.label}</span><span className="sm:hidden">{n.short}</span>
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
      <path d="M5 15.5 9 11l3 3 7-7.5" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
