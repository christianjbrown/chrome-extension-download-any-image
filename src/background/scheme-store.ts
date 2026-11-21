import { isColourScheme, type ColourScheme } from "../shared/colour-scheme";
import { isObject } from "../shared/objects";
import type { SchemeMemory, SchemeState } from "./scheme-ports";

export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

const STORAGE_KEY = "toolbarScheme";

const chromeFrom = (value: unknown): ColourScheme | null =>
  isColourScheme(value) ? value : null;

// Keeps what is known about the toolbar's colour across service worker sleeps
// and Chrome restarts, so the button is right before anyone clicks it again.
export class SchemeStore implements SchemeMemory {
  constructor(
    private readonly area: StorageArea,
    // What to start from when nothing usable was saved.
    private readonly unknown: SchemeState,
  ) {}

  async load(): Promise<SchemeState> {
    const stored = (await this.area.get(STORAGE_KEY))[STORAGE_KEY];
    return isObject(stored) ? this.fromStored(stored) : this.unknown;
  }

  private fromStored({ device, chrome }: Record<string, unknown>): SchemeState {
    return { device: this.deviceFrom(device), chrome: chromeFrom(chrome) };
  }

  private deviceFrom(value: unknown): ColourScheme {
    return isColourScheme(value) ? value : this.unknown.device;
  }

  save(state: SchemeState): Promise<void> {
    return this.area.set({ [STORAGE_KEY]: state });
  }
}
