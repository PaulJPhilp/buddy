import { Effect } from "effect";
import { ReactNode } from "react";

export interface ChatAppProps {
  error: string | null;
  onDismissErrorAction?: Effect.Effect<void, Error>;
  onCloseAction?: Effect.Effect<void, Error>;
}

export function ChatApp(props: ChatAppProps): ReactNode;

export interface ChatMessageProps {
  role: string;
  content: ReactNode;
}

export function ChatMessage(props: ChatMessageProps): ReactNode;
