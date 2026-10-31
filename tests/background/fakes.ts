import type { Mocked } from "vitest";
import type { ErrorExplainer } from "../../src/background/chrome-errors";
import type { PickIndicator } from "../../src/background/pick-indicator";
import type { Picker } from "../../src/background/tab-picker";

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
