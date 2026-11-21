import type { Command } from "../shared/routing";
import { SCHEME, type SchemeMessage } from "../shared/scheme-message";
import type { DeviceSchemeSink } from "./scheme-ports";

// The offscreen document saw the device's colour scheme.
export class SchemeCommand implements Command<SchemeMessage> {
  readonly type = SCHEME;

  constructor(private readonly sink: DeviceSchemeSink) {}

  handle(message: SchemeMessage): Promise<void> {
    return this.sink.deviceIs(message.scheme);
  }
}
