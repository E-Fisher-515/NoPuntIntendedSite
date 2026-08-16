import { AdminPortal } from "@/components/AdminPortal";
import { archiveReady, getEditorialFile, getManagers } from "@/lib/archive";

export const metadata = {
  title: "Commissioner",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPortal managers={archiveReady() ? getManagers() : []} initial={getEditorialFile()} />;
}
