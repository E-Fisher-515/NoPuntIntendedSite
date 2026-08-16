import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule px-4 py-6 text-center text-xs uppercase tracking-[0.18em] text-ink/50">
      No Punt Intended · Official League Archive
      <span className="mx-2 text-rule">·</span>
      <Link href="/admin" className="tracking-[0.12em] text-gold-muted hover:text-forest">
        Admin
      </Link>
    </footer>
  );
}
