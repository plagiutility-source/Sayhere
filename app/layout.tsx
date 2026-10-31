import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syehere",
  description:
    "Turn happy customers into Google reviews and catch unhappy ones before they go public.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
