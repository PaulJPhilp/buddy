// Types for ChatBubbleManager

export interface ChatBubbleState {
  readonly messageId: string;
  readonly isStreaming: boolean;
  readonly hasError: boolean;
  readonly reactions: Record<string, number>; // emoji -> count
  readonly isEdited: boolean;
  readonly isCopied: boolean;
  readonly errorMessage?: string;
}
