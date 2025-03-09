import type { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <main className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="w-full max-w-[400px] p-4">
                <div className="bg-white rounded-lg shadow-sm px-8 py-6 text-center">
                    {children}
                </div>
            </div>
        </main>
    );
}
