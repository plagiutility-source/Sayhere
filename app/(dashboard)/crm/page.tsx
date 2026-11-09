import { CrmGate } from "@/components/crm/CrmGate";
import { CrmList } from "@/components/crm/CrmList";

export default function CrmPage() {
  return (
    <CrmGate>
      <CrmList />
    </CrmGate>
  );
}
