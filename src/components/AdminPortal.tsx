"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConstitutionBody } from "@/components/ConstitutionBody";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import {
  clearAdminToken,
  getAdminToken,
  GITHUB_REPO,
  inducteeFromManager,
  saveEditorial,
  setAdminToken,
  suggestHallOfFame,
  verifyAdminToken,
} from "@/lib/editorial";
import type { Award, Editorial, HofInductee, Manager, TimelineEvent } from "@/lib/types";

const field = "mt-1 w-full border border-rule bg-cream px-3 py-2 text-sm text-ink";
const label = "text-[11px] uppercase tracking-[0.16em] text-gold-muted";
const button = "border border-forest bg-forest px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-cream hover:bg-forest-deep";
const ghost = "border border-rule px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-forest hover:border-gold";

type Tab = "banner" | "rules" | "hof" | "timeline" | "awards";

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function AdminPortal({ managers, initial }: { managers: Manager[]; initial: Editorial }) {
  const [unlocked, setUnlocked] = useState(false);
  const [token, setToken] = useState("");
  const [editorial, setEditorial] = useState<Editorial>(initial);
  const [tab, setTab] = useState<Tab>("banner");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = getAdminToken();
    if (!stored) return;
    setToken(stored);
    verifyAdminToken().then((ok) => {
      if (ok) {
        setUnlocked(true);
        setStatus("Signed in. Edits save to public/editorial.json on GitHub.");
      }
    });
  }, []);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    setError("");
    setAdminToken(token);
    const ok = await verifyAdminToken();
    if (!ok) {
      clearAdminToken();
      setError("GitHub rejected that token. It needs Contents read/write on this repo.");
      return;
    }
    setUnlocked(true);
    setStatus("Signed in. Edits save to public/editorial.json on GitHub.");
  }

  async function persist(next: Editorial) {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      await saveEditorial(next);
      setEditorial(next);
      setStatus("Saved. The live site will pick this up from GitHub within a few seconds.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const suggestions = useMemo(() => suggestHallOfFame(managers, editorial), [managers, editorial]);
  const rejectedManagers = managers.filter((manager) => editorial.rejectedHofIds.includes(manager.id));

  if (!unlocked) {
    return (
      <PageShell>
        <SectionHeader
          eyebrow="Commissioner"
          title="Admin portal"
          lede="Rules, the hall, the countdown banner, timeline notes, and custom awards are edited here — not in the codebase."
        />
        <form onSubmit={unlock} className="max-w-xl border border-rule bg-cream-dark/30 p-6">
          <label className={label} htmlFor="token">
            GitHub personal access token
          </label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            className={field}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="ghp_… or github_pat_…"
          />
          <p className="mt-3 text-sm text-ink/70">
            Create a token with Contents read and write on{" "}
            <a className="underline" href={`https://github.com/${GITHUB_REPO}`} target="_blank" rel="noreferrer">
              {GITHUB_REPO}
            </a>
            . It stays in this browser session only and is never committed.
          </p>
          {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
          <button type="submit" className={`${button} mt-5`}>
            Unlock
          </button>
        </form>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Commissioner"
        title="Admin portal"
        lede="Save writes public/editorial.json on GitHub. ESPN standings and records stay ingest-only."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["banner", "Banner"],
            ["rules", "Rules"],
            ["hof", "Hall of Fame"],
            ["timeline", "Timeline"],
            ["awards", "Awards"],
          ] as const
        ).map(([id, name]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={tab === id ? button : ghost}
          >
            {name}
          </button>
        ))}
      </div>
      {status ? <p className="mb-4 border border-gold/40 bg-cream-dark/40 px-4 py-2 text-sm text-forest">{status}</p> : null}
      {error ? <p className="mb-4 border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p> : null}

      {tab === "banner" ? (
        <BannerEditor editorial={editorial} onChange={setEditorial} onSave={persist} saving={saving} />
      ) : null}
      {tab === "rules" ? (
        <RulesEditor editorial={editorial} onChange={setEditorial} onSave={persist} saving={saving} />
      ) : null}
      {tab === "hof" ? (
        <HofEditor
          editorial={editorial}
          managers={managers}
          suggestions={suggestions}
          rejected={rejectedManagers}
          onChange={setEditorial}
          onSave={persist}
          saving={saving}
        />
      ) : null}
      {tab === "timeline" ? (
        <TimelineEditor editorial={editorial} onChange={setEditorial} onSave={persist} saving={saving} />
      ) : null}
      {tab === "awards" ? (
        <AwardsEditor editorial={editorial} managers={managers} onChange={setEditorial} onSave={persist} saving={saving} />
      ) : null}
    </PageShell>
  );
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <button type="button" className={`${button} mt-6`} disabled={saving} onClick={onSave}>
      {saving ? "Saving…" : "Save to GitHub"}
    </button>
  );
}

function BannerEditor({
  editorial,
  onChange,
  onSave,
  saving,
}: {
  editorial: Editorial;
  onChange: (next: Editorial) => void;
  onSave: (next: Editorial) => void;
  saving: boolean;
}) {
  const banner = editorial.banner;
  function patch(partial: Partial<Editorial["banner"]>) {
    onChange({ ...editorial, banner: { ...banner, ...partial } });
  }
  return (
    <section className="max-w-xl space-y-4">
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={banner.enabled}
          onChange={(event) => patch({ enabled: event.target.checked })}
        />
        Show countdown banner
      </label>
      <div>
        <label className={label}>Label</label>
        <input className={field} value={banner.label} onChange={(event) => patch({ label: event.target.value })} />
      </div>
      <div>
        <label className={label}>Target date and time</label>
        <input
          type="datetime-local"
          className={field}
          value={toLocalInput(banner.target)}
          onChange={(event) => patch({ target: fromLocalInput(event.target.value) })}
        />
      </div>
      <div>
        <label className={label}>Message</label>
        <input className={field} value={banner.message} onChange={(event) => patch({ message: event.target.value })} />
      </div>
      <p className="text-sm text-ink/60">Turn this off after draft day, or retarget it later for playoffs.</p>
      <SaveBar saving={saving} onSave={() => onSave(editorial)} />
    </section>
  );
}

function RulesEditor({
  editorial,
  onChange,
  onSave,
  saving,
}: {
  editorial: Editorial;
  onChange: (next: Editorial) => void;
  onSave: (next: Editorial) => void;
  saving: boolean;
}) {
  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <div>
        <label className={label}>Constitution (markdown headings with # and ##)</label>
        <textarea
          className={`${field} min-h-[28rem] font-mono text-[13px] leading-6`}
          value={editorial.constitution}
          onChange={(event) => onChange({ ...editorial, constitution: event.target.value })}
        />
        <SaveBar saving={saving} onSave={() => onSave(editorial)} />
      </div>
      <div>
        <p className={`${label} mb-3`}>Preview</p>
        <ConstitutionBody text={editorial.constitution} />
      </div>
    </section>
  );
}

function HofEditor({
  editorial,
  managers,
  suggestions,
  rejected,
  onChange,
  onSave,
  saving,
}: {
  editorial: Editorial;
  managers: Manager[];
  suggestions: ReturnType<typeof suggestHallOfFame>;
  rejected: Manager[];
  onChange: (next: Editorial) => void;
  onSave: (next: Editorial) => void;
  saving: boolean;
}) {
  function approve(managerId: string, reasons: string[]) {
    const manager = managers.find((item) => item.id === managerId);
    if (!manager) return;
    onChange({
      ...editorial,
      hallOfFame: [...editorial.hallOfFame, inducteeFromManager(manager, reasons)],
      rejectedHofIds: editorial.rejectedHofIds.filter((id) => id !== managerId),
    });
  }

  function reject(managerId: string) {
    onChange({
      ...editorial,
      rejectedHofIds: editorial.rejectedHofIds.includes(managerId)
        ? editorial.rejectedHofIds
        : [...editorial.rejectedHofIds, managerId],
    });
  }

  function restore(managerId: string) {
    onChange({
      ...editorial,
      rejectedHofIds: editorial.rejectedHofIds.filter((id) => id !== managerId),
    });
  }

  function updateInductee(id: string, partial: Partial<HofInductee>) {
    onChange({
      ...editorial,
      hallOfFame: editorial.hallOfFame.map((entry) => (entry.id === id ? { ...entry, ...partial } : entry)),
    });
  }

  function removeInductee(id: string) {
    onChange({
      ...editorial,
      hallOfFame: editorial.hallOfFame.filter((entry) => entry.id !== id),
    });
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-serif text-3xl text-forest">Suggested class</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          These names are computed from the archive. Approve to induct, or reject to hide the suggestion. Nothing is
          automatic.
        </p>
        {!suggestions.length ? (
          <p className="mt-4 border border-dashed border-rule px-4 py-6 text-sm text-ink/60">No pending suggestions.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {suggestions.map((suggestion) => (
              <article key={suggestion.managerId} className="border border-rule p-5">
                <p className="font-serif text-2xl text-forest">{suggestion.name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-muted">
                  {suggestion.championships} titles · {suggestion.careerRecord} · {suggestion.seasonsPlayed} seasons
                </p>
                <ul className="mt-3 list-disc pl-5 text-sm text-ink/70">
                  {suggestion.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <button type="button" className={button} onClick={() => approve(suggestion.managerId, suggestion.reasons)}>
                    Approve
                  </button>
                  <button type="button" className={ghost} onClick={() => reject(suggestion.managerId)}>
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-3xl text-forest">Inducted</h2>
        {!editorial.hallOfFame.length ? (
          <p className="mt-4 border border-dashed border-rule px-4 py-6 text-sm text-ink/60">The hall is empty.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {editorial.hallOfFame.map((entry) => (
              <article key={entry.id} className="border border-gold/40 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={label}>Name</label>
                    <input className={field} value={entry.name} onChange={(event) => updateInductee(entry.id, { name: event.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Induction year</label>
                    <input
                      className={field}
                      type="number"
                      value={entry.inductionYear}
                      onChange={(event) => updateInductee(entry.id, { inductionYear: Number(event.target.value) })}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={label}>Description</label>
                  <textarea
                    className={`${field} min-h-24`}
                    value={entry.description}
                    onChange={(event) => updateInductee(entry.id, { description: event.target.value })}
                  />
                </div>
                <div className="mt-3">
                  <label className={label}>Accomplishments (one per line)</label>
                  <textarea
                    className={`${field} min-h-24`}
                    value={entry.accomplishments.join("\n")}
                    onChange={(event) =>
                      updateInductee(entry.id, {
                        accomplishments: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
                <button type="button" className={`${ghost} mt-4`} onClick={() => removeInductee(entry.id)}>
                  Remove from hall
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {rejected.length ? (
        <section>
          <h2 className="font-serif text-3xl text-forest">Rejected suggestions</h2>
          <ul className="mt-3 space-y-2">
            {rejected.map((manager) => (
              <li key={manager.id} className="flex items-center justify-between border border-rule px-4 py-2 text-sm">
                <span>{manager.name}</span>
                <button type="button" className={ghost} onClick={() => restore(manager.id)}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SaveBar saving={saving} onSave={() => onSave(editorial)} />
    </div>
  );
}

function TimelineEditor({
  editorial,
  onChange,
  onSave,
  saving,
}: {
  editorial: Editorial;
  onChange: (next: Editorial) => void;
  onSave: (next: Editorial) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState({ year: new Date().getFullYear(), title: "", body: "" });

  function addEvent() {
    if (!draft.title.trim()) return;
    const event: TimelineEvent = {
      year: Number(draft.year),
      title: draft.title.trim(),
      body: draft.body.trim(),
      source: "editorial",
    };
    onChange({ ...editorial, timeline: [...editorial.timeline, event].sort((a, b) => a.year - b.year) });
    setDraft({ year: draft.year, title: "", body: "" });
  }

  return (
    <section className="max-w-2xl space-y-6">
      <div className="border border-rule p-5">
        <p className={label}>Add an editorial event</p>
        <div className="mt-3 grid gap-3 md:grid-cols-[8rem_1fr]">
          <input
            className={field}
            type="number"
            value={draft.year}
            onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })}
          />
          <input
            className={field}
            placeholder="Title"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </div>
        <textarea
          className={`${field} mt-3 min-h-24`}
          placeholder="What happened"
          value={draft.body}
          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
        />
        <button type="button" className={`${ghost} mt-3`} onClick={addEvent}>
          Add event
        </button>
      </div>
      {editorial.timeline.map((event, index) => (
        <article key={`${event.year}-${event.title}-${index}`} className="border border-rule p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gold-muted">{event.year}</p>
          <p className="font-serif text-xl text-forest">{event.title}</p>
          <p className="text-sm text-ink/70">{event.body}</p>
          <button
            type="button"
            className={`${ghost} mt-3`}
            onClick={() =>
              onChange({
                ...editorial,
                timeline: editorial.timeline.filter((_, itemIndex) => itemIndex !== index),
              })
            }
          >
            Remove
          </button>
        </article>
      ))}
      <SaveBar saving={saving} onSave={() => onSave(editorial)} />
    </section>
  );
}

function AwardsEditor({
  editorial,
  managers,
  onChange,
  onSave,
  saving,
}: {
  editorial: Editorial;
  managers: Manager[];
  onChange: (next: Editorial) => void;
  onSave: (next: Editorial) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState({
    year: new Date().getFullYear(),
    name: "",
    winnerId: "",
    winnerName: "",
    detail: "",
  });

  function addAward() {
    if (!draft.name.trim() || !draft.winnerName.trim()) return;
    const award: Award = {
      id: `custom-${Date.now()}`,
      year: Number(draft.year),
      name: draft.name.trim(),
      category: "league",
      source: "editorial",
      winnerName: draft.winnerName.trim(),
      winnerId: draft.winnerId || null,
      detail: draft.detail.trim(),
    };
    onChange({ ...editorial, customAwards: [...editorial.customAwards, award] });
    setDraft({ ...draft, name: "", winnerName: "", winnerId: "", detail: "" });
  }

  return (
    <section className="max-w-2xl space-y-6">
      <p className="text-sm text-ink/70">ESPN awards stay computed. Add league honors here (Toilet Bowl, sportsmanship, and so on).</p>
      <div className="border border-rule p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className={label}>Year</label>
            <input className={field} type="number" value={draft.year} onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })} />
          </div>
          <div>
            <label className={label}>Award name</label>
            <input className={field} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
        </div>
        <div className="mt-3">
          <label className={label}>Winner</label>
          <select
            className={field}
            value={draft.winnerId}
            onChange={(event) => {
              const manager = managers.find((item) => item.id === event.target.value);
              setDraft({
                ...draft,
                winnerId: event.target.value,
                winnerName: manager?.name || draft.winnerName,
              });
            }}
          >
            <option value="">Select a manager…</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3">
          <label className={label}>Display name override</label>
          <input className={field} value={draft.winnerName} onChange={(event) => setDraft({ ...draft, winnerName: event.target.value })} />
        </div>
        <div className="mt-3">
          <label className={label}>Detail</label>
          <input className={field} value={draft.detail} onChange={(event) => setDraft({ ...draft, detail: event.target.value })} />
        </div>
        <button type="button" className={`${ghost} mt-3`} onClick={addAward}>
          Add award
        </button>
      </div>
      {editorial.customAwards.map((award) => (
        <article key={award.id} className="flex items-start justify-between gap-4 border border-rule p-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold-muted">
              {award.year} · {award.name}
            </p>
            <p className="font-serif text-xl text-forest">{award.winnerName}</p>
            <p className="text-sm text-ink/60">{award.detail}</p>
          </div>
          <button
            type="button"
            className={ghost}
            onClick={() =>
              onChange({
                ...editorial,
                customAwards: editorial.customAwards.filter((item) => item.id !== award.id),
              })
            }
          >
            Remove
          </button>
        </article>
      ))}
      <SaveBar saving={saving} onSave={() => onSave(editorial)} />
    </section>
  );
}
