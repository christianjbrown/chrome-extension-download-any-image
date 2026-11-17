// Drives the service worker's wiring through a fake chrome, end to end.
type Listener = (...args: unknown[]) => unknown;

function chromeEvent() {
  const listeners: Listener[] = [];
  return {
    listeners,
    addListener: (listener: Listener) => listeners.push(listener),
    removeListener: (listener: Listener) => {
      listeners.splice(listeners.indexOf(listener), 1);
    },
    fire: (...args: unknown[]) =>
      listeners.map((listener) => listener(...args)),
  };
}

function fakeChrome() {
  return {
    runtime: {
      id: "ext",
      onMessage: chromeEvent(),
      onStartup: chromeEvent(),
      getContexts: vi.fn().mockResolvedValue([]),
    },
    offscreen: { createDocument: vi.fn().mockResolvedValue(undefined) },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
    },
    action: {
      onClicked: chromeEvent(),
      setBadgeText: vi.fn().mockResolvedValue(undefined),
      setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
      setTitle: vi.fn().mockResolvedValue(undefined),
      setIcon: vi.fn().mockResolvedValue(undefined),
    },
    scripting: {
      executeScript: vi.fn().mockResolvedValue([]),
      insertCSS: vi.fn().mockResolvedValue(undefined),
      removeCSS: vi.fn().mockResolvedValue(undefined),
    },
    tabs: {
      sendMessage: vi.fn().mockRejectedValue(new Error("No receiver")),
      onUpdated: chromeEvent(),
    },
    downloads: {
      download: vi.fn().mockResolvedValue(31),
      onChanged: chromeEvent(),
      onDeterminingFilename: chromeEvent(),
    },
  };
}

async function load() {
  vi.resetModules();
  const chrome = fakeChrome();
  vi.stubGlobal("chrome", chrome);
  await import("../../src/background/main");
  return chrome;
}

function fromPage(chrome: ReturnType<typeof fakeChrome>, message: unknown) {
  const reply = vi.fn();
  const answers = chrome.runtime.onMessage.fire(
    { target: "background", ...(message as object) },
    { id: "ext", tab: { id: 6 } },
    reply,
  );
  return { reply, answers };
}

describe("service worker", () => {
  it("arms the clicked tab when nothing there is waiting", async () => {
    const chrome = await load();

    chrome.action.onClicked.fire({ id: 6 });

    await vi.waitFor(() => {
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
        tabId: 6,
        text: "ON",
      });
    });
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 6, allFrames: true },
      files: ["page.js"],
    });
    expect(chrome.scripting.insertCSS).toHaveBeenCalled();
  });

  it("disarms the tab on a second click", async () => {
    const chrome = await load();
    chrome.tabs.sendMessage.mockResolvedValue({ ok: true, value: true });

    chrome.action.onClicked.fire({ id: 6 });

    await vi.waitFor(() => {
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
        tabId: 6,
        text: "",
      });
    });
    expect(chrome.scripting.executeScript).not.toHaveBeenCalledWith(
      expect.objectContaining({ files: ["page.js"] }),
    );
    expect(chrome.scripting.removeCSS).toHaveBeenCalled();
  });

  it("downloads a picked image under its own name", async () => {
    const chrome = await load();

    const { answers } = fromPage(chrome, {
      type: "save",
      url: "https://x.com/sunset.jpg",
      title: "Holiday",
    });
    expect(answers).toEqual([true]);
    await vi.waitFor(() => {
      expect(chrome.downloads.download).toHaveBeenCalled();
    });
    const suggest = vi.fn();
    chrome.downloads.onDeterminingFilename.fire(
      {
        byExtensionId: "ext",
        url: "https://x.com/sunset.jpg",
        mime: "image/jpeg",
      },
      suggest,
    );
    chrome.downloads.onChanged.fire({ id: 31, state: { current: "complete" } });

    expect(suggest).toHaveBeenCalledWith({
      filename: "sunset.jpg",
      conflictAction: "uniquify",
    });
    await vi.waitFor(() => {
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
        tabId: 6,
        text: "",
      });
    });
  });

  it("clears the button when the page disarms itself", async () => {
    const chrome = await load();

    fromPage(chrome, { type: "disarmed" });

    await vi.waitFor(() => {
      expect(chrome.action.setTitle).toHaveBeenCalledWith({
        tabId: 6,
        title: "Download next image I click on",
      });
    });
  });

  it("shows the page's reason when reading the image failed", async () => {
    const chrome = await load();

    fromPage(chrome, { type: "failed", error: "tainted" });

    await vi.waitFor(() => {
      expect(chrome.action.setTitle).toHaveBeenCalledWith({
        tabId: 6,
        title: "Download failed: tainted",
      });
    });
  });

  it("ignores messages from outside the extension", async () => {
    const chrome = await load();

    const answers = chrome.runtime.onMessage.fire(
      { target: "background", type: "disarmed" },
      { id: "intruder", tab: { id: 6 } },
      vi.fn(),
    );

    expect(answers).toEqual([false]);
  });

  it("opens the colour scheme watcher when the service worker starts", async () => {
    const chrome = await load();

    await vi.waitFor(() => {
      expect(chrome.offscreen.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ url: "offscreen.html" }),
      );
    });
  });

  it("opens the colour scheme watcher only once when Chrome starts", async () => {
    const chrome = await load();

    chrome.runtime.onStartup.fire();

    await vi.waitFor(() => {
      expect(chrome.offscreen.createDocument).toHaveBeenCalledTimes(1);
    });
  });

  it("repaints the button when the colour scheme changes", async () => {
    const chrome = await load();

    chrome.runtime.onMessage.fire(
      { target: "background", type: "scheme", scheme: "light" },
      { id: "ext" },
      vi.fn(),
    );

    await vi.waitFor(() => {
      expect(chrome.action.setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          "16": "icons/on-light/icon-16.png",
        }) as unknown,
      });
    });
  });

  it("learns Chrome's own colour scheme from the tab that was clicked", async () => {
    const chrome = await load();
    chrome.scripting.executeScript.mockResolvedValue([{ result: false }]);

    chrome.action.onClicked.fire({ id: 6 });

    await vi.waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        toolbarScheme: { device: "dark", chrome: "light" },
      });
    });
    expect(chrome.action.setIcon).toHaveBeenCalledWith({
      path: expect.objectContaining({
        "16": "icons/on-light/icon-16.png",
      }) as unknown,
    });
  });

  it("clears the button when the tab loads a new page", async () => {
    const chrome = await load();

    chrome.tabs.onUpdated.fire(6, { status: "loading" });

    await vi.waitFor(() => {
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
        tabId: 6,
        text: "",
      });
    });
  });
});
