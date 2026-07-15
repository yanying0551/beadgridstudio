import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bead Grid Studio",
  description: "A local-first fuse bead pattern maker.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
