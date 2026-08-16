import type { TimelineEvent } from "@/lib/types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="border-l border-gold/50 pl-6">
      {events.map((event) => (
        <li key={`${event.year}-${event.title}`} className="relative mb-10">
          <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-gold" />
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-muted">{event.year}</p>
          <h3 className="mt-1 font-serif text-2xl text-forest">{event.title}</h3>
          <p className="mt-1 text-ink/70">{event.body}</p>
        </li>
      ))}
    </ol>
  );
}
