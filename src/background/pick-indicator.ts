// What the toolbar button says about the picker in one tab.
export interface PickIndicator {
  showIdle(tabId: number): Promise<void>;
  showArmed(tabId: number): Promise<void>;
  showError(tabId: number, message: string): Promise<void>;
}
