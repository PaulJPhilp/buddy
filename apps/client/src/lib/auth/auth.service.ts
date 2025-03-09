import { Effect } from "effect";
import { z } from "zod";

// Response schemas
export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    firstName: z.string(),
    fullName: z.string(),
    email: z.string(),
    type: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Request schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const RegisterRequestSchema = z.object({
  firstName: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  password: z.string(),
  type: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// API endpoints
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const AUTH_ENDPOINTS = {
  login: `${API_BASE}/user/loginUser`,
  register: `${API_BASE}/user/createUser`,
  logout: `${API_BASE}/user/logout`,
} as const;

// Error types
export interface AuthError {
  _tag: "AuthError";
  message: string;
}

function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === "AuthError"
  );
}

export const makeAuthError = (message: string): AuthError => ({
  _tag: "AuthError",
  message,
});

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw makeAuthError(
      errorData.message || `Request failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  return data;
};

// Service functions
export const login = (credentials: LoginRequest) =>
  Effect.tryPromise({
    try: async () => {
      console.log("Attempting login to:", AUTH_ENDPOINTS.login);
      const response = await fetch(AUTH_ENDPOINTS.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      }).catch((error) => {
        console.error("Network error during login:", error);
        throw makeAuthError(
          `Network error: Unable to connect to ${AUTH_ENDPOINTS.login}`,
        );
      });

      console.log("Login response status:", response.status);
      const data = await handleApiResponse<AuthResponse>(response);
      return AuthResponseSchema.parse(data);
    },
    catch: (error: unknown) => {
      console.error("Login error details:", error);
      if (isAuthError(error)) return error;
      return makeAuthError(
        error instanceof Error ? error.message : "Login failed",
      );
    },
  });

export const register = (userData: RegisterRequest) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(AUTH_ENDPOINTS.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      }).catch((error) => {
        console.error("Network error:", error);
        throw makeAuthError("Network error: Unable to connect to the server");
      });

      const data = await handleApiResponse<AuthResponse>(response);
      return AuthResponseSchema.parse(data);
    },
    catch: (error: unknown) => {
      console.error("Registration error:", error);
      if (isAuthError(error)) return error;
      return makeAuthError(
        error instanceof Error ? error.message : "Registration failed",
      );
    },
  });

export const logout = () =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(AUTH_ENDPOINTS.logout, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      }).catch((error) => {
        console.error("Network error:", error);
        throw makeAuthError("Network error: Unable to connect to the server");
      });

      await handleApiResponse(response);
      return true;
    },
    catch: (error: unknown) => {
      console.error("Logout error:", error);
      if (isAuthError(error)) return error;
      return makeAuthError("Logout failed");
    },
  });
