"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { AppShell } from "@/components/AppShell/AppShell";

import { AgentService } from "@/services/agent";
import { AppService } from "@/services/app";
import { ToolbarService } from "@/services/toolbar";
import { ChatAppConfig } from "@/types/global";

import { Effect, Layer } from "effect";

import { ErrorBoundary } from "@ui/components/ui/error-boundary";

import "./globals.css";
import ChatContainer from "@/components/Chat/ChatContainer";

// Configure Geist font variables
// Use variable to set the CSS variable name for the font

// Note: metadata and viewport exports removed since this is a client component
// These would need to be in a server component or page.tsx if needed

// Create service layer outside component (static)
const serviceLayer = Layer.mergeAll(
  AppService.Default,
  AgentService.Default,
  ToolbarService.Default,
);

// Server component wrapper for the layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [chatApps, setChatApps] = useState<ChatAppConfig[]>([]);
  // List of currently displayed chat apps (additive)
  const [displayedConfigs, setDisplayedConfigs] = useState<ChatAppConfig[]>([]);

  // Track last selected for theme editing convenience
  const [activeConfig, setActiveConfig] = useState<ChatAppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all chat app configs on mount and auto-select first one
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Effect.runPromise(
      Effect.gen(function* () {
        const appService = yield* AppService;

        const apps = yield* appService.getAll();
        if (!cancelled) {
          setChatApps(apps);
          // Auto-select first app if available
          if (apps.length > 0) {
            setActiveConfig(apps[0]);
          }
        }
      }).pipe(Effect.provide(serviceLayer)),
    ).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for additive chat app events
  useEffect(() => {
    console.log("🎧 Layout: Setting up buddy:addChatApp event listener");

    const handler = (e: Event) => {
      console.log("🎧 Layout: Received buddy:addChatApp event:", e);
      const payload = (e as CustomEvent<any>).detail;
      console.log("🎧 Layout: Event payload:", payload);

      if (!payload) {
        console.log("🎧 Layout: No payload, ignoring event");
        return;
      }

      const appConfig: ChatAppConfig | undefined =
        typeof payload === "string"
          ? chatApps.find((a) => a.id === payload)
          : (payload as ChatAppConfig);

      console.log("🎧 Layout: Resolved appConfig:", appConfig);
      if (!appConfig) {
        console.log("🎧 Layout: No appConfig found, ignoring event");
        return;
      }

      // Avoid duplicates
      console.log(
        "🎧 Layout: Checking for duplicates in displayedConfigs:",
        displayedConfigs.map((c) => c.id),
      );
      if (displayedConfigs.some((c) => c.id === appConfig.id)) {
        console.log(
          `🎧 Layout: Config ${appConfig.id} already exists, setting as active`,
        );
        const existingConfig = displayedConfigs.find(
          (c) => c.id === appConfig.id,
        );
        if (existingConfig) {
          console.log(
            "🎧 Layout: Setting activeConfig to:",
            existingConfig.id,
            existingConfig.theme,
          );
          setActiveConfig(existingConfig);

          // IMPORTANT: Apply style directly when switching apps
          console.log(
            "🎧 Layout: Applying existing config style:",
            existingConfig.theme,
          );
          console.log(
            `🎧 Layout: Successfully activated existing config ${existingConfig.id}`,
          );
        }
        return;
      }

      // Enrich and add
      console.log("🎧 Layout: Processing appConfig:", appConfig);
      console.log(
        "🎧 Layout: AppConfig has embedded theme:",
        !!appConfig.theme,
      );

      // Process config synchronously to avoid race conditions in tests
      let cfg = appConfig;

      // Use embedded theme if available
      if (cfg.theme) {
        console.log("🎧 Layout: Using embedded theme:", cfg.theme);
        // Theme is already embedded, no need to load from service
      } else {
        console.log("🎧 Layout: No theme available, using default");
        cfg = { ...cfg, theme: {} } as ChatAppConfig;
      }

      console.log("🎧 Layout: Final config with theme:", cfg);
      console.log(`🎧 Layout: Adding config ${cfg.id} to displayedConfigs`);

      setDisplayedConfigs((prev) => {
        const next = [...prev, cfg];
        console.log(
          `🎧 Layout: Updated displayedConfigs:`,
          next.map((c) => c.id),
        );
        return next;
      });
      setActiveConfig(cfg);
      console.log("🎧 Layout: Config object:", cfg);
      console.log("🎧 Layout: Config.theme:", cfg.theme);
      console.log("🎧 Layout: Applying config style:", cfg.theme);
      console.log(
        `🎧 Layout: Successfully added and activated config ${cfg.id}`,
      );
    };

    window.addEventListener("buddy:addChatApp", handler);
    return () => window.removeEventListener("buddy:addChatApp", handler);
  }, [chatApps, displayedConfigs]);

  // Update activeConfig when displayedConfigs changes and we don't have an active config
  useEffect(() => {
    if (!activeConfig && displayedConfigs.length > 0) {
      // Auto-select first config
      console.log(
        "🎨 Layout: Auto-selecting first config:",
        displayedConfigs[0].id,
        displayedConfigs[0].theme,
      );
      setActiveConfig(displayedConfigs[0]);
    }
  }, [displayedConfigs, activeConfig]);

  // Determine if we should show the multi-app grid or children
  const isHomePage = pathname === "/";
  const shouldShowMultiAppGrid = isHomePage && displayedConfigs.length > 0;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body
        className="h-full antialiased"
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
            <Toaster position="top-center" />
            {loading ? (
              <div className="h-screen w-full flex items-center justify-center">
                Loading...
              </div>
            ) : isHomePage ? (
              <AppShell>
                {activeConfig ? (
                  <ChatContainer config={activeConfig} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p>No chat app selected</p>
                  </div>
                )}
              </AppShell>
            ) : (
              <AppShell>{children}</AppShell>
            )}
            <Analytics />
          </ErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  );
}
