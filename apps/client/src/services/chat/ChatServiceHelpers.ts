import { MessageCreationError } from "./ChatServiceErrors";

export function sanitizeMessage(text: string): string {
  return text.trim();
}

export function validateMessageText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new MessageCreationError("Message text cannot be empty");
  }
  
  if (text.length > 4000) {
    throw new MessageCreationError("Message text cannot exceed 4000 characters");
  }
}
