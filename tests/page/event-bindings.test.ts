import { EventBindings } from "../../src/page/event-bindings";

describe("EventBindings", () => {
  it("listens in the capture phase and takes every listener away again", () => {
    const target = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const undo = vi.fn();
    const bindings = new EventBindings();
    const listener = vi.fn();

    bindings.listen(target, "click", listener);
    bindings.track(undo);
    bindings.clear();
    bindings.clear();

    expect(target.addEventListener).toHaveBeenCalledWith("click", listener, {
      capture: true,
    });
    expect(target.removeEventListener).toHaveBeenCalledOnce();
    expect(target.removeEventListener).toHaveBeenCalledWith("click", listener, {
      capture: true,
    });
    expect(undo).toHaveBeenCalledOnce();
  });
});
