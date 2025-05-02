import type { MessageValidation } from "./ChatServiceApi"
import { MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH } from "./ChatServiceApi"

/**
 * Validates message text against length and content safety requirements
 */
export function validateMessageText(text: string): MessageValidation {
    const errors: string[] = []

    if (!text || text.trim().length < MIN_MESSAGE_LENGTH) {
        errors.push(`Message must be at least ${MIN_MESSAGE_LENGTH} character long`)
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
        errors.push(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`)
    }

    // Basic XSS/injection prevention
    if (/<script|javascript:|data:/i.test(text)) {
        errors.push("Message contains potentially unsafe content")
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Sanitizes message text by removing HTML tags and restricting to safe characters
 */
export function sanitizeMessage(text: string): string {
    return text
        .trim()
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[^\w\s.,!?-]/g, "") // Only allow basic punctuation and alphanumeric
} 