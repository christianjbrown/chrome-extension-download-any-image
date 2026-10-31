import { NavigationReset } from "../../src/background/navigation-reset";
import { senderTab } from "../../src/background/sender-tab";
import { fakeIndicator } from "./fakes";

describe("senderTab", () => {
  it("is the tab the message came from", () => {
    expect(senderTab({ id: "me", tab: { id: 4 } })).toBe(4);
  });

  it.each([{ id: "me" }, { id: "me", tab: {} }])(
    "refuses a sender outside a tab",
    (sender) => {
      expect(() => senderTab(sender)).toThrow(
        "Only a page in a tab can pick an image",
      );
    },
  );
});

describe("NavigationReset", () => {
  it("clears the button when the tab starts loading a new page", async () => {
    const indicator = fakeIndicator();

    await new NavigationReset(indicator).changed(4, { status: "loading" });

    expect(indicator.showIdle).toHaveBeenCalledWith(4);
  });

  it.each([{ status: "complete" }, {}])(
    "leaves it alone otherwise",
    async (change) => {
      const indicator = fakeIndicator();

      await new NavigationReset(indicator).changed(4, change);

      expect(indicator.showIdle).not.toHaveBeenCalled();
    },
  );
});
