"use client";

import { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import {
  EnhancedConfigLifecycleService,
  EnhancedConfigLifecycleServiceLive,
} from "@/services/config-lifecycle";
import { Effect } from "effect";
import React, { useCallback, useEffect, useState } from "react";

/**
 * Enhanced ChatAppSwitcher that uses ConfigLifecycleService for real-time updates
 * and improved state management. Maintains backward compatibility with the original.
 */
export function ChatAppSwitcherEnhanced() {
  console.log("🚀 ChatAppSwitcherEnhanced: Component mounted/rendered");
  const [apps, setApps] = useState<ChatAppConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load apps from ConfigLifecycleService
  const loadApps = useCallback(async () => {
    try {
      console.log(`📱 ChatAppSwitcherEnhanced: Starting loadApps...`);
      setLoading(true);
      setError(null);

      console.log(`📱 ChatAppSwitcherEnhanced: Getting service...`);
      const service = await Effect.runPromise(
        Effect.gen(function* () {
          console.log(
            `📱 ChatAppSwitcherEnhanced: Yielding EnhancedConfigLifecycleService...`,
          );
          return yield* EnhancedConfigLifecycleService;
        }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
      );
      console.log(`📱 ChatAppSwitcherEnhanced: Service obtained:`, !!service);

      console.log(
        `📱 ChatAppSwitcherEnhanced: Loading configs from service...`,
      );
      const configs = await Effect.runPromise(service.loadConfigs());
      console.log(
        `📱 ChatAppSwitcherEnhanced: Loaded ${configs.length} configs:`,
        configs,
      );
      setApps(configs);

      // Auto-add all loaded configs to the UI
      for (const config of configs) {
        console.log(
          `📱 ChatAppSwitcherEnhanced: Auto-adding loaded config ${config.id}`,
        );
        console.log(`📱 ChatAppSwitcherEnhanced: Config details:`, config);
        console.log(
          `📱 ChatAppSwitcherEnhanced: Dispatching buddy:addChatApp event`,
        );
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: config }),
        );
        console.log(
          `📱 ChatAppSwitcherEnhanced: Event dispatched for ${config.id}`,
        );
      }

      // Auto-select first app if available
      if (configs.length > 0) {
        setSelectedId(configs[0].id);
      } else {
        setSelectedId("");
      }
    } catch (err) {
      console.warn("Failed to load chat apps:", err);
      setError(err instanceof Error ? err.message : String(err));

      // Fallback to localStorage for backward compatibility
      try {
        console.log(
          `📱 ChatAppSwitcherEnhanced: Falling back to localStorage...`,
        );

        // No longer using localStorage fallback
        console.log(`📱 ChatAppSwitcherEnhanced: No configs found anywhere`);
        setApps([]);

        // No longer using localStorage for last selected
      } catch (fallbackErr) {
        console.error(
          "Failed to load from localStorage fallback:",
          fallbackErr,
        );
        setApps([]);
        setSelectedId("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time updates
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
          service.subscribe((state) => {
            setApps(state.configs);

            // Update selected if current selection is no longer available
            if (
              selectedId &&
              !state.configs.some((app) => app.id === selectedId)
            ) {
              if (state.configs.length > 0) {
                setSelectedId(state.configs[0].id);
              } else {
                setSelectedId("");
              }
            }
          }),
        );

        unsubscribe = subscription.unsubscribe;
      } catch (err) {
        console.warn("Failed to setup config subscription:", err);
      }
    };

    // Initial load
    loadApps();

    // Setup real-time subscription
    setupSubscription();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadApps, selectedId]);

  // Handle selection change
  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setSelectedId(id);

      const config = apps.find((a) => a.id === id);
      if (config) {
        try {
          // Get service for state management
          const service = await Effect.runPromise(
            Effect.gen(function* () {
              return yield* EnhancedConfigLifecycleService;
            }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
          );

          // Set as active in the service
          await Effect.runPromise(service.setActive(config.id));

          // Dispatch custom event for backward compatibility
          window.dispatchEvent(
            new CustomEvent("buddy:addChatApp", { detail: config }),
          );
        } catch (err) {
          console.warn("Failed to set active config:", err);

          // Fallback to original behavior
          window.dispatchEvent(
            new CustomEvent("buddy:addChatApp", { detail: config }),
          );
        }
      }
    },
    [apps],
  );

  // Loading state
  if (loading) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-1 border rounded bg-background">
        Loading apps...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-xs text-red-500 px-2 py-1 border rounded bg-background">
        Error: {error}
      </div>
    );
  }

  // No apps state
  if (apps.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-1 border rounded bg-background">
        No chat apps available
      </div>
    );
  }

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="text-sm border rounded px-2 py-1 bg-background"
      aria-label="Select chat application"
      disabled={loading}
    >
      <option value="">Select a chat app...</option>
      {apps.map((app) => (
        <option key={app.id} value={app.id}>
          {app.name}
        </option>
      ))}
    </select>
  );
}
