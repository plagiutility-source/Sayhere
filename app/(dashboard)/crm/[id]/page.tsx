import { CrmDetail } from "@/components/crm/CrmDetail";
import { CrmGate } from "@/components/crm/CrmGate";

export default async function CrmContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <CrmGate>
      <CrmDetail contactId={id} />
    </CrmGate>
  );
}
