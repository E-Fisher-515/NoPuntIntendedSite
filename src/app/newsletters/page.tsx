import { NewslettersClient } from "@/components/NewslettersClient";
import { getEditorialFile } from "@/lib/archive";
import type { NewsletterIssue } from "@/lib/types";

const seeded: NewsletterIssue[] = [
  { id: "2025-1", year: 2025, week: 1, title: "Week 1 recap", path: "/newsletters/2025-week-1.html" },
  { id: "2025-2", year: 2025, week: 2, title: "Week 2 recap", path: "/newsletters/2025-week-2.html" },
  { id: "2025-3", year: 2025, week: 3, title: "Week 3 recap", path: "/newsletters/2025-week-3.html" },
  { id: "2025-4", year: 2025, week: 4, title: "Week 4 recap", path: "/newsletters/2025-week-4.html" },
  { id: "2025-5", year: 2025, week: 5, title: "Week 5 recap", path: "/newsletters/2025-week-5.html" },
  { id: "2025-6", year: 2025, week: 6, title: "Week 6 recap", path: "/newsletters/2025-week-6.html" },
  { id: "2025-8", year: 2025, week: 8, title: "Week 8 recap", path: "/newsletters/2025-week-8.html" },
  { id: "2025-10", year: 2025, week: 10, title: "Week 10 recap", path: "/newsletters/2025-week-10.html" },
  { id: "2025-eoy", year: 2025, week: "eoy", title: "2025 year in review", path: "/newsletters/2025-year-in-review.html" },
];

export default function NewslettersPage() {
  return <NewslettersClient seeded={seeded} initial={getEditorialFile()} />;
}
