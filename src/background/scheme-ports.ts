// What the colour-scheme parts of the service worker ask of each other.
import type { ColourScheme } from "../shared/colour-scheme";

// Reading the colour scheme a tab shows.
export interface SchemeReader {
  read(tabId: number): Promise<ColourScheme | undefined>;
}

// What a tab showed.
export interface TabSchemeSink {
  tabShows(scheme: ColourScheme): Promise<void>;
}

// What the offscreen document reports.
export interface DeviceSchemeSink {
  deviceIs(scheme: ColourScheme): Promise<void>;
}

// Where what is known survives the service worker sleeping.
export interface SchemeMemory {
  load(): Promise<SchemeState>;
  save(state: SchemeState): Promise<void>;
}

// The toolbar icon for a colour scheme.
export interface SchemeIcon {
  show(scheme: ColourScheme): Promise<void>;
}

// What is known about the colour of Chrome's toolbar.
//
// Chrome has its own Light and Dark setting, which can differ from the
// device's. The offscreen document only ever sees the device's, and only a
// page in a tab sees Chrome's, so both are kept.
export interface SchemeState {
  // What the device is in, as the offscreen document last saw it.
  device: ColourScheme;
  // What Chrome is set to, once a tab has shown that it differs from the device.
  chrome: ColourScheme | null;
}

// How each report moves the state on, and which scheme the toolbar is in.
export interface SchemePolicy {
  afterDevice(state: SchemeState, device: ColourScheme): SchemeState;
  afterTab(state: SchemeState, tab: ColourScheme): SchemeState;
  toolbarScheme(state: SchemeState): ColourScheme;
}
