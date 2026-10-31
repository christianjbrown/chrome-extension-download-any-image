// Bundles the service worker and the page script, and copies the static files
// into dist/, which is the folder Chrome loads with "Load unpacked".
import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const outdir = "dist";

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
await build({
  entryPoints: {
    background: "src/background/main.ts",
    page: "src/page/main.ts",
  },
  outdir,
  bundle: true,
  format: "iife",
  target: "chrome126",
  minify: false,
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
});
await cp("static", outdir, { recursive: true });
