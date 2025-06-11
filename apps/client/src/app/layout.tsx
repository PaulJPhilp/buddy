"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Script from "next/script";
import { Toaster } from "sonner";

import { AppShell } from "@/components/app-shell/AppShell";
import { ThemeProvider } from "@/components/providers/theme-provider";

import { ErrorBoundary } from "@ui/components/ui/error-boundary";

import "./globals.css";

// Configure Geist font variables
// Use variable to set the CSS variable name for the font

// Note: metadata and viewport exports removed since this is a client component
// These would need to be in a server component or page.tsx if needed

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
        <ClerkProvider
          appearance={{
            baseTheme: undefined,
            elements: {
              card: "shadow-none bg-background",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "text-foreground",
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/90",
            },
          }}
          signInFallbackRedirectUrl="/"
        >
          <Script id="theme-color" strategy="beforeInteractive">
            {`
              const html = document.documentElement;
              const meta = document.querySelector('meta[name="theme-color"]') || 
                           document.createElement('meta');
              meta.setAttribute('name', 'theme-color');
              document.head.appendChild(meta);
              
              const updateThemeColor = () => {
                const isDark = html.classList.contains('dark');
                meta.setAttribute('content', 
                  isDark ? 'hsl(240deg 10% 3.92%)' : 'hsl(0 0% 100%)');
              };
              
              const observer = new MutationObserver(updateThemeColor);
              observer.observe(html, { attributes: true, 
                                      attributeFilter: ['class'] });
              updateThemeColor();
            `}
          </Script>
          <ErrorBoundary>
            <ThemeProvider>
              <Toaster position="top-center" />
              <AppShell>{children}</AppShell>
              <Analytics />
            </ThemeProvider>
          </ErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  );
}
