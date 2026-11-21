import type { ButtonLook, Look, LookSet } from "./button-looks";
import type { ButtonKind, ButtonState } from "./button-states";
import type { PickIndicator } from "./pick-indicator";
import type { ToolbarAction } from "./toolbar-action";

// Each tab has its own picker, so each tab's button has its own look, taken
// from the set of looks it is given.
export class ToolbarIndicator implements PickIndicator {
  constructor(
    private readonly action: ToolbarAction,
    private readonly looks: LookSet,
  ) {}

  async show(tabId: number, state: ButtonState): Promise<void> {
    const look = this.lookOf(state);
    await Promise.all([
      this.action.setBadgeText({ tabId, text: look.badge }),
      this.action.setBadgeBackgroundColor({ tabId, color: look.colour }),
      this.action.setTitle({ tabId, title: look.title }),
    ]);
  }

  private lookOf<K extends ButtonKind>(state: ButtonState<K>): Look {
    const look: ButtonLook<K> = this.looks[state.kind];
    return look.look(state);
  }
}
