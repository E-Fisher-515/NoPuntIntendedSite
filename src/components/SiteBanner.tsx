"use client";

import { useEffect, useMemo, useState } from "react";
import type { Editorial } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

function partsUntil(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    arrived: diff <= 0,
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex min-w-[3.25rem] flex-col items-center">
      <span className="font-serif text-xl tabular-nums text-gold">{String(value).padStart(2, "0")}</span>
      <span className="text-[9px] uppercase tracking-[0.16em] text-cream/60">{label}</span>
    </span>
  );
}

export function SiteBanner({ initial }: { initial?: Editorial }) {
  const editorial = useEditorial(initial);
  const banner = editorial.banner;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!banner.enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [banner.enabled]);

  const targetMs = useMemo(() => Date.parse(banner.target), [banner.target]);
  if (!banner.enabled || Number.isNaN(targetMs)) return null;

  const countdown = partsUntil(targetMs, now);

  return (
    <div className="border-b border-gold/40 bg-forest-deep text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 py-3">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">{banner.label}</p>
          <p className="mt-0.5 text-sm text-cream/80">{banner.message}</p>
        </div>
        {countdown.arrived ? (
          <p className="font-serif text-lg text-gold">It is time.</p>
        ) : (
          <div className="flex items-end gap-3">
            <Unit value={countdown.days} label="Days" />
            <Unit value={countdown.hours} label="Hours" />
            <Unit value={countdown.minutes} label="Min" />
            <Unit value={countdown.seconds} label="Sec" />
          </div>
        )}
      </div>
    </div>
  );
}
