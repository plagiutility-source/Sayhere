import { ScanPage } from "@/components/rooms/customer/ScanPage";

/** Temporary reception placeholder; the standalone copy is deleted at merge. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ScanPage slug={slug} code="reception" />;
}
