import type { Message } from "@/features/chatapps/features/chatapp/types/chat";

export interface ChatAreaManagerState {
  readonly messages: ReadonlyArray<Message>;
  readonly isTyping: boolean;
  readonly isLoadingHistory: boolean;
  readonly error?: string;
  readonly isNearBottom: boolean;
  readonly showScrollButton: boolean;
}

export interface ChatAreaManagerConfig {
  readonly chatAppId: string;
  readonly initialMessages?: ReadonlyArray<Message>;
}

export interface ChatAreaManagerStats {
  readonly totalMessages: number;
  readonly lastMessageAt?: Date;
}
