import { MessageCreationError } from "./ChatServiceErrors";

export function sanitizeMessage(text: string): string {
  return text.trim();
}

import type { MessageValidation } from "./ChatServiceApi";

export function validateMessageText(text: string): MessageValidation {
  const errors: string[] = [];
  if (!text || text.trim().length === 0) {
    errors.push("Message text cannot be empty");
  }
  if (text.length > 4000) {
    errors.push("Message text cannot exceed 4000 characters");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
