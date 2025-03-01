// Re-export types from the API package
import { Prompt, PromptApiGroup, PromptVoice, ServerApi, User } from "@api/core";

export type { Prompt, PromptApiGroup, PromptVoice, ServerApi, User };

// Define additional types as needed
export interface LoginActionState {
    status: "idle" | "failed" | "success" | "invalid_data";
    message?: string;
}

export interface RegisterActionState {
    status: "idle" | "failed" | "success" | "invalid_data" | "user_exists";
    message?: string;
} 