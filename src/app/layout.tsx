import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://beadgridstudio.site"),
  title: "Fuse Bead Pattern Maker — Printable Photo Grids | Bead Grid Studio",
  description: "Turn a photo into a printable fuse bead pattern with a grid, row and column coordinates, bead counts, pegboard-aware page splitting, and PDF, PNG, or CSV exports.",
  alternates: { canonical: "/" },
  openGraph: { title: "Bead Grid Studio", description: "Turn a photo into a printable fuse bead pattern.", type: "website", url: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<SiteFooter /></body></html>;
}
