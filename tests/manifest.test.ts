import manifest from "../static/manifest.json";

describe("manifest", () => {
  it("is named so it stands out in chrome://extensions", () => {
    expect(manifest.name).toBe("Christian's Download Any Image");
    expect(manifest.action.default_title).toBe(
      "Download next image I click on",
    );
  });

  // activeTab and scripting put the picker into the clicked tab, and only that
  // tab, on a click. downloads saves the image. offscreen reads Chrome's colour
  // scheme for the toolbar icon. Nothing reads any other page, so no host
  // permissions.
  it("asks for activeTab, scripting, downloads and offscreen, and nothing else", () => {
    expect(manifest.permissions).toEqual([
      "activeTab",
      "scripting",
      "downloads",
      "offscreen",
    ]);
    expect(manifest).not.toHaveProperty("host_permissions");
    expect(manifest).not.toHaveProperty("optional_permissions");
  });

  it("starts with the icon for a dark toolbar until the scheme is known", () => {
    expect(manifest.action.default_icon["16"]).toBe(
      "icons/on-dark/icon-16.png",
    );
  });

  it("has no keyboard shortcut and no options page", () => {
    expect(manifest).not.toHaveProperty("commands");
    expect(manifest).not.toHaveProperty("options_page");
    expect(manifest).not.toHaveProperty("options_ui");
  });
});
