interface AuthWrapperProps {
    children: React.ReactNode
    title: string
    description?: string
}

export function AuthWrapper({ children, title, description }: AuthWrapperProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground">{description}</p>
                    )}
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    {children}
                </div>
            </div>
        </div>
    )
} 