import { SettingsContent } from "@/components/dashboard/settings-content";
import { resolveDemoScenario } from "@/lib/mock/demo";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = resolveDemoScenario(params.demo);
  return <SettingsContent demo={demo} />;
}
