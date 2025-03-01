import { ServerApi } from "@api/core";
import { HttpApiClient } from "@effect/platform";
import { Effect } from "effect";

// Create a client for the server API
const apiClientEffect = HttpApiClient.make(ServerApi, {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
});

// Mock implementation for the API client
export const api = {
    user: {
        loginUser: (data: { email: string; password: string }) =>
            Effect.succeed({
                token: "mock-token",
                user: {
                    id: "1",
                    email: data.email,
                    firstName: "Mock",
                    fullName: "Mock User",
                    type: "user",
                    password: "********",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            }),

        createUser: (data: { email: string; password: string; firstName: string; fullName: string; type: "user" | "admin" }) =>
            Effect.succeed({
                id: "1",
                email: data.email,
                firstName: data.firstName,
                fullName: data.fullName,
                type: data.type,
                password: "********",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }),

        getUser: (id: number) =>
            Effect.succeed({
                id: String(id),
                email: "user@example.com",
                firstName: "Mock",
                fullName: "Mock User",
                type: "user",
                password: "********",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
    }
};

// Helper to run API calls and handle errors
export const runApi = <T, E>(effect: Effect.Effect<T, E, never>) =>
    Effect.runPromise(Effect.either(effect)); 