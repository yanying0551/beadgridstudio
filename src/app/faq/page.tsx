import type { Metadata } from "next";
import { ContentSection, StaticContentPage } from "../../components/StaticContentPage";
export const metadata: Metadata = { title: "Fuse Bead Pattern Maker FAQ | Bead Grid Studio", description: "Answers about local image processing, printing, exports, bead counts, and brand independence.", alternates: { canonical: "/faq" }, openGraph: { title: "Fuse Bead Pattern Maker FAQ | Bead Grid Studio", description: "Answers about local image processing, printing, exports, bead counts, and brand independence.", url: "/faq", type: "website" } };
const items = [
["Do I need an account?", "No. Bead Grid Studio does not require an account to create a pattern."],
["Is my image uploaded or stored?", "No. Your image is processed in your browser. Bead Grid Studio does not upload or store your photo on a server."],
["Can I print my pattern?", "Yes. Open the browser print dialog and choose Save as PDF, or download PNG and CSV files."],
["What are row and column coordinates for?", "They label positions in the grid and can help you find placements while building."],
["What is pegboard-aware page splitting?", "It organizes a larger pattern into sections that are easier to print and build across multiple boards or pages."],
["Does the materials guide tell me how many beads I need?", "It lists the colors and counts used in the generated grid. Keep extras available for substitutions or changes."],
["Is it free?", "Bead Grid Studio is free to use in V1 and has no ads in V1."],
] as const;
export default function FaqPage() { return <StaticContentPage title="Fuse Bead Pattern Maker FAQ" intro="Common questions about creating, printing, and using a pattern.">{items.map(([q,a]) => <ContentSection key={q} title={q}><p>{a}</p></ContentSection>)}</StaticContentPage>; }
