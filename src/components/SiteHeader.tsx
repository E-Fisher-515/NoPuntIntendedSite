"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Child = { href: string; label: string };
type Group = { label: string; href: string; children?: Child[] };

const groups: Group[] = [
  { label: "Home", href: "/" },
  {
    label: "History",
    href: "/history",
    children: [
      { href: "/history", label: "Timeline" },
      { href: "/seasons", label: "Seasons" },
      { href: "/records", label: "Records" },
    ],
  },
  {
    label: "Managers",
    href: "/managers",
    children: [
      { href: "/managers", label: "Directory" },
      { href: "/rivalries", label: "Rivalries" },
      { href: "/hall-of-fame", label: "Hall of Fame" },
    ],
  },
  {
    label: "League",
    href: "/newsletters",
    children: [
      { href: "/newsletters", label: "Newsletters" },
      { href: "/rules", label: "Rules" },
      { href: "/predictions", label: "Predictions" },
    ],
  },
];

function groupActive(pathname: string, group: Group): boolean {
  if (group.href === "/") return pathname === "/";
  const targets = [group.href, ...(group.children?.map((child) => child.href) ?? [])];
  return targets.some((href) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) || pathname.startsWith(href));
}

function childActive(pathname: string, href: string): boolean {
  if (href === "/history") return pathname === "/history" || pathname === "/history/";
  if (href === "/managers") return pathname === "/managers" || pathname === "/managers/" || pathname.startsWith("/managers/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const activeGroup = groups.find((group) => group.children && groupActive(pathname, group));

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
        <nav className="hidden items-center gap-6 md:flex">
          {groups.map((group) => {
            const active = groupActive(pathname, group);
            return (
              <Link
                key={group.label}
                href={group.href}
                className={`text-[11px] uppercase tracking-[0.16em] ${
                  active ? "text-forest border-b border-gold pb-0.5" : "text-ink/70 hover:text-forest"
                }`}
              >
                {group.label}
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
      {activeGroup?.children ? (
        <div className="hidden border-t border-rule md:block">
          <nav className="mx-auto flex max-w-6xl gap-6 px-4 py-2">
            {activeGroup.children.map((child) => {
              const active = childActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`text-[11px] uppercase tracking-[0.16em] ${
                    active ? "text-forest" : "text-ink/50 hover:text-forest"
                  }`}
                >
                  {child.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
      {open ? (
        <nav className="grid gap-4 border-t border-rule px-4 py-4 md:hidden">
          {groups.map((group) => (
            <div key={group.label}>
              <Link href={group.href} onClick={() => setOpen(false)} className="text-sm uppercase tracking-[0.14em] text-forest">
                {group.label}
              </Link>
              {group.children ? (
                <div className="mt-1 grid gap-1 pl-3">
                  {group.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setOpen(false)}
                      className="py-0.5 text-sm text-ink/70"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          <Link href="/admin" onClick={() => setOpen(false)} className="text-sm uppercase tracking-[0.14em] text-gold-muted">
            Admin
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
