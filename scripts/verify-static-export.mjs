import { readFile, stat } from "node:fs/promises";

const path = "out/pattern.worker.js";
const info = await stat(path).catch(() => undefined);
if (!info?.isFile() || info.size < 100) {
  throw new Error(`Static export is missing an executable ${path} asset.`);
}

const source = await readFile(path, "utf8");
const forbidden = [
  [/\bimport\s+type\b/, "TypeScript type import"],
  [/\b(?:interface|declare)\s+[A-Za-z_$]/, "TypeScript declaration"],
  [/from\s+["'][^"']*\.ts["']/, "unresolved TypeScript import"],
];
for (const [pattern, label] of forbidden) {
  if (pattern.test(source)) throw new Error(`${path} contains ${label}; the Worker was not compiled for browsers.`);
}

console.log(`Verified static Worker asset: ${path} (${info.size} bytes)`);
