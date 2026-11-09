import { CrmGate } from "@/components/crm/CrmGate";
import { CrmSettings } from "@/components/crm/CrmSettings";

export default function CrmSettingsPage() {
  return (
    <CrmGate>
      <CrmSettings />
    </CrmGate>
  );
}
