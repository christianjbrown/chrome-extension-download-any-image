// The compiler is what holds an entry point to one command per message type,
// so these cases are checked by tsc, and fail the typecheck if the check stops
// working.
import {
  DisarmedCommand,
  FailedCommand,
  SaveCommand,
  SchemeCommand,
} from "../../src/background/background-commands";
import type { BackgroundMessage } from "../../src/shared/messages";
import type { CommandSet } from "../../src/shared/routing";

const reports = {
  picked: vi.fn(),
  disarmed: vi.fn(),
  failed: vi.fn(),
};
const sink = { deviceIs: vi.fn() };

describe("CommandSet", () => {
  it("takes one command for every type", () => {
    const set = {
      save: new SaveCommand(reports),
      disarmed: new DisarmedCommand(reports),
      failed: new FailedCommand(reports),
      scheme: new SchemeCommand(sink),
    } satisfies CommandSet<BackgroundMessage>;

    expect(Object.keys(set)).toHaveLength(4);
  });

  it("refuses a set with a type left out", () => {
    const set = {
      save: new SaveCommand(reports),
      disarmed: new DisarmedCommand(reports),
      failed: new FailedCommand(reports),
      // @ts-expect-error scheme has no command
    } satisfies CommandSet<BackgroundMessage>;

    expect(set).toBeDefined();
  });

  it("refuses a command under another type's name", () => {
    const set = {
      save: new SaveCommand(reports),
      disarmed: new DisarmedCommand(reports),
      // @ts-expect-error a failed command cannot answer scheme
      scheme: new FailedCommand(reports),
      failed: new FailedCommand(reports),
    } satisfies CommandSet<BackgroundMessage>;

    expect(set).toBeDefined();
  });

  it("refuses a type no message has", () => {
    const set = {
      save: new SaveCommand(reports),
      disarmed: new DisarmedCommand(reports),
      failed: new FailedCommand(reports),
      scheme: new SchemeCommand(sink),
      // @ts-expect-error there is no such message
      extra: new SchemeCommand(sink),
    } satisfies CommandSet<BackgroundMessage>;

    expect(set).toBeDefined();
  });
});
