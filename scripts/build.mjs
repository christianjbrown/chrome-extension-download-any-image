// Bundles the service worker, the page script and the offscreen document, and copies the static files
// into dist/, which is the folder Chrome loads with "Load unpacked".
import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
// What esbuild bundles, by the name each bundle is written under. The service
// worker refers to some of these by file name, and a test keeps them in step.
import entryPoints from "./entries.json" with { type: "json" };
// The oldest Chrome the extension says it runs on is the one the bundles are
// written for, so the two cannot drift apart.
import manifest from "../static/manifest.json" with { type: "json" };

const outdir = "dist";

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
await build({
  entryPoints,
  outdir,
  bundle: true,
  format: "iife",
  target: `chrome${manifest.minimum_chrome_version}`,
  minify: false,
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
});
await cp("static", outdir, { recursive: true });
