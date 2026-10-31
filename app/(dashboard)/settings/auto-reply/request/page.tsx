import { AutoReplyRequestScreen } from "@/components/dashboard/auto-reply";
import { resolveDemoScenario } from "@/lib/mock/demo";

/** PRD.md 5.4.3: the request form page, opened from Contact support. */
export default async function AutoReplyRequestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = resolveDemoScenario(params.demo);
  return <AutoReplyRequestScreen scenario={demo} />;
}
