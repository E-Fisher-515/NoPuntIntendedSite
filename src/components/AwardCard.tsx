import type { Award, Manager } from "@/lib/types";
import { identity } from "@/lib/format";
import { lookupOwnerTeam, managerById } from "@/lib/lookups";

export function AwardCard({
  award,
  managers = [],
  showYear = true,
}: {
  award: Award;
  managers?: Manager[];
  showYear?: boolean;
}) {
  const manager = managerById(managers, award.winnerId);
  const fromTeam = lookupOwnerTeam(managers, award.year, null, award.winnerName);
  const ownerName = award.winnerName.includes(" vs ") ? "" : manager?.name || fromTeam.ownerName || award.winnerName;
  const teamName = award.winnerName.includes(" vs ")
    ? award.winnerName
    : manager?.seasons.find((season) => season.year === award.year)?.teamName || fromTeam.teamName;
  return (
    <article className="border border-rule px-4 py-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold-muted">
        {showYear ? `${award.year} · ` : ""}
        {award.source === "espn" ? "From the record" : "League honor"}
      </p>
      <h3 className="mt-2 font-serif text-2xl text-forest">{award.name}</h3>
      <p className="mt-1 text-sm">{identity(ownerName || award.winnerName, teamName, showYear ? award.year : undefined)}</p>
      <p className="text-sm text-ink/60">{award.detail}</p>
    </article>
  );
}
