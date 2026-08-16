"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/seasons", label: "Seasons" },
  { href: "/managers", label: "Managers" },
  { href: "/records", label: "Records" },
  { href: "/rivalries", label: "Rivalries" },
  { href: "/newsletters", label: "Newsletters" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/rules", label: "Rules" },
  { href: "/predictions", label: "Predictions" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-rule bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="group">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold-muted">Official Archive</p>
          <p className="font-serif text-xl text-forest md:text-2xl">No Punt Intended</p>
        </Link>
        <button
          type="button"
          className="border border-forest/20 px-3 py-1 text-xs uppercase tracking-widest md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav className="hidden items-center gap-5 md:flex">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] uppercase tracking-[0.16em] ${
                  active ? "text-forest border-b border-gold pb-0.5" : "text-ink/70 hover:text-forest"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            className={`text-[11px] uppercase tracking-[0.16em] ${
              pathname.startsWith("/admin") ? "text-forest border-b border-gold pb-0.5" : "text-gold-muted hover:text-forest"
            }`}
          >
            Admin
          </Link>
        </nav>
      </div>
      {open ? (
        <nav className="grid gap-2 border-t border-rule px-4 py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-1 text-sm uppercase tracking-[0.14em] text-forest"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/admin" onClick={() => setOpen(false)} className="py-1 text-sm uppercase tracking-[0.14em] text-gold-muted">
            Admin
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
