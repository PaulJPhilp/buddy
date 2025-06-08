"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { AppShell } from "@/components/app-shell/AppShell";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ChatRuntimeProvider } from "@/contexts/ChatRuntimeContext";
import { ErrorBoundary } from "@ui/components/ui/error-boundary";

// Client-side only component wrapper
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 
                          border-primary mx-auto mb-4"
          />
          <div className="text-lg font-semibold">Loading application...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Client layout component
export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
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
                isDark ? 'hsl(240 10% 3.92%)' : 'hsl(0 0% 100%)');
            };
            
            const observer = new MutationObserver(updateThemeColor);
            observer.observe(html, { attributes: true, 
                                    attributeFilter: ['class'] });
            updateThemeColor();
          `}
        </Script>
        <ErrorBoundary>
          <ThemeProvider>
            <ChatRuntimeProvider>
              <Toaster position="top-center" />
              <AppShell>{children}</AppShell>
              <Analytics />
            </ChatRuntimeProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </ClerkProvider>
    </ClientOnly>
  );
}
