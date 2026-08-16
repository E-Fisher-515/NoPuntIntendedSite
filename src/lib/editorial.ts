import type { Award, Editorial, HofSuggestion, Manager } from "./types";
import { recordLine } from "./format";

export const GITHUB_REPO = "E-Fisher-515/NoPuntIntendedSite";
export const EDITORIAL_PATH = "public/editorial.json";
const TOKEN_KEY = "npi-admin-token";

export const DEFAULT_ADMIN_PIN_HASH = "90ef794f5ced4199fdfad5278673de115167bfe12d90787a5f33fb279a3deb61";
const UNLOCKED_KEY = "npi-admin-ok";

export const emptyEditorial = (): Editorial => ({
  banner: {
    enabled: false,
    label: "Draft day",
    target: "2026-09-06T17:00:00-05:00",
    message: "Countdown to the offline draft",
  },
  constitution: "Constitution has not been published yet.",
  hallOfFame: [],
  rejectedHofIds: [],
  timeline: [],
  customAwards: [],
  adminPinHash: DEFAULT_ADMIN_PIN_HASH,
  newsletters: [],
  newsletterRecipients: "",
});

export function normalizeEditorial(data: Partial<Editorial> | null | undefined): Editorial {
  const fallback = emptyEditorial();
  return {
    ...fallback,
    ...data,
    banner: { ...fallback.banner, ...data?.banner },
    hallOfFame: data?.hallOfFame ?? [],
    rejectedHofIds: data?.rejectedHofIds ?? [],
    timeline: data?.timeline ?? [],
    customAwards: data?.customAwards ?? [],
    newsletters: data?.newsletters ?? [],
    newsletterRecipients: data?.newsletterRecipients ?? "",
    adminPinHash: data?.adminPinHash || fallback.adminPinHash,
    constitution: data?.constitution || fallback.constitution,
  };
}

function localEditorialUrl(cacheBust: number): string {
  if (typeof window === "undefined") return "/editorial.json";
  const base = window.location.pathname.startsWith("/NoPuntIntendedSite") ? "/NoPuntIntendedSite" : "";
  return `${base}/editorial.json?t=${cacheBust}`;
}

function editorialUrls(): string[] {
  const cacheBust = Date.now();
  const remote = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${EDITORIAL_PATH}?t=${cacheBust}`;
  const local = localEditorialUrl(cacheBust);
  if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
    return [remote, local];
  }
  return [local, remote];
}

let inflight: Promise<Editorial> | null = null;
let cached: { data: Editorial; at: number } | null = null;
const CACHE_MS = 10_000;

export function invalidateEditorialCache() {
  cached = null;
  inflight = null;
}

export async function fetchEditorial(): Promise<Editorial> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  if (inflight) return inflight;
  inflight = (async () => {
    for (const url of editorialUrls()) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) continue;
        const data = (await response.json()) as Partial<Editorial>;
        const editorial = normalizeEditorial(data);
        cached = { data: editorial, at: Date.now() };
        return editorial;
      } catch {
        continue;
      }
    }
    return cached?.data ?? emptyEditorial();
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function markAdminUnlocked() {
  sessionStorage.setItem(UNLOCKED_KEY, "1");
}

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(UNLOCKED_KEY) === "1" || Boolean(getAdminToken());
}

export function clearAdminSession() {
  sessionStorage.removeItem(UNLOCKED_KEY);
  clearAdminToken();
}

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text.trim());
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function passwordUnlocksAdmin(password: string, pinHash: string): Promise<"token" | "pin" | null> {
  setAdminToken(password);
  if (await verifyAdminToken()) return "token";
  clearAdminToken();
  const hash = await sha256Hex(password);
  if (hash === (pinHash || DEFAULT_ADMIN_PIN_HASH)) return "pin";
  return null;
}

async function githubFile(path: string) {
  const token = getAdminToken();
  if (!token) throw new Error("Publishing needs the access key.");
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub could not read ${path} (${response.status}).`);
  return response.json() as Promise<{ sha: string }>;
}

export async function saveRepoFile(path: string, content: string, message: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error("Publishing needs the access key.");
  const current = await githubFile(path);
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: utf8ToBase64(content),
      sha: current?.sha,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub save failed (${response.status}): ${text.slice(0, 200)}`);
  }
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function githubContents() {
  const token = getAdminToken();
  if (!token) throw new Error("Paste a GitHub token with Contents write access on this repo.");
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${EDITORIAL_PATH}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub could not read ${EDITORIAL_PATH} (${response.status}). Check the token and repo access.`);
  }
  return response.json() as Promise<{ sha: string; content: string }>;
}

export async function saveEditorial(editorial: Editorial): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error("Paste a GitHub token with Contents write access on this repo.");
  const current = await githubContents();
  const payload = normalizeEditorial(editorial);
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${EDITORIAL_PATH}`, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Update league editorial content from the admin portal",
      content: utf8ToBase64(`${JSON.stringify(payload, null, 2)}\n`),
      sha: current.sha,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub save failed (${response.status}): ${text.slice(0, 200)}`);
  }
  cached = { data: payload, at: Date.now() };
}

export async function verifyAdminToken(): Promise<boolean> {
  try {
    await githubContents();
    return true;
  } catch {
    return false;
  }
}

export function mergeAwards(espnAwards: Award[], editorial: Editorial): Award[] {
  const espn = espnAwards.filter((award) => award.source === "espn");
  return [...espn, ...editorial.customAwards].sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
}

export function suggestHallOfFame(managers: Manager[], editorial: Editorial): HofSuggestion[] {
  const inducted = new Set(editorial.hallOfFame.map((entry) => entry.managerId).filter(Boolean));
  const rejected = new Set(editorial.rejectedHofIds);
  const suggestions: HofSuggestion[] = [];
  for (const manager of managers) {
    if (inducted.has(manager.id) || rejected.has(manager.id)) continue;
    const reasons: string[] = [];
    if (manager.championships >= 2) {
      reasons.push(`${manager.championships} championships`);
    } else if (manager.championships === 1 && manager.seasonsPlayed >= 4) {
      reasons.push(`champion with ${manager.seasonsPlayed} seasons in the archive`);
    }
    if (manager.winPct >= 0.55 && manager.seasonsPlayed >= 4) {
      reasons.push(`${(manager.winPct * 100).toFixed(1)}% career win rate over ${manager.seasonsPlayed} seasons`);
    }
    if (manager.playoffAppearances >= 5) {
      reasons.push(`${manager.playoffAppearances} playoff appearances`);
    }
    if (manager.runnerUp >= 2) {
      reasons.push(`${manager.runnerUp} championship-game losses — sustained contention`);
    }
    if (!reasons.length) continue;
    suggestions.push({
      managerId: manager.id,
      name: manager.name,
      championships: manager.championships,
      seasonsPlayed: manager.seasonsPlayed,
      winPct: manager.winPct,
      careerRecord: recordLine(manager.wins, manager.losses, manager.ties),
      reasons,
    });
  }
  return suggestions.sort((a, b) => b.championships - a.championships || b.winPct - a.winPct);
}

export function inducteeFromManager(manager: Manager, reasons: string[]): Editorial["hallOfFame"][number] {
  const latest = manager.seasons[manager.seasons.length - 1];
  return {
    id: manager.id,
    managerId: manager.id,
    name: manager.name,
    inductionYear: latest?.year ?? new Date().getFullYear(),
    championships: manager.championships,
    careerRecord: recordLine(manager.wins, manager.losses, manager.ties),
    accomplishments: reasons,
    description: `${manager.name} is nominated from the archive: ${reasons.join("; ")}.`,
    moments: manager.seasons
      .filter((season) => season.champion)
      .map((season) => `${season.year} champion (${season.teamName})`),
  };
}
