export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="border-2 border-red-500">
            {children}
        </div>
    )
} 