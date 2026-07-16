import { build } from "esbuild";

await build({
  entryPoints: ["src/workers/pattern.worker.ts"],
  outfile: "public/pattern.worker.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  sourcemap: false,
  legalComments: "none",
});
