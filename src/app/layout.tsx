import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { SiteBanner } from "@/components/SiteBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getEditorialFile } from "@/lib/archive";
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
  const editorial = getEditorialFile();
  return (
    <html lang="en" className={`${newsreader.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-cream font-sans text-ink">
        <SiteBanner initial={editorial} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
