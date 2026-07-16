import type { MetadataRoute } from "next";
const base = "https://beadgridstudio.site";
const paths = ["/", "/how-it-works", "/print-guide", "/bead-count-calculator", "/faq", "/privacy", "/terms", "/disclaimer", "/contact"] as const;
export default function sitemap(): MetadataRoute.Sitemap { return paths.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : 0.7 })); }
