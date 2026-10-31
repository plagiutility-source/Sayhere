import { FeedbackContent } from "@/components/dashboard/feedback-content";
import { resolveDemoScenario } from "@/lib/mock/demo";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = resolveDemoScenario(params.demo);
  return <FeedbackContent demo={demo} />;
}
