export interface StyleInjection {
  target: { tabId: number; allFrames: true };
  css: string;
  origin: "USER";
}

export interface StylingApi {
  insertCSS(injection: StyleInjection): Promise<void>;
  removeCSS(injection: StyleInjection): Promise<void>;
}

export interface Cursor {
  show(tabId: number): Promise<void>;
  hide(tabId: number): Promise<void>;
}

// A user style with !important outranks anything the page says, even the page's
// own !important, and Chrome adds it past the page's content security policy.
const CROSSHAIR = "*, *::before, *::after { cursor: crosshair !important; }";

export class CrosshairCursor implements Cursor {
  constructor(private readonly scripting: StylingApi) {}

  show(tabId: number): Promise<void> {
    return this.scripting.insertCSS(this.injection(tabId));
  }

  hide(tabId: number): Promise<void> {
    return this.scripting.removeCSS(this.injection(tabId));
  }

  private injection(tabId: number): StyleInjection {
    return {
      target: { tabId, allFrames: true },
      css: CROSSHAIR,
      origin: "USER",
    };
  }
}
