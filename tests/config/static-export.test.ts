import nextConfig from "../../next.config";
import tsconfig from "../../tsconfig.json";
import { describe, expect, it } from "vitest";

describe("Cloudflare Pages build configuration", () => {
  it("exports a fully static site into the out directory", () => {
    expect(nextConfig.output).toBe("export");
  });

  it("excludes generated static-export files from TypeScript source checking", () => {
    expect(tsconfig.exclude).toContain("out");
  });
});
