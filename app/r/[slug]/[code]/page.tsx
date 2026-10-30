import { ScanPage } from "@/components/rooms/customer/ScanPage";

export default async function Page({ params }: { params: Promise<{ slug: string; code: string }> }) {
  const { slug, code } = await params;
  return <ScanPage slug={slug} code={code} />;
}
