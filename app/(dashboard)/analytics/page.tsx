import { AnalyticsContent } from "@/components/dashboard/analytics-content";
import { resolveDemoScenario } from "@/lib/mock/demo";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = resolveDemoScenario(params.demo);
  return <AnalyticsContent demo={demo} />;
}
