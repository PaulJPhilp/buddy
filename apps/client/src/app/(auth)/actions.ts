'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export type LoginActionState = {
    status: 'idle' | 'loading' | 'success' | 'failed' | 'invalid_data'
}

export type RegisterActionState = {
    status: 'idle' | 'loading' | 'success' | 'failed' | 'invalid_data' | 'user_exists'
}

export async function login(_: LoginActionState, formData: FormData): Promise<LoginActionState> {
    try {
        const result = loginSchema.safeParse({
            email: formData.get('email'),
            password: formData.get('password'),
        })

        if (!result.success) {
            return { status: 'invalid_data' }
        }

        const { userId } = await auth()
        if (!userId) {
            return { status: 'failed' }
        }

        return { status: 'success' }
    } catch (error) {
        return { status: 'failed' }
    }
}

export async function register(_: RegisterActionState, formData: FormData): Promise<RegisterActionState> {
    try {
        const result = loginSchema.safeParse({
            email: formData.get('email'),
            password: formData.get('password'),
        })

        if (!result.success) {
            return { status: 'invalid_data' }
        }

        const { userId } = await auth()
        if (userId) {
            return { status: 'user_exists' }
        }

        return { status: 'success' }
    } catch (error) {
        return { status: 'failed' }
    }
} 