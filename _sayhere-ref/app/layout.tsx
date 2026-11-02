import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syehere — Tables, orders & QR pages",
  description: "Tables and rooms QR ordering, live orders and QR pages.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-ink antialiased">{children}</body>
    </html>
  );
}
