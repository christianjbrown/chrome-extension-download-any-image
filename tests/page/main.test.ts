// Drives the injected page script's wiring through a fake page and chrome, end to end.
import { element, svgElement, target } from "./fakes";

type Listener = (
  message: unknown,
  sender: unknown,
  reply: (reply: unknown) => void,
) => boolean;

function click(x: number, y: number) {
  return {
    clientX: x,
    clientY: y,
    button: 0,
    isTrusted: true,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
  };
}

function installPage(stack: unknown[] = []) {
  const listeners: Listener[] = [];
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("chrome", {
    runtime: {
      id: "ext",
      sendMessage,
      onMessage: {
        addListener: vi.fn((listener: Listener) => listeners.push(listener)),
        removeListener: vi.fn((listener: Listener) => {
          listeners.splice(listeners.indexOf(listener), 1);
        }),
      },
    },
  });
  const window = Object.assign(target(), { navigation: target() });
  vi.stubGlobal("window", window);
  const root = element("html", { append: vi.fn() });
  const body = element("body");
  vi.stubGlobal("document", {
    documentElement: root,
    body,
    baseURI: "https://x.com/",
    title: "A Page",
    elementsFromPoint: () => [...stack, body, root],
    querySelectorAll: () => [],
    createElement: () => ({ style: { setProperty: vi.fn() }, remove: vi.fn() }),
  });
  vi.stubGlobal("getComputedStyle", (_element: unknown, pseudo?: string) => ({
    getPropertyValue: (property: string) =>
      pseudo === undefined && property === "background-image"
        ? 'url("https://x.com/bg.png")'
        : "",
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
    callback();
  });
  return { listeners, sendMessage, window, root };
}

async function load() {
  await import("../../src/page/main");
}

describe("page script", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as Record<string, unknown>).__downloadThatImage;
  });

  it("saves a CSS background under the click, outlining it first", async () => {
    const { window, sendMessage, root } = installPage([element("div")]);
    await load();

    window.fire("pointermove", click(3, 4));
    expect(root.append).toHaveBeenCalled();
    window.fire("click", click(3, 4));

    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({
        target: "background",
        type: "save",
        url: "https://x.com/bg.png",
        title: "A Page",
      });
    });
    expect(window.count()).toBe(0);
  });

  it("reads a blob in the page", async () => {
    const { window, sendMessage } = installPage([
      element("img", { currentSrc: "blob:https://x.com/1", src: "" }),
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ blob: () => Promise.resolve({ size: 1 }) }),
    );
    vi.stubGlobal(
      "FileReader",
      class {
        result = "data:image/png;base64,QQ";
        onload = (): void => undefined;
        readAsDataURL() {
          this.onload();
        }
      },
    );
    await load();

    window.fire("click", click(1, 1));

    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "save",
          url: "data:image/png;base64,QQ",
        }),
      );
    });
  });

  it("reports a blob the browser could not read", async () => {
    const { window, sendMessage } = installPage([
      element("img", { currentSrc: "blob:https://x.com/1", src: "" }),
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ blob: () => Promise.resolve({ size: 1 }) }),
    );
    vi.stubGlobal(
      "FileReader",
      class {
        onerror = (): void => undefined;
        readAsDataURL() {
          this.onerror();
        }
      },
    );
    await load();

    window.fire("click", click(1, 1));

    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({
        target: "background",
        type: "failed",
        error: "The image could not be read",
      });
    });
  });

  it("resolves an SVG <image> against the page", async () => {
    const { window, sendMessage } = installPage([
      svgElement("image", { href: { baseVal: "pics/a.png" } }),
    ]);
    await load();

    window.fire("click", click(1, 1));

    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ url: "https://x.com/pics/a.png" }),
      );
    });
  });

  it("serialises an inline svg", async () => {
    const copy = {
      hasAttribute: () => true,
      setAttribute: vi.fn(),
      style: { setProperty: vi.fn() },
    };
    const { window, sendMessage } = installPage([
      svgElement("svg", { ownerSVGElement: null, cloneNode: () => copy }),
    ]);
    vi.stubGlobal(
      "XMLSerializer",
      class {
        serializeToString() {
          return "<svg/>";
        }
      },
    );
    await load();

    window.fire("click", click(1, 1));

    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E",
        }),
      );
    });
  });

  it("disarms when the service worker asks, and stops listening", async () => {
    const { listeners, window } = installPage();
    await load();
    const reply = vi.fn();

    const later = listeners[0]!(
      { target: "page", type: "disarm" },
      { id: "ext" },
      reply,
    );

    expect(later).toBe(true);
    await vi.waitFor(() => {
      expect(reply).toHaveBeenCalledWith({ ok: true, value: true });
    });
    expect(listeners).toHaveLength(0);
    expect(window.count() + window.navigation.count()).toBe(0);
  });

  it("replaces a copy injected earlier into the same frame", async () => {
    const first = installPage();
    await load();
    vi.resetModules();
    await load();

    expect(first.listeners).toHaveLength(1);
    expect(first.window.count()).toBe(8);
  });

  it("ignores messages from anyone else", async () => {
    const { listeners } = installPage();
    await load();

    expect(
      listeners[0]!(
        { target: "page", type: "disarm" },
        { id: "other" },
        vi.fn(),
      ),
    ).toBe(false);
  });
});
