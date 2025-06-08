import type { ChatAppTheme } from "@/features/chat/themes/themeTypes";
import { useAgentSession } from "@/hooks/useAgentSession";
import type { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import { AppService } from "@/services/app";
import { ThemesService } from "@/services/themes";
import { ToolbarService } from "@/services/toolbar";
import { Effect, Layer } from "effect";
import { useEffect, useMemo, useState } from "react";

/**
 * useChatAppRuntime combines config (AppService) and runtime (ChatRuntimeService)
 * for a given chatAppId. It fetches the config, then establishes a live agent session
 * and fetches the toolbar and theme for the app.
 */
/**
 * useChatAppRuntime combines config, toolbar, and theme for a chatAppId.
 * Accepts an optional themeOverride for live preview/testing.
 */
export function useChatAppRuntime(
  chatAppId: string,
  themeOverride?: ChatAppTheme,
) {
  const [config, setConfig] = useState<ChatAppConfig | null>(null);
  const [toolbar, setToolbar] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch app config, toolbar, and theme
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Create a program that fetches all required data
    const program = Effect.gen(function* (_) {
      // Get service instances
      const appsService = yield* _(AppService);
      const toolbarsService = yield* _(ToolbarService);
      const themesService = yield* _(ThemesService);

      // Get the chat app config
      const cfg = yield* _(appsService.getById(chatAppId));
      if (!cfg) throw new Error("ChatApp config not found");

      // Get the toolbar
      const tb = yield* _(toolbarsService.getById(cfg.toolbarId));

      // Get the theme
      const th = yield* _(themesService.getTheme(cfg.themeId));

      // Return all fetched data
      return { config: cfg, toolbar: tb, theme: th };
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          AppService.Default,
          ToolbarService.Default,
          ThemesService.Default,
        ),
      ),
    );

    // Run the program
    Effect.runPromise(program)
      .then((result) => {
        setConfig(result.config);
        setToolbar(result.toolbar);
        setTheme(result.theme);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [chatAppId]);

  // Live agent session
  const agentId = config?.agentId;
  const {
    status,
    messages,
    error: agentError,
    sendMessage,
  } = useAgentSession(agentId ?? "", chatAppId);

  // Combine all runtime state
  // Use the override if present, else use fetched theme
  const effectiveTheme = themeOverride ?? theme;

  return useMemo(
    () => ({
      config,
      toolbar,
      theme: effectiveTheme,
      loading,
      error: error || agentError,
      status,
      messages,
      sendMessage,
    }),
    [
      config,
      toolbar,
      effectiveTheme,
      loading,
      error,
      status,
      messages,
      sendMessage,
      agentError,
    ],
  );
}
