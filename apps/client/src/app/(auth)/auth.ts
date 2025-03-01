import { ApiClient, ApiClientLayer } from '@/lib/api-client';
import { Effect } from 'effect';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

// Helper function to run Effect
const runEffect = async <T, E>(effect: Effect.Effect<T, E, ApiClient>) => {
  return Effect.runPromise(
    Effect.provide(
      effect,
      ApiClientLayer
    )
  );
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        try {
          // Try to authenticate with the server API
          const result = await runEffect(
            Effect.gen(function* () {
              const api = yield* ApiClient;
              
              try {
                // Call the real login API
                const loginResult = yield* Effect.either(api.user.loginUser({
                  email,
                  password
                }));
                
                // Check if login was successful
                if (loginResult._tag === 'Right') {
                  const { user, token } = loginResult.right;
                  return [{
                    id: user.id,
                    email: user.email,
                    name: user.firstName,
                    // Store token for future API requests
                    token: token
                  }];
                }
                
                console.error('Login API error:', loginResult.left);
                return [];
              } catch (error) {
                console.error('Error calling login API:', error);
                return [];
              }
            })
          );
          
          if (!result || result.length === 0) return null;
          
          // Return the authenticated user
          return result[0] as User;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Store API token if available
        if ('token' in user) {
          token.apiToken = user.token;
        }
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Add API token to session if available
        if (token.apiToken) {
          (session.user as any).apiToken = token.apiToken;
        }
      }

      return session;
    },
  },
});
