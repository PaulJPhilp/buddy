import type { ToolbarConfig } from "@/schemas/ToolbarConfigSchema";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";

/**
 * useToolbars hook provides runtime CRUD access to toolbar configs using ToolbarService.
 * All operations are performed with Effect.js and Layer provisioning.
 */
export function useToolbars() {
  const [toolbars, setToolbars] = useState<ToolbarConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all toolbars on mount
  useEffect(() => {
    setLoading(true);
    Effect.runPromise(
      Effect.gen(function* (_) {
        const service = yield* ToolbarService;
        return yield* service.getAll();
      }).pipe(Effect.provide(ToolbarService.Default)),
    )
      .then((result) => {
        setToolbars([...result]);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  // CRUD actions
  const createToolbar = useCallback((toolbar: ToolbarConfig) => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ToolbarService;
        yield* service.create(toolbar);
      }).pipe(Effect.provide(ToolbarService.Default)) as Effect.Effect<
        void,
        unknown,
        never
      >,
    )
      .then(() => {
        setToolbars((prev) => [...prev, toolbar]);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const updateToolbar = useCallback(
    (id: string, patch: Partial<ToolbarConfig>) => {
      return Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ToolbarService;
          yield* service.update(id, patch);
        }).pipe(Effect.provide(ToolbarService.Default)) as Effect.Effect<
          void,
          unknown,
          never
        >,
      )
        .then(() => {
          setToolbars((prev) =>
            prev.map((tb) => (tb.id === id ? { ...tb, ...patch } : tb)),
          );
        })
        .catch((e) => setError(String(e)));
    },
    [],
  );

  const deleteToolbar = useCallback((id: string) => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ToolbarService;
        yield* service.delete(id);
      }).pipe(Effect.provide(ToolbarService.Default)) as Effect.Effect<
        void,
        unknown,
        never
      >,
    )
      .then(() => {
        setToolbars((prev) => prev.filter((tb) => tb.id !== id));
      })
      .catch((e) => setError(String(e)));
  }, []);

  return {
    toolbars,
    loading,
    error,
    createToolbar,
    updateToolbar,
    deleteToolbar,
  };
}
