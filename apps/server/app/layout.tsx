export const metadata = {
    title: 'Buddy API Server',
    description: 'API Server for Buddy',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
} 