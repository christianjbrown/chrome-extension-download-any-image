import { schemeFor, type ColourScheme } from "../shared/colour-scheme";
import type { SchemeReader } from "./scheme-ports";

export interface ScriptRunner {
  executeScript(injection: {
    target: { tabId: number };
    func: () => boolean;
  }): Promise<{ result?: unknown }[]>;
}

// Runs inside the tab, so it can use nothing from this file: Chrome sends the
// function's own text across, and the query has to be written out in it. A
// test pins it to DARK_SCHEME_QUERY.
const resultOf = (frame: { result?: unknown } | undefined): unknown =>
  frame?.result;

const schemeOf = (result: unknown): ColourScheme | undefined =>
  typeof result === "boolean" ? schemeFor(result) : undefined;

export function tabPrefersDark(): boolean {
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

// Reads the colour scheme from a page in a tab, which follows Chrome's own
// Light and Dark setting. Only works in a tab the extension has been let into.
export class TabScheme implements SchemeReader {
  constructor(private readonly scripting: ScriptRunner) {}

  // Chrome's own pages, and tabs that have closed, cannot be asked.
  async read(tabId: number): Promise<ColourScheme | undefined> {
    try {
      return await this.ask(tabId);
    } catch {
      return undefined;
    }
  }

  private async ask(tabId: number): Promise<ColourScheme | undefined> {
    const [frame] = await this.scripting.executeScript({
      target: { tabId },
      func: tabPrefersDark,
    });
    return schemeOf(resultOf(frame));
  }
}
