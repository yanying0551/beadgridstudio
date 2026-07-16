import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HowItWorksPage, { metadata as howMetadata } from "../../src/app/how-it-works/page";
import PrintGuidePage from "../../src/app/print-guide/page";
import BeadCountCalculatorPage from "../../src/app/bead-count-calculator/page";
import FaqPage from "../../src/app/faq/page";
import PrivacyPage from "../../src/app/privacy/page";
import TermsPage from "../../src/app/terms/page";
import DisclaimerPage from "../../src/app/disclaimer/page";
import ContactPage from "../../src/app/contact/page";
import robots from "../../src/app/robots";
import sitemap from "../../src/app/sitemap";
import { metadata as rootMetadata } from "../../src/app/layout";

const routes = [
  [HowItWorksPage, "How to Make a Fuse Bead Pattern From a Photo"],
  [PrintGuidePage, "How to Print a Fuse Bead Pattern Grid"],
  [BeadCountCalculatorPage, "Fuse Bead Count Calculator"],
  [FaqPage, "Fuse Bead Pattern Maker FAQ"],
  [PrivacyPage, "Privacy Notice"],
  [TermsPage, "Terms of Use"],
  [DisclaimerPage, "Independent-site and Brand Disclaimer"],
  [ContactPage, "Contact and Rights Reports"],
] as const;

describe("static route shell", () => {
  it.each(routes)("renders the frozen or required H1: %s", (Page, heading) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });

  it("publishes the frozen independent-site disclaimer", () => {
    render(<DisclaimerPage />);
    expect(screen.getByText(
      "Bead Grid Studio is an independent Fuse Bead Pattern Maker. References to Perler, Hama, and Artkal are descriptive only. Bead Grid Studio is not affiliated with, endorsed by, or sponsored by those brands.",
    )).toBeInTheDocument();
  });

  it("states local processing and upload-rights boundaries", () => {
    const { unmount } = render(<PrivacyPage />);
    expect(screen.getByText(/does not upload or store your photo on a server/i)).toBeInTheDocument();
    unmount();
    render(<TermsPage />);
    expect(screen.getByText(/only select images you own or have permission to use/i)).toBeInTheDocument();
  });

  it("keeps a visible pre-launch contact release blocker without inventing contact details", () => {
    render(<ContactPage />);
    expect(screen.getByText(/a monitored contact method must be active and tested before public launch/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
  });

  it("uses the production canonical base and frozen educational metadata", () => {
    expect(rootMetadata.metadataBase?.toString()).toBe("https://beadgridstudio.site/");
    expect(rootMetadata.alternates?.canonical).toBe("/");
    expect(howMetadata.title).toBe("How to Make a Fuse Bead Pattern From a Photo | Bead Grid Studio");
    expect(howMetadata.alternates?.canonical).toBe("/how-it-works");
  });

  it("lists every public V1 route in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const path of ["", "/how-it-works", "/print-guide", "/bead-count-calculator", "/faq", "/privacy", "/terms", "/disclaimer", "/contact"]) {
      expect(urls).toContain(`https://beadgridstudio.site${path || "/"}`);
    }
  });

  it("allows public crawling and points to the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://beadgridstudio.site/sitemap.xml",
    });
  });
});
