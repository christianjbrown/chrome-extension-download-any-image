import entries from "../scripts/entries.json";
import {
  OFFSCREEN_DOCUMENT_FILE,
  PAGE_SCRIPT_FILE,
} from "../src/background/entry-files";
import manifest from "../static/manifest.json";
import offscreenHtml from "../static/offscreen.html?raw";

const bundles = Object.keys(entries).map((name) => `${name}.js`);

describe("build entries", () => {
  it("bundles the service worker the manifest names", () => {
    expect(bundles).toContain(manifest.background.service_worker);
  });

  it("bundles the page script the service worker injects", () => {
    expect(bundles).toContain(PAGE_SCRIPT_FILE);
  });

  it("ships the offscreen document the service worker opens, with its bundle", () => {
    expect(OFFSCREEN_DOCUMENT_FILE).toBe("offscreen.html");
    expect(offscreenHtml).toContain('<script src="offscreen.js">');
    expect(bundles).toContain("offscreen.js");
  });
});
