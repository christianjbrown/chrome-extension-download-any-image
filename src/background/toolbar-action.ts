// The part of chrome.action that paints one tab's button.
export interface ToolbarAction {
  setBadgeText(details: { tabId: number; text: string }): Promise<void>;
  setBadgeBackgroundColor(details: {
    tabId: number;
    color: string;
  }): Promise<void>;
  setTitle(details: { tabId: number; title: string }): Promise<void>;
}
