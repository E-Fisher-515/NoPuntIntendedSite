import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { getConstitution } from "@/lib/archive";

function ConstitutionBody({ text }: { text: string }) {
  return (
    <article className="max-w-3xl border border-rule bg-cream px-8 py-10">
      {text.split("\n").map((line, index) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={index} className="mb-6 text-center font-serif text-4xl text-forest">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="mb-3 mt-8 font-serif text-2xl text-forest">
              {line.slice(3)}
            </h2>
          );
        }
        if (!line.trim()) {
          return <div key={index} className="h-3" />;
        }
        return (
          <p key={index} className="text-[17px] leading-8 text-ink/80">
            {line}
          </p>
        );
      })}
    </article>
  );
}

export default function RulesPage() {
  return (
    <PageShell>
      <SectionHeader
        eyebrow="League law"
        title="Constitution"
        lede="House rules belong here. ESPN settings are ingested per season; this document is the editorial constitution."
      />
      <ConstitutionBody text={getConstitution()} />
    </PageShell>
  );
}
