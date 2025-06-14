"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { AppShell } from "@/components/app-shell/AppShell";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ChatAppProvider } from "@/contexts/ChatAppContext";
import { initializeBootstrapFromLocalStorageDevOnly } from "@/devBootstrapLoader";

import { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import { AgentService } from "@/services/agent";
import { AppService } from "@/services/app";
import { ThemesService } from "@/services/themes";
import { ToolbarService } from "@/services/toolbar";

import { Effect, Layer } from "effect";

import { ErrorBoundary } from "@ui/components/ui/error-boundary";

import "./globals.css";
import ChatContainer from "@/components/chat/ChatContainer";

// Configure Geist font variables
// Use variable to set the CSS variable name for the font

// Note: metadata and viewport exports removed since this is a client component
// These would need to be in a server component or page.tsx if needed

// Create service layer outside component (static)
const serviceLayer = Layer.mergeAll(
  AppService.Default,
  AgentService.Default,
  ToolbarService.Default,
  ThemesService.Default,
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

  // Initialize dev bootstrap loader on app startup
  useEffect(() => {
    initializeBootstrapFromLocalStorageDevOnly();
  }, []);

  // Load all available chat apps from index.json on startup
  useEffect(() => {
    const loadAllChatApps = async () => {
      try {
        console.log("🚀 Loading all chat apps from index.json...");

        // Fetch the index.json to get list of config files
        const indexRes = await fetch("/configs/index.json");
        if (!indexRes.ok) {
          console.warn("Could not load index.json, skipping chat app loading");
          return;
        }

        const configFiles = (await indexRes.json()) as string[];
        console.log("📋 Found config files:", configFiles);

        const allChatApps: any[] = [];

        // Load each config file and extract chat apps
        for (const filename of configFiles) {
          try {
            const configRes = await fetch(`/configs/${filename}`);
            if (!configRes.ok) {
              console.warn(`Could not load ${filename}, skipping`);
              continue;
            }

            const configData = await configRes.json();
            console.log(`📄 Loaded config ${filename}:`, configData);

            // Extract chat apps from this config
            if (configData.chatApps && Array.isArray(configData.chatApps)) {
              for (const chatApp of configData.chatApps) {
                // Enrich with theme if available
                if (
                  chatApp.themeId &&
                  configData.themes &&
                  configData.themes[chatApp.themeId]
                ) {
                  chatApp.theme = configData.themes[chatApp.themeId];
                }
                allChatApps.push(chatApp);
              }
            }
          } catch (error) {
            console.warn(`Failed to load config ${filename}:`, error);
          }
        }

        console.log("💾 Loaded all chat apps:", allChatApps);
      } catch (error) {
        console.error("❌ Failed to load chat apps from index.json:", error);
      }
    };

    loadAllChatApps();
  }, []);

  // Load all chat app configs on mount (no activeConfig dependency)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Effect.runPromise(
      Effect.gen(function* () {
        const appService = yield* AppService;
        const themesService = yield* ThemesService;

        const apps = yield* appService.getAll();
        if (!cancelled) setChatApps(apps);
      }).pipe(Effect.provide(serviceLayer)),
    ).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Note: No automatic chat app display - users select from dropdown

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

      Effect.runPromise(
        Effect.gen(function* () {
          const themesService = yield* ThemesService;
          let cfg = appConfig;

          // Use embedded theme if available, otherwise try to load from service
          if (cfg.theme) {
            console.log("🎧 Layout: Using embedded theme:", cfg.theme);
            // Theme is already embedded, no need to load from service
          } else if (cfg.themeId) {
            console.log(
              "🎧 Layout: Loading theme from service for themeId:",
              cfg.themeId,
            );
            const theme = yield* themesService.getTheme(cfg.themeId);
            console.log("🎧 Layout: Loaded theme from service:", theme);
            cfg = { ...cfg, theme: theme ?? {} } as ChatAppConfig;
          } else {
            console.log("🎧 Layout: No theme available, using default");
            cfg = { ...cfg, theme: {} } as ChatAppConfig;
          }

          console.log("🎧 Layout: Final config with theme:", cfg);
          return cfg;
        }).pipe(Effect.provide(serviceLayer)),
      ).then((cfg) => {
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
      });
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

  // Note: Removed global style application - each ChatContainer now applies its own style

  // Helper to update theme for a specific config
  const handleThemeChangeFor = (config: ChatAppConfig, newTheme: any) => {
    console.log("[Layout] handleThemeChangeFor", config.id, newTheme);

    // Update displayedConfigs array immutably
    setDisplayedConfigs((prev) => {
      const next = prev.map((c) =>
        c.id === config.id ? { ...c, theme: newTheme } : c,
      );
      return next;
    });

    // Update activeConfig if this config is currently active
    if (activeConfig?.id === config.id) {
      setActiveConfig({ ...config, theme: newTheme });
    }

    // Persist via services in background
    Effect.runPromise(
      Effect.gen(function* () {
        const appService = yield* AppService;
        const themesService = yield* ThemesService;

        if (config.themeId) {
          yield* themesService.setTheme(config.themeId, newTheme);
          yield* themesService.saveThemes({ chatIds: [config.themeId] });
        }

        yield* appService.update(config.id, { theme: newTheme });
      }).pipe(Effect.provide(serviceLayer)),
    );
  };

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
            <ThemeProvider>
              <Toaster position="top-center" />
              {loading ? (
                <div className="h-screen w-full flex items-center justify-center">
                  Loading...
                </div>
              ) : shouldShowMultiAppGrid ? (
                <AppShell>
                  {displayedConfigs.length === 1 ? (
                    <div className="flex-1 h-full flex flex-col min-h-0">
                      <ChatAppProvider
                        key={displayedConfigs[0].id}
                        activeChatAppConfig={displayedConfigs[0]}
                        onThemeChange={(t) =>
                          handleThemeChangeFor(displayedConfigs[0], t)
                        }
                      >
                        <ChatContainer config={displayedConfigs[0]} />
                      </ChatAppProvider>
                    </div>
                  ) : (
                    <div
                      className="grid gap-4 p-4 justify-center h-full"
                      style={{
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(350px, 1fr))",
                      }}
                    >
                      {displayedConfigs.map((cfg) => (
                        <ChatAppProvider
                          key={cfg.id}
                          activeChatAppConfig={cfg}
                          onThemeChange={(t) => handleThemeChangeFor(cfg, t)}
                        >
                          <ChatContainer config={cfg} />
                        </ChatAppProvider>
                      ))}
                    </div>
                  )}
                </AppShell>
              ) : isHomePage && displayedConfigs.length === 0 ? (
                <AppShell>
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-6">💬</div>
                      <h2 className="text-2xl font-bold mb-4">
                        Welcome to Buddy Chat
                      </h2>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        No chat applications are currently displayed. Use the
                        dropdown in the toolbar to select and add chat apps.
                      </p>
                      <div className="text-sm text-muted-foreground">
                        Available chat apps will appear in the toolbar dropdown
                        once loaded.
                      </div>
                    </div>
                  </div>
                </AppShell>
              ) : (
                // For non-home pages or when no configs, render children
                <AppShell>{children}</AppShell>
              )}
              <Analytics />
            </ThemeProvider>
          </ErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  );
}
