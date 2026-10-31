import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { resolveDemoScenario } from "@/lib/mock/demo";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = resolveDemoScenario(params.demo);
  return <DashboardContent demo={demo} />;
}
