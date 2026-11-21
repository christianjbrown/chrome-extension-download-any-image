// What routing a message to its handler is made of.

// The fields every message has.
export interface Message {
  target: string;
  type: string;
}

// Who sent a message, as far as Chrome says.
export interface Sender {
  id?: string | undefined;
  tab?: { id?: number | undefined } | undefined;
}

// What a context does with one type of message. A new message is a new
// command, handed to the router with the others.
export interface Command<M extends Message, T extends M["type"] = M["type"]> {
  readonly type: T;
  handle(message: Extract<M, { type: T }>, sender: Sender): Promise<unknown>;
}

// Exactly one command for every type of message, each under its own type. An
// entry point builds its commands as one of these, so the compiler refuses a
// type with no command, a command twice, or one under the wrong type.
export type CommandSet<M extends Message> = {
  [T in M["type"]]: Command<M, T>;
};

// Whether a message that names a type also carries the fields that type needs.
export type MessageGuards<M extends { type: string }> = {
  [T in M["type"]]: (message: unknown) => message is Extract<M, { type: T }>;
};

// Decides whether a message is one this context should answer at all.
export interface MessageGate<M extends Message> {
  admits(message: unknown, sender: Sender | undefined): message is M;
}
