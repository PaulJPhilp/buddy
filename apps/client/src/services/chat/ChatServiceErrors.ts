export class HistoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoryError";
  }
  description = "Error accessing chat history";
  method = "getHistory";
}

export class MessageCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessageCreationError";
  }
  description = "Error creating message";
  method = "sendMessage";
}

export class StateUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateUpdateError";
  }
  description = "Error updating chat state";
  method = "setState";
}
