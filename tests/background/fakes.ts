import type { Mocked } from "vitest";
import type { ListenerHold } from "../../src/background/name-requests";
import type { PickIndicator } from "../../src/background/pick-indicator";
import type { ErrorExplainer, Picker } from "../../src/background/picking";

export function fakePicker(armed = false): Mocked<Picker> {
  return {
    arm: vi.fn<Picker["arm"]>().mockResolvedValue(undefined),
    disarm: vi.fn<Picker["disarm"]>().mockResolvedValue(armed),
  };
}

export function fakeIndicator(): Mocked<PickIndicator> {
  return {
    showIdle: vi.fn<PickIndicator["showIdle"]>().mockResolvedValue(undefined),
    showArmed: vi.fn<PickIndicator["showArmed"]>().mockResolvedValue(undefined),
    showError: vi.fn<PickIndicator["showError"]>().mockResolvedValue(undefined),
  };
}

export const plainErrors: ErrorExplainer = {
  explain: (error) => `explained: ${(error as Error).message}`,
};

// An event that only remembers which listeners are on it.
export interface FakeRegistry<Listener> {
  listeners: Listener[];
  addListener: Mocked<(listener: Listener) => void>;
  removeListener: Mocked<(listener: Listener) => void>;
}

export function fakeRegistry<Listener>(): FakeRegistry<Listener> {
  const listeners: Listener[] = [];
  return {
    listeners,
    addListener: vi.fn((listener: Listener) => {
      listeners.push(listener);
    }),
    removeListener: vi.fn((listener: Listener) => {
      listeners.splice(listeners.indexOf(listener), 1);
    }),
  };
}

export function fakeHold(): Mocked<ListenerHold> {
  return {
    hold: vi.fn<ListenerHold["hold"]>(),
    release: vi.fn<ListenerHold["release"]>(),
  };
}
