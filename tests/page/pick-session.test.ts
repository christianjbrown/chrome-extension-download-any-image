import { EventBindings } from "../../src/page/event-bindings";
import { PickSession } from "../../src/page/pick-session";
import { element, target } from "./fakes";

function pointer(extra: Record<string, unknown> = {}) {
  return {
    clientX: 5,
    clientY: 6,
    button: 0,
    key: "",
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    ...extra,
  };
}

function setup(options: { found?: boolean; navigation?: boolean } = {}) {
  const window = target();
  const navigation = target();
  const picture = element("img");
  const locator = {
    locate: vi.fn(() =>
      options.found === false
        ? undefined
        : {
            element: picture,
            source: { kind: "url" as const, url: "https://x/a.png" },
          },
    ),
  };
  const readers = { read: vi.fn().mockResolvedValue("https://x/a.png") };
  const reporter = { picked: vi.fn(), disarmed: vi.fn(), failed: vi.fn() };
  const hover = { follow: vi.fn(), stop: vi.fn() };
  const session = new PickSession({
    bindings: new EventBindings(),
    window,
    navigation: options.navigation === false ? undefined : navigation,
    hover,
    locator,
    readers,
    reporter,
    title: () => "The Page",
  });
  session.arm();
  return { window, navigation, locator, readers, reporter, hover, session };
}

describe("PickSession", () => {
  it("swallows the press and saves the picture under the click", async () => {
    const { window, locator, readers, reporter, hover } = setup();
    const down = pointer();
    const click = pointer();

    window.fire("pointerdown", down);
    window.fire("click", click);

    expect(down.preventDefault).toHaveBeenCalled();
    expect(down.stopImmediatePropagation).toHaveBeenCalled();
    expect(click.preventDefault).toHaveBeenCalled();
    expect(click.stopPropagation).toHaveBeenCalled();
    expect(locator.locate).toHaveBeenCalledWith(5, 6);
    await vi.waitFor(() => {
      expect(reporter.picked).toHaveBeenCalledWith(
        "https://x/a.png",
        "The Page",
      );
    });
    expect(readers.read).toHaveBeenCalledWith({
      kind: "url",
      url: "https://x/a.png",
    });
    expect(window.count()).toBe(0);
    expect(hover.stop).toHaveBeenCalled();
  });

  it("lets other mouse buttons through", () => {
    const { window } = setup();
    const right = pointer({ button: 2 });

    window.fire("mousedown", right);

    expect(right.preventDefault).not.toHaveBeenCalled();
  });

  it("swallows a click on something that is not a picture, and just stops", () => {
    const { window, reporter, readers } = setup({ found: false });
    const click = pointer();

    window.fire("click", click);

    expect(click.preventDefault).toHaveBeenCalled();
    expect(reporter.disarmed).toHaveBeenCalled();
    expect(readers.read).not.toHaveBeenCalled();
    expect(window.count()).toBe(0);
  });

  it("reports a picture it could not read", async () => {
    const { window, readers, reporter } = setup();
    readers.read.mockRejectedValueOnce(new Error("tainted"));

    window.fire("click", pointer());

    await vi.waitFor(() => {
      expect(reporter.failed).toHaveBeenCalledWith("tainted");
    });
  });

  it("follows the pointer with the outline", () => {
    const { window, hover } = setup();

    window.fire("pointermove", pointer({ clientX: 40, clientY: 50 }));

    expect(hover.follow).toHaveBeenCalledWith(40, 50);
  });

  it("stops on Escape and ignores other keys", () => {
    const { window, reporter } = setup();
    const other = pointer({ key: "a" });
    const escape = pointer({ key: "Escape" });

    window.fire("keydown", other);
    expect(other.preventDefault).not.toHaveBeenCalled();
    window.fire("keydown", escape);

    expect(escape.preventDefault).toHaveBeenCalled();
    expect(reporter.disarmed).toHaveBeenCalled();
    expect(window.count()).toBe(0);
  });

  it("stops when a single-page app navigates", () => {
    const { window, navigation, reporter } = setup();

    navigation.fire("navigate");

    expect(reporter.disarmed).toHaveBeenCalled();
    expect(window.count() + navigation.count()).toBe(0);
  });

  it("stops quietly when the page goes away", () => {
    const { window, reporter } = setup();

    window.fire("pagehide");

    expect(reporter.disarmed).not.toHaveBeenCalled();
    expect(window.count()).toBe(0);
  });

  it("works without the Navigation API", () => {
    const { window } = setup({ navigation: false });

    expect(window.count()).toBe(8);
  });
});
