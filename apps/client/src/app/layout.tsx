import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Toaster } from 'sonner'

import { ThemeProvider } from '@components/app/theme-provider'
import { ErrorBoundary } from '@ui/components/ui/error-boundary'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://buddy.vercel.ai'),
  title: 'Buddy',
  description: 'Your AI companion',
}

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
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
        }
      }}
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html
        lang="en"
        suppressHydrationWarning
      >
        <head>
          <Script id="theme-color" strategy="beforeInteractive">
            {`
              const html = document.documentElement;
              const meta = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
              meta.setAttribute('name', 'theme-color');
              document.head.appendChild(meta);
              
              const updateThemeColor = () => {
                const isDark = html.classList.contains('dark');
                meta.setAttribute('content', isDark ? 'hsl(240deg 10% 3.92%)' : 'hsl(0 0% 100%)');
              };
              
              const observer = new MutationObserver(updateThemeColor);
              observer.observe(html, { attributes: true, attributeFilter: ['class'] });
              updateThemeColor();
            `}
          </Script>
        </head>
        <body className="antialiased">
          <ErrorBoundary>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster position="top-center" />
              {children}
              <Analytics />
            </ThemeProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}