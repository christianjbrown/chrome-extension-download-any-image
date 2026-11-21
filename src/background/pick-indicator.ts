// What the toolbar button says about the picker in one tab, split by who needs
// which: a new page only puts it back to idle, an outcome is idle or an error,
// and only the toggle shows it armed.
export interface IdleIndicator {
  showIdle(tabId: number): Promise<void>;
}

export interface OutcomeIndicator extends IdleIndicator {
  showError(tabId: number, message: string): Promise<void>;
}

export interface PickIndicator extends OutcomeIndicator {
  showArmed(tabId: number): Promise<void>;
}
