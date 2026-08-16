import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "No Punt Intended | League Archive",
    template: "%s | No Punt Intended",
  },
  description:
    "The official digital archive of No Punt Intended — championships, managers, records, and league history.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${newsreader.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-cream font-sans text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-rule px-4 py-6 text-center text-xs uppercase tracking-[0.18em] text-ink/50">
          No Punt Intended · Official League Archive · Data from ESPN Fantasy
        </footer>
      </body>
    </html>
  );
}
