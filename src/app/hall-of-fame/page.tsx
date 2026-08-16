import { HallOfFameClient } from "@/components/HallOfFameClient";
import { getEditorialFile } from "@/lib/archive";

export default function HallOfFamePage() {
  return <HallOfFameClient initial={getEditorialFile()} />;
}
