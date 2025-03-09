import { ApiClient, ApiClientLayer } from "@/lib/api-client";
import { Effect, Redacted } from "effect";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      token?: string;
    };
  }
}

type LoginCredentials = Record<"email" | "password", string>;

const runEffect = async <T, E>(effect: Effect.Effect<T, E, ApiClient>) => {
  return Effect.runPromise(Effect.provide(effect, ApiClientLayer));
};

export const authConfig = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const creds = credentials as LoginCredentials;
          if (!creds?.email || !creds?.password) {
            return null;
          }

          const result = await runEffect(
            Effect.gen(function* () {
              const api = yield* ApiClient;

              try {
                // Call the real login API
                const loginResult = yield* Effect.either(
                  api.user.loginUser({
                    payload: {
                      email: creds.email,
                      password: Redacted.make(creds.password),
                    },
                  }),
                );

                // Check if login was successful
                if (loginResult._tag === "Right") {
                  const { user, token } = loginResult.right;
                  return {
                    id: user.id,
                    email: user.email,
                    name: user.firstName,
                    token,
                  };
                }

                console.error("Login API error:", loginResult.left);
                return null;
              } catch (error) {
                console.error("Error calling login API:", error);
                return null;
              }
            }),
          );

          return result;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        // Store API token if available
        if ("token" in user) {
          token.apiToken = user.token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        // Add API token to session if available
        if (token.apiToken) {
          session.user.token = token.apiToken as string;
        }
      }
      return session;
    },
  },
});
