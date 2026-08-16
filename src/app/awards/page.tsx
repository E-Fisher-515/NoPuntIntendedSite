"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";

export default function AwardsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/seasons");
  }, [router]);
  return (
    <PageShell>
      <SectionHeader
        title="Awards"
        lede="Awards now live on each season page. You will be taken to Seasons."
      />
    </PageShell>
  );
}
