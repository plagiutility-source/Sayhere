import { LoyaltyContent } from "@/components/dashboard/loyalty/loyalty-content";
import { resolveDemoScenario } from "@/lib/mock/demo";

export default async function LoyaltyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = resolveDemoScenario(params.demo);
  return <LoyaltyContent demo={demo} />;
}
