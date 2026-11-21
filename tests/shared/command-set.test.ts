// The compiler is what holds an entry point to one command and one guard per
// message type, so these cases are checked by tsc, and fail the typecheck if
// the check stops working.
import {
  DisarmedCommand,
  FailedCommand,
  SaveCommand,
  SchemeCommand,
} from "../../src/background/background-commands";
import {
  DisarmedGuard,
  FailedGuard,
  SaveGuard,
  SchemeGuard,
} from "../../src/shared/message-guards";
import type { BackgroundMessage } from "../../src/shared/messages";
import type { CommandSet, GuardSet } from "../../src/shared/routing";

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

describe("GuardSet", () => {
  it("takes one guard for every type", () => {
    const set = {
      save: new SaveGuard(1),
      disarmed: new DisarmedGuard(),
      failed: new FailedGuard(1),
      scheme: new SchemeGuard(),
    } satisfies GuardSet<BackgroundMessage>;

    expect(Object.keys(set)).toHaveLength(4);
  });

  it("refuses a set with a type left out", () => {
    const set = {
      save: new SaveGuard(1),
      disarmed: new DisarmedGuard(),
      failed: new FailedGuard(1),
      // @ts-expect-error scheme has no guard
    } satisfies GuardSet<BackgroundMessage>;

    expect(set).toBeDefined();
  });

  it("refuses a guard under another type's name", () => {
    const set = {
      save: new SaveGuard(1),
      disarmed: new DisarmedGuard(),
      // @ts-expect-error a failed guard cannot check scheme
      scheme: new FailedGuard(1),
      failed: new FailedGuard(1),
    } satisfies GuardSet<BackgroundMessage>;

    expect(set).toBeDefined();
  });
});
