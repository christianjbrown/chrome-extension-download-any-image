import { ToggleController } from "../../src/background/toggle-controller";
import { fakeIndicator, fakePicker, plainErrors } from "./fakes";

describe("ToggleController", () => {
  it("arms a tab that was not armed", async () => {
    const picker = fakePicker(false);
    const indicator = fakeIndicator();

    await new ToggleController(picker, indicator, plainErrors).toggle({
      id: 5,
    });

    expect(picker.arm).toHaveBeenCalledWith(5);
    expect(indicator.showArmed).toHaveBeenCalledWith(5);
  });

  it("disarms a tab that was armed, and does not arm it again", async () => {
    const picker = fakePicker(true);
    const indicator = fakeIndicator();

    await new ToggleController(picker, indicator, plainErrors).toggle({
      id: 5,
    });

    expect(picker.arm).not.toHaveBeenCalled();
    expect(indicator.showIdle).toHaveBeenCalledWith(5);
  });

  it("explains a refusal on the button and tidies up", async () => {
    const picker = fakePicker(false);
    picker.arm.mockRejectedValueOnce(new Error("Cannot access"));
    const indicator = fakeIndicator();

    await new ToggleController(picker, indicator, plainErrors).toggle({
      id: 5,
    });

    expect(indicator.showError).toHaveBeenCalledWith(
      5,
      "explained: Cannot access",
    );
    expect(picker.disarm).toHaveBeenCalledTimes(2);
  });

  it("does nothing for a tab without an id", async () => {
    const picker = fakePicker();

    await new ToggleController(picker, fakeIndicator(), plainErrors).toggle({});

    expect(picker.disarm).not.toHaveBeenCalled();
  });

  it("ignores a second click on the same tab while the first is arming", async () => {
    const picker = fakePicker(false);
    let finish = (): void => undefined;
    picker.arm.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const controller = new ToggleController(
      picker,
      fakeIndicator(),
      plainErrors,
    );

    const first = controller.toggle({ id: 5 });
    await vi.waitFor(() => {
      expect(picker.arm).toHaveBeenCalled();
    });
    await controller.toggle({ id: 5 });
    finish();
    await first;
    await controller.toggle({ id: 5 });

    expect(picker.disarm).toHaveBeenCalledTimes(2);
  });
});
