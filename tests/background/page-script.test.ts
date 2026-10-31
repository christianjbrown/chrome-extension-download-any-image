import { PageScript } from "../../src/background/page-script";

function setup() {
  const scripting = { executeScript: vi.fn().mockResolvedValue([]) };
  const tabs = { sendMessage: vi.fn() };
  return {
    scripting,
    tabs,
    script: new PageScript(scripting, tabs, "page.js"),
  };
}

describe("PageScript", () => {
  it("injects into every frame of the tab", async () => {
    const { scripting, script } = setup();

    await script.inject(7);

    expect(scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 7, allFrames: true },
      files: ["page.js"],
    });
  });

  it("says a frame was armed when one answers the disarm", async () => {
    const { tabs, script } = setup();
    tabs.sendMessage.mockResolvedValue({ ok: true, value: true });

    await expect(script.disarm(7)).resolves.toBe(true);
    expect(tabs.sendMessage).toHaveBeenCalledWith(7, {
      target: "page",
      type: "disarm",
    });
  });

  it.each([
    ["nobody is listening", () => Promise.reject(new Error("No receiver"))],
    ["the answer is empty", () => Promise.resolve(undefined)],
    ["the answer is a failure", () => Promise.resolve({ ok: false })],
  ])("says nothing was armed when %s", async (_why, answer) => {
    const { tabs, script } = setup();
    tabs.sendMessage.mockImplementation(answer);

    await expect(script.disarm(7)).resolves.toBe(false);
  });
});
