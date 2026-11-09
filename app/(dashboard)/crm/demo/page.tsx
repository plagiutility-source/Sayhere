import type { Metadata } from "next";
import { CrmDemoBootstrap } from "@/components/crm/CrmDemoBootstrap";

export const metadata: Metadata = {
  title: "CRM demo",
  robots: { index: false, follow: false },
};

export default function CrmDemoPage() {
  return <CrmDemoBootstrap />;
}
