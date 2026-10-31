import { BillingContent } from "@/components/dashboard/billing-content";
import { resolveDemoScenario } from "@/lib/mock/demo";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = resolveDemoScenario(params.demo);
  return <BillingContent demo={demo} />;
}
