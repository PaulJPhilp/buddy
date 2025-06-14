import type { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import {
  type EnhancedConfigLifecycleContext,
  EnhancedConfigLifecycleService,
  EnhancedConfigLifecycleServiceLive,
} from "@/services/config-lifecycle";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";

interface UseConfigEditorOptions {
  configId: string;
  autoSave?: boolean;
}

interface UseConfigEditorReturn {
  // Config data
  config: ChatAppConfig | null;
  saveStatus: "saved" | "saving" | "dirty" | "error";

  // State
  loading: boolean;
  error: string | null;

  // Actions
  updateTheme: (themeUpdates: Partial<ChatAppConfig["theme"]>) => void;
  updateName: (name: string) => void;
  updateConfig: (updates: Partial<ChatAppConfig>) => void;
  saveNow: () => Promise<void>;
  revert: () => Promise<void>;

  // Auto-save control
  autoSaveEnabled: boolean;
  toggleAutoSave: () => void;
}

export function useConfigEditor({
  configId,
  autoSave = true,
}: UseConfigEditorOptions): UseConfigEditorReturn {
  const [state, setState] = useState<EnhancedConfigLifecycleContext | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to config lifecycle service
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async () => {
      try {
        const service = await Effect.runPromise(
          Effect.gen(function* () {
            return yield* EnhancedConfigLifecycleService;
          }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
        );

        const subscription = await Effect.runPromise(
          service.subscribe((newState) => {
            setState(newState);
          }),
        );

        unsubscribe = subscription.unsubscribe;

        // Load initial configs
        await Effect.runPromise(service.loadConfigs());

        // Start file watcher
        await Effect.runPromise(service.startFileWatcher());
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Get current config
  const config = state?.configs.find((c) => c.id === configId) || null;
  const saveStatus = state?.saveStatus[configId] || "saved";
  const autoSaveEnabled = state?.autoSaveEnabled ?? true;

  // Update theme properties
  const updateTheme = useCallback(
    async (themeUpdates: Partial<ChatAppConfig["theme"]>) => {
      if (!config?.theme) return;

      const updatedTheme = { ...config.theme, ...themeUpdates };

      try {
        setLoading(true);
        const service = await Effect.runPromise(
          Effect.gen(function* () {
            return yield* EnhancedConfigLifecycleService;
          }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
        );

        await Effect.runPromise(
          service.updateConfigImmediate(configId, { theme: updatedTheme }),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [configId, config?.theme],
  );

  // Update config name
  const updateName = useCallback(
    async (name: string) => {
      try {
        setLoading(true);
        const service = await Effect.runPromise(
          Effect.gen(function* () {
            return yield* EnhancedConfigLifecycleService;
          }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
        );

        await Effect.runPromise(
          service.updateConfigWithSave(configId, { name }),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [configId],
  );

  // Generic config update
  const updateConfig = useCallback(
    async (updates: Partial<ChatAppConfig>) => {
      try {
        setLoading(true);
        const service = await Effect.runPromise(
          Effect.gen(function* () {
            return yield* EnhancedConfigLifecycleService;
          }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
        );

        await Effect.runPromise(
          service.updateConfigImmediate(configId, updates),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [configId],
  );

  // Save immediately
  const saveNow = useCallback(async () => {
    try {
      setLoading(true);
      const service = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* EnhancedConfigLifecycleService;
        }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
      );

      await Effect.runPromise(service.saveConfig(configId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [configId]);

  // Revert to saved state
  const revert = useCallback(async () => {
    try {
      setLoading(true);
      const service = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* EnhancedConfigLifecycleService;
        }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
      );

      await Effect.runPromise(service.revertConfig(configId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [configId]);

  // Toggle auto-save
  const toggleAutoSave = useCallback(async () => {
    try {
      const service = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* EnhancedConfigLifecycleService;
        }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
      );

      await Effect.runPromise(service.toggleAutoSave());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  return {
    // Config data
    config,
    saveStatus,

    // State
    loading: loading || state?.loading || false,
    error: error || state?.error,

    // Actions
    updateTheme,
    updateName,
    updateConfig,
    saveNow,
    revert,

    // Auto-save control
    autoSaveEnabled,
    toggleAutoSave,
  };
}

// Convenience hook for theme editing specifically
export function useThemeEditor(configId: string) {
  const editor = useConfigEditor({ configId });

  const updateBackgroundColor = useCallback(
    (color: string) => {
      if (!editor.config?.theme) return;

      editor.updateTheme({
        colors: {
          ...editor.config.theme.colors,
          background: color,
        },
      });
    },
    [editor],
  );

  const updateTextColor = useCallback(
    (color: string) => {
      if (!editor.config?.theme) return;

      editor.updateTheme({
        colors: {
          ...editor.config.theme.colors,
          text: color,
        },
      });
    },
    [editor],
  );

  const updateAccentColor = useCallback(
    (color: string) => {
      if (!editor.config?.theme) return;

      editor.updateTheme({
        colors: {
          ...editor.config.theme.colors,
          accent: color,
        },
      });
    },
    [editor],
  );

  return {
    ...editor,
    updateBackgroundColor,
    updateTextColor,
    updateAccentColor,
  };
}

// Example usage in a component:
//
// const {
//   config,
//   saveStatus,
//   updateTheme,
//   updateName,
//   saveNow,
//   revert,
//   toggleAutoSave,
//   autoSaveEnabled,
// } = useConfigEditor({ configId });
//
// Usage examples:
// - updateTheme({ colors: { primary: '#ff0000' } })
// - updateName('New Config Name')
// - saveNow() to force immediate save
// - revert() to undo changes
