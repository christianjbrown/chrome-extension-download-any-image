import { TabPicker } from "../../src/background/tab-picker";

function setup() {
  const calls: string[] = [];
  const script = {
    inject: vi.fn(() => {
      calls.push("inject");
      return Promise.resolve();
    }),
    disarm: vi.fn(() => {
      calls.push("disarm");
      return Promise.resolve(true);
    }),
  };
  const cursor = {
    show: vi.fn(() => {
      calls.push("show");
      return Promise.resolve();
    }),
    hide: vi.fn(() => {
      calls.push("hide");
      return Promise.resolve();
    }),
  };
  return { calls, script, cursor, picker: new TabPicker(script, cursor) };
}

describe("TabPicker", () => {
  it("injects the script before showing the crosshair", async () => {
    const { calls, picker } = setup();

    await picker.arm(2);

    expect(calls).toEqual(["inject", "show"]);
  });

  it("shows no crosshair when the script is refused", async () => {
    const { script, cursor, picker } = setup();
    script.inject.mockRejectedValueOnce(new Error("refused"));

    await expect(picker.arm(2)).rejects.toThrow("refused");
    expect(cursor.show).not.toHaveBeenCalled();
  });

  it("disarms the frames, hides the crosshair and says whether it was armed", async () => {
    const { calls, picker } = setup();

    await expect(picker.disarm(2)).resolves.toBe(true);
    expect(calls).toEqual(["disarm", "hide"]);
  });

  it("still disarms when the crosshair cannot be taken away", async () => {
    const { script, cursor, picker } = setup();
    script.disarm.mockResolvedValueOnce(false);
    cursor.hide.mockRejectedValueOnce(new Error("gone"));

    await expect(picker.disarm(2)).resolves.toBe(false);
  });
});
