'use server';

import { ApiClient, ApiClientLayer } from '@/lib/api-client';
import { Effect } from 'effect';
import { z } from 'zod';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Helper function to run Effect
const runEffect = async <T, E>(effect: Effect.Effect<T, E, ApiClient>) => {
  return Effect.runPromise(
    Effect.provide(
      effect,
      ApiClientLayer
    )
  );
};

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // For development testing
    if (process.env.NODE_ENV === 'development' && validatedData.email === 'test@example.com') {
      console.log(`Login simulated for: ${validatedData.email}`);
      
      // Attempt to sign in via Next Auth
      try {
        await signIn('credentials', {
          email: validatedData.email,
          password: validatedData.password,
          redirect: false,
        });
        
        return { status: 'success' };
      } catch (error) {
        console.error('Login error in dev mode:', error);
        return { status: 'success' }; // Still return success in dev mode
      }
    }

    // In production, attempt to log in via credentials
    try {
      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Login error:', result.error);
        return { status: 'failed' };
      }

      return { status: 'success' };
    } catch (error) {
      console.error('Login process error:', error);
      return { status: 'failed' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    console.error('Login error:', error);
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // For development testing
    if (process.env.NODE_ENV === 'development' && validatedData.email === 'test@example.com') {
      console.log(`User registration simulated for: ${validatedData.email}`);
      return { status: 'success' };
    }

    // Extract first name from email
    const firstName = validatedData.email.split('@')[0];
    
    try {
      console.log("Attempting to create user at:", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
      
      // Build a proper user creation object that matches server expectations
      const userData = {
        email: validatedData.email,
        password: validatedData.password,
        firstName: firstName,
        fullName: firstName,
        type: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Sending user data:", JSON.stringify(userData));
      
      // Attempt to create user with direct API call
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: AbortSignal.timeout(8000)
      });

      // We got a response, so no connection issue
      console.log("API response status:", result.status);
      
      try {
        const data = await result.json();
        console.log("API response data:", data);
        
        if (!result.ok) {
          if (data.error && typeof data.error === 'string') {
            if (data.error.includes('duplicate')) {
              return { status: 'user_exists' };
            }
            console.error('API error:', data.error);
          }
          return { status: 'failed' };
        }
        
        // Registration successful - but no auto sign-in
        console.log('User registered successfully');
        return { status: 'success' };
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        return { status: 'failed' };
      }
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Try to provide more specific error information
      if (error instanceof TypeError && error.message.includes('fetch failed')) {
        console.error('Connection error: The server may not be running on port 3001');
      }
      
      return { status: 'failed' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    console.error('Registration error:', error);
    return { status: 'failed' };
  }
};