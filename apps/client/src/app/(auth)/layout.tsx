import type { ReactNode } from 'react'

interface AuthLayoutProps {
    children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <main className="container flex min-h-[100dvh] flex-col items-center justify-center">
            <div className="mx-auto w-full max-w-[350px] space-y-6 p-6 rounded-lg">
                {children}
            </div>
        </main>
    )
} 