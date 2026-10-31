import { PickReports } from "../../src/background/pick-reports";
import { fakeIndicator, fakePicker, plainErrors } from "./fakes";

function setup() {
  const picker = fakePicker();
  const indicator = fakeIndicator();
  const saver = { save: vi.fn().mockResolvedValue(undefined) };
  return {
    picker,
    indicator,
    saver,
    reports: new PickReports(picker, saver, indicator, plainErrors),
  };
}

describe("PickReports", () => {
  it("stops the other frames, saves the image and clears the button", async () => {
    const { picker, indicator, saver, reports } = setup();

    await reports.picked(9, "https://x/cat.png", "Cats");

    expect(picker.disarm).toHaveBeenCalledWith(9);
    expect(saver.save).toHaveBeenCalledWith("https://x/cat.png", "Cats");
    expect(indicator.showIdle).toHaveBeenCalledWith(9);
  });

  it("shows why a download failed", async () => {
    const { indicator, saver, reports } = setup();
    saver.save.mockRejectedValueOnce(new Error("SERVER_FORBIDDEN"));

    await reports.picked(9, "https://x/cat.png", "Cats");

    expect(indicator.showError).toHaveBeenCalledWith(
      9,
      "explained: SERVER_FORBIDDEN",
    );
  });

  it("clears the button when the page stopped by itself", async () => {
    const { picker, indicator, reports } = setup();

    await reports.disarmed(9);

    expect(picker.disarm).toHaveBeenCalledWith(9);
    expect(indicator.showIdle).toHaveBeenCalledWith(9);
  });

  it("shows the page's reason when it could not read the image", async () => {
    const { picker, indicator, reports } = setup();

    await reports.failed(9, "tainted");

    expect(picker.disarm).toHaveBeenCalledWith(9);
    expect(indicator.showError).toHaveBeenCalledWith(9, "tainted");
  });
});
