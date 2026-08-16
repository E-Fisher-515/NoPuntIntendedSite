import { RulesClient } from "@/components/RulesClient";
import { getEditorialFile } from "@/lib/archive";

export default function RulesPage() {
  return <RulesClient initial={getEditorialFile()} />;
}
