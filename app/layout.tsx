import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextPredictor",
  description: "Probabilistic football predictions for Ligat HaAl, the Premier League, European cups and national teams.",
};

// set the theme before first paint (stored choice, else system preference)
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-faint sm:px-6">
          Probabilities, not promises. Built on free data: Sport5, football-data.co.uk, UEFA, FPL, martj42 international
          results, 365Scores, Open-Meteo &amp; Google News.
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
