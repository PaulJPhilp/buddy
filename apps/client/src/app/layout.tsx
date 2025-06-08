import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
// Import the client component
import { ClientLayout } from "./client-components";

import "./globals.css";

// Configure Geist font variables
// Use variable to set the CSS variable name for the font

// This is a Server Component that can define metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://buddy.vercel.ai"),
  title: "Buddy",
  description: "Your AI companion",
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

// Server component wrapper for the layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body
        className="antialiased"
        style={{ overscrollBehaviorX: "auto" }}
        suppressHydrationWarning
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
