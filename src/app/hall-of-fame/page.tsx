import { HallOfFameCard } from "@/components/HallOfFameCard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { getHallOfFame } from "@/lib/archive";

export default function HallOfFamePage() {
  const inductees = getHallOfFame();
  return (
    <PageShell>
      <SectionHeader
        eyebrow="The hall"
        title="Hall of Fame"
        lede="Induction is editorial, not automatic. Add members in content/hall-of-fame.json. We will not invent a class from standings."
      />
      {inductees.length ? (
        <div className="grid gap-6">
          {inductees.map((inductee) => (
            <HallOfFameCard key={inductee.id} inductee={inductee} />
          ))}
        </div>
      ) : (
        <p className="border border-gold/40 bg-cream-dark/40 px-6 py-16 text-center font-serif text-2xl text-forest">
          The hall awaits its first class.
        </p>
      )}
    </PageShell>
  );
}
