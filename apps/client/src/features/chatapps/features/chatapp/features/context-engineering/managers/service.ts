import { Effect, Ref } from "effect";
import type { ContextEngineeringManagerApi } from "./api";
import {
  ContextAssemblyError,
  ContextElementDuplicateError,
  ContextElementNotFoundError,
  ContextElementValidationError,
  ContextEngineeringConfigError,
  type ContextEngineeringError,
  ContextEngineeringManagerInitializationError,
  ContextEngineeringManagerStateError,
  ContextEngineeringOperationError,
  ContextSectionLimitError,
  ContextSectionReorderError,
} from "./errors";
import type {
  ContextElement,
  ContextEngineeringManagerConfig,
  ContextEngineeringManagerState,
  ContextEngineeringManagerStats,
  FinalContext,
  NamedFile,
  NamedPrompt,
} from "./types";
import {
  CONTEXT_ENGINEERING_CONSTANTS,
  createDefaultContextEngineeringConfig,
  createDefaultContextEngineeringState,
} from "./types";

export class ContextEngineeringManager extends Effect.Service<ContextEngineeringManagerApi>()(
  "ContextEngineeringManager",
  {
    scoped: Effect.gen(function* () {
      // State management
      const stateRef = yield* Ref.make<ContextEngineeringManagerState>(
        createDefaultContextEngineeringState()
      );

      const subscribersRef = yield* Ref.make<
        Set<(state: ContextEngineeringManagerState) => void>
      >(new Set());

      // Helper functions
      const updateState = (
        updater: (
          state: ContextEngineeringManagerState
        ) => ContextEngineeringManagerState
      ) =>
        Effect.gen(function* () {
          const newState = yield* Ref.updateAndGet(stateRef, (state) => ({
            ...updater(state),
            lastUpdated: new Date(),
            operationCount: state.operationCount + 1,
          }));
          yield* notifySubscribers(newState);
          return newState;
        });

      const notifySubscribers = (state: ContextEngineeringManagerState) =>
        Effect.gen(function* () {
          const subscribers = yield* Ref.get(subscribersRef);
          yield* Effect.forEach(
            Array.from(subscribers),
            (callback) => Effect.sync(() => callback(state)),
            { concurrency: "unbounded" }
          );
        });

      // Validation helpers
      const validateElement = (element: ContextElement) =>
        Effect.gen(function* () {
          // Validate common fields
          if (!element.id || element.id.trim() === "") {
            return yield* Effect.fail(
              new ContextElementValidationError({
                message: "Element ID is required",
                elementId: element.id,
                validationErrors: ["ID cannot be empty"],
              })
            );
          }

          if (!element.name || element.name.trim() === "") {
            return yield* Effect.fail(
              new ContextElementValidationError({
                message: "Element name is required",
                elementId: element.id,
                validationErrors: ["Name cannot be empty"],
              })
            );
          }

          if (
            element.name.length >
            CONTEXT_ENGINEERING_CONSTANTS.MAX_ELEMENT_NAME_LENGTH
          ) {
            return yield* Effect.fail(
              new ContextElementValidationError({
                message: "Element name is too long",
                elementId: element.id,
                validationErrors: [
                  `Name must be less than ${CONTEXT_ENGINEERING_CONSTANTS.MAX_ELEMENT_NAME_LENGTH} characters`,
                ],
              })
            );
          }

          // Type-specific validation
          if (element._tag === "NamedPrompt") {
            const prompt = element as NamedPrompt;
            if (!prompt.content || prompt.content.trim() === "") {
              return yield* Effect.fail(
                new ContextElementValidationError({
                  message: "Prompt content is required",
                  elementId: element.id,
                  validationErrors: ["Content cannot be empty"],
                })
              );
            }

            if (
              prompt.content.length >
              CONTEXT_ENGINEERING_CONSTANTS.MAX_PROMPT_CONTENT_LENGTH
            ) {
              return yield* Effect.fail(
                new ContextElementValidationError({
                  message: "Prompt content is too long",
                  elementId: element.id,
                  validationErrors: [
                    `Content must be less than ${CONTEXT_ENGINEERING_CONSTANTS.MAX_PROMPT_CONTENT_LENGTH} characters`,
                  ],
                })
              );
            }
          } else if (element._tag === "NamedFile") {
            const file = element as NamedFile;
            if (!file.content || file.content.trim() === "") {
              return yield* Effect.fail(
                new ContextElementValidationError({
                  message: "File content is required",
                  elementId: element.id,
                  validationErrors: ["File content cannot be empty"],
                })
              );
            }
            if (
              file.content.length >
              CONTEXT_ENGINEERING_CONSTANTS.MAX_FILE_CONTENT_LENGTH
            ) {
              return yield* Effect.fail(
                new ContextElementValidationError({
                  message: "File content too long",
                  elementId: element.id,
                  validationErrors: [
                    `Content must be less than ${CONTEXT_ENGINEERING_CONSTANTS.MAX_FILE_CONTENT_LENGTH} characters`,
                  ],
                })
              );
            }
          }
        });

      const validateSection = (
        section: "prePrompt" | "postPrompt",
        elements: readonly ContextElement[]
      ) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const config = state.config;

          if (!config) {
            return yield* Effect.fail(
              new ContextEngineeringConfigError({
                message: "Manager not initialized",
              })
            );
          }

          // Check section limits
          if (elements.length > config.maxElementsPerSection) {
            return yield* Effect.fail(
              new ContextSectionLimitError({
                section,
                currentCount: elements.length,
                maxAllowed: config.maxElementsPerSection,
              })
            );
          }

          // Validate each element
          yield* Effect.forEach(elements, validateElement, {
            concurrency: "unbounded",
          });

          // Check for duplicates
          const ids = elements.map((e) => e.id);
          const uniqueIds = new Set(ids);
          if (ids.length !== uniqueIds.size) {
            const duplicates = ids.filter(
              (id, index) => ids.indexOf(id) !== index
            );
            return yield* Effect.fail(
              new ContextElementDuplicateError({
                elementId: duplicates[0],
                section,
              })
            );
          }
        });

      // Element management helpers
      const findElementInSection = (
        elements: readonly ContextElement[],
        elementId: string
      ): ContextElement | null => {
        return elements.find((e) => e.id === elementId) || null;
      };

      const addElementToSection = (
        elements: readonly ContextElement[],
        element: ContextElement,
        index?: number
      ): readonly ContextElement[] => {
        const newElements = [...elements];
        if (index !== undefined && index >= 0 && index <= elements.length) {
          newElements.splice(index, 0, element);
        } else {
          newElements.push(element);
        }
        return newElements;
      };

      const updateElementInSection = (
        elements: readonly ContextElement[],
        elementId: string,
        updates: Partial<ContextElement>
      ): readonly ContextElement[] => {
        return elements.map((element) =>
          element.id === elementId
            ? ({ ...element, ...updates } as ContextElement)
            : element
        );
      };

      const removeElementFromSection = (
        elements: readonly ContextElement[],
        elementId: string
      ): readonly ContextElement[] => {
        return elements.filter((e) => e.id !== elementId);
      };

      const reorderElementsInSection = (
        elements: readonly ContextElement[],
        elementIds: readonly string[]
      ): readonly ContextElement[] => {
        // Create a map for quick lookup
        const elementMap = new Map(elements.map((e) => [e.id, e]));

        // Reorder according to the provided IDs
        const reorderedElements: ContextElement[] = [];
        for (const id of elementIds) {
          const element = elementMap.get(id);
          if (element) {
            reorderedElements.push(element);
          }
        }

        return reorderedElements;
      };

      // API Implementation
      const getState = () => Ref.get(stateRef);

      const setState = (updates: Partial<ContextEngineeringManagerState>) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, ...updates }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringManagerStateError({
                message: "Failed to update state",
                operation: "setState",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const resetState = () =>
        Effect.gen(function* () {
          yield* Ref.set(stateRef, createDefaultContextEngineeringState());
          yield* notifySubscribers(yield* Ref.get(stateRef));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringManagerStateError({
                message: "Failed to reset state",
                operation: "resetState",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const initialize = (config: ContextEngineeringManagerConfig) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({
            ...state,
            isInitialized: true,
            chatAppId: config.chatAppId,
            config,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringManagerInitializationError({
                message: `Failed to initialize ContextEngineeringManager for chat app: ${config.chatAppId}`,
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const getConfig = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.config;
        });

      const updateConfig = (
        updates: Partial<ContextEngineeringManagerConfig>
      ) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          if (!state.config) {
            return yield* Effect.fail(
              new ContextEngineeringConfigError({
                message: "Manager not initialized",
              })
            );
          }

          const newConfig = { ...state.config, ...updates };
          yield* updateState((state) => ({ ...state, config: newConfig }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringConfigError({
                message: "Failed to update config",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const getFinalContext = (
        userPrompt: string,
        userAttachedFiles: readonly string[]
      ) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          if (!state.isInitialized) {
            return yield* Effect.fail(
              new ContextAssemblyError({
                message: "Manager not initialized",
              })
            );
          }

          if (!userPrompt || userPrompt.trim() === "") {
            return yield* Effect.fail(
              new ContextAssemblyError({
                message: "User prompt is required",
                missingData: ["userPrompt"],
              })
            );
          }

          const finalContext: FinalContext = {
            prePrompt: state.prePromptElements,
            userPrompt: userPrompt.trim(),
            userAttachedFiles,
            postPrompt: state.postPromptElements,
          };

          return finalContext;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextAssemblyError({
                message: "Failed to assemble final context",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      // Pre-prompt element management
      const getPrePromptElements = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.prePromptElements;
        });

      const addPrePromptElement = (element: ContextElement, index?: number) =>
        Effect.gen(function* () {
          yield* validateElement(element);

          const state = yield* Ref.get(stateRef);

          // Check for duplicates
          if (findElementInSection(state.prePromptElements, element.id)) {
            return yield* Effect.fail(
              new ContextElementDuplicateError({
                elementId: element.id,
                section: "prePrompt",
              })
            );
          }

          const newElements = addElementToSection(
            state.prePromptElements,
            element,
            index
          );
          yield* validateSection("prePrompt", newElements);

          yield* updateState((state) => ({
            ...state,
            prePromptElements: newElements,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringOperationError({
                message: "Failed to add pre-prompt element",
                operation: "addPrePromptElement",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const updatePrePromptElement = (
        elementId: string,
        updates: Partial<ContextElement>
      ) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          if (!findElementInSection(state.prePromptElements, elementId)) {
            return yield* Effect.fail(
              new ContextElementNotFoundError({
                elementId,
                section: "prePrompt",
              })
            );
          }

          const newElements = updateElementInSection(
            state.prePromptElements,
            elementId,
            updates
          );
          yield* validateSection("prePrompt", newElements);

          yield* updateState((state) => ({
            ...state,
            prePromptElements: newElements,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringOperationError({
                message: "Failed to update pre-prompt element",
                operation: "updatePrePromptElement",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const removePrePromptElement = (elementId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          if (!findElementInSection(state.prePromptElements, elementId)) {
            return yield* Effect.fail(
              new ContextElementNotFoundError({
                elementId,
                section: "prePrompt",
              })
            );
          }

          const newElements = removeElementFromSection(
            state.prePromptElements,
            elementId
          );

          yield* updateState((state) => ({
            ...state,
            prePromptElements: newElements,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringOperationError({
                message: "Failed to remove pre-prompt element",
                operation: "removePrePromptElement",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const reorderPrePromptElements = (elementIds: readonly string[]) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          // Verify all IDs exist
          for (const id of elementIds) {
            if (!findElementInSection(state.prePromptElements, id)) {
              return yield* Effect.fail(
                new ContextElementNotFoundError({
                  elementId: id,
                  section: "prePrompt",
                })
              );
            }
          }

          // Verify all elements are included
          if (elementIds.length !== state.prePromptElements.length) {
            return yield* Effect.fail(
              new ContextSectionReorderError({
                section: "prePrompt",
                message: "All elements must be included in reorder operation",
              })
            );
          }

          const newElements = reorderElementsInSection(
            state.prePromptElements,
            elementIds
          );

          yield* updateState((state) => ({
            ...state,
            prePromptElements: newElements,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextSectionReorderError({
                section: "prePrompt",
                message: "Failed to reorder pre-prompt elements",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      // Post-prompt element management (similar to pre-prompt)
      const getPostPromptElements = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.postPromptElements;
        });

      const addPostPromptElement = (element: ContextElement, index?: number) =>
        Effect.gen(function* () {
          yield* validateElement(element);

          const state = yield* Ref.get(stateRef);

          // Check for duplicates
          if (findElementInSection(state.postPromptElements, element.id)) {
            return yield* Effect.fail(
              new ContextElementDuplicateError({
                elementId: element.id,
                section: "postPrompt",
              })
            );
          }

          const newElements = addElementToSection(
            state.postPromptElements,
            element,
            index
          );
          yield* validateSection("postPrompt", newElements);

          yield* updateState((state) => ({
            ...state,
            postPromptElements: newElements,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringOperationError({
                message: "Failed to add post-prompt element",
                operation: "addPostPromptElement",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const updatePostPromptElement = (
        elementId: string,
        updates: Partial<ContextElement>
      ) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          if (!findElementInSection(state.postPromptElements, elementId)) {
            return yield* Effect.fail(
              new ContextElementNotFoundError({
                elementId,
                section: "postPrompt",
              })
            );
          }

          const newElements = updateElementInSection(
            state.postPromptElements,
            elementId,
            updates
          );
          yield* validateSection("postPrompt", newElements);

          yield* updateState((state) => ({
            ...state,
            postPromptElements: newElements,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringOperationError({
                message: "Failed to update post-prompt element",
                operation: "updatePostPromptElement",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const removePostPromptElement = (elementId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          if (!findElementInSection(state.postPromptElements, elementId)) {
            return yield* Effect.fail(
              new ContextElementNotFoundError({
                elementId,
                section: "postPrompt",
              })
            );
          }

          const newElements = removeElementFromSection(
            state.postPromptElements,
            elementId
          );

          yield* updateState((state) => ({
            ...state,
            postPromptElements: newElements,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextEngineeringOperationError({
                message: "Failed to remove post-prompt element",
                operation: "removePostPromptElement",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const reorderPostPromptElements = (elementIds: readonly string[]) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          // Verify all IDs exist
          for (const id of elementIds) {
            if (!findElementInSection(state.postPromptElements, id)) {
              return yield* Effect.fail(
                new ContextElementNotFoundError({
                  elementId: id,
                  section: "postPrompt",
                })
              );
            }
          }

          // Verify all elements are included
          if (elementIds.length !== state.postPromptElements.length) {
            return yield* Effect.fail(
              new ContextSectionReorderError({
                section: "postPrompt",
                message: "All elements must be included in reorder operation",
              })
            );
          }

          const newElements = reorderElementsInSection(
            state.postPromptElements,
            elementIds
          );

          yield* updateState((state) => ({
            ...state,
            postPromptElements: newElements,
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ContextSectionReorderError({
                section: "postPrompt",
                message: "Failed to reorder post-prompt elements",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      // Element queries
      const getElementById = (elementId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          const prePromptElement = findElementInSection(
            state.prePromptElements,
            elementId
          );
          if (prePromptElement) return prePromptElement;

          const postPromptElement = findElementInSection(
            state.postPromptElements,
            elementId
          );
          if (postPromptElement) return postPromptElement;

          return null;
        });

      const getElementsByName = (name: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          const allElements = [
            ...state.prePromptElements,
            ...state.postPromptElements,
          ];

          return allElements.filter((element) => element.name === name);
        });

      const getElementsByType = (type: "NamedPrompt" | "NamedFile") =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          const allElements = [
            ...state.prePromptElements,
            ...state.postPromptElements,
          ];

          return allElements.filter((element) => element._tag === type);
        });

      // Statistics
      const getStats = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          const allElements = [
            ...state.prePromptElements,
            ...state.postPromptElements,
          ];

          const stats: ContextEngineeringManagerStats = {
            totalElements: allElements.length,
            prePromptCount: state.prePromptElements.length,
            postPromptCount: state.postPromptElements.length,
            namedPromptsCount: allElements.filter(
              (e) => e._tag === "NamedPrompt"
            ).length,
            namedFilesCount: allElements.filter((e) => e._tag === "NamedFile")
              .length,
            lastModified: state.lastUpdated,
            operationCount: state.operationCount,
          };

          return stats;
        });

      const getElementCount = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          return {
            prePrompt: state.prePromptElements.length,
            postPrompt: state.postPromptElements.length,
            total:
              state.prePromptElements.length + state.postPromptElements.length,
          };
        });

      // Subscription
      const subscribe = (
        callback: (state: ContextEngineeringManagerState) => void
      ) =>
        Effect.gen(function* () {
          yield* Ref.update(subscribersRef, (subscribers) => {
            const newSubscribers = new Set(subscribers);
            newSubscribers.add(callback);
            return newSubscribers;
          });

          // Return unsubscribe function
          return () => {
            Effect.runSync(
              Ref.update(subscribersRef, (subscribers) => {
                const newSubscribers = new Set(subscribers);
                newSubscribers.delete(callback);
                return newSubscribers;
              })
            );
          };
        });

      // Utility methods
      const clear = () =>
        Effect.gen(function* () {
          yield* updateState((state) => ({
            ...state,
            prePromptElements: [],
            postPromptElements: [],
          }));
        });

      const exportData = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);

          const exportData = {
            prePromptElements: state.prePromptElements,
            postPromptElements: state.postPromptElements,
            config: state.config,
            exportedAt: new Date().toISOString(),
          };

          return JSON.stringify(exportData, null, 2);
        });

      const importData = (data: string) =>
        Effect.gen(function* () {
          try {
            const parsed = JSON.parse(data);

            // Validate structure
            if (!parsed.prePromptElements || !parsed.postPromptElements) {
              return yield* Effect.fail(
                new ContextEngineeringOperationError({
                  message: "Invalid import data structure",
                  operation: "import",
                })
              );
            }

            // Validate elements
            yield* validateSection("prePrompt", parsed.prePromptElements);
            yield* validateSection("postPrompt", parsed.postPromptElements);

            yield* updateState((state) => ({
              ...state,
              prePromptElements: parsed.prePromptElements,
              postPromptElements: parsed.postPromptElements,
            }));
          } catch (error) {
            return yield* Effect.fail(
              new ContextEngineeringOperationError({
                message: "Failed to parse import data",
                operation: "import",
                cause:
                  error instanceof Error ? error : new Error(String(error)),
              })
            );
          }
        });

      // Placeholder persistence methods
      const save = () =>
        Effect.gen(function* () {
          // TODO: Implement persistence
          yield* Effect.log("Save operation not yet implemented");
        });

      const load = () =>
        Effect.gen(function* () {
          // TODO: Implement persistence
          yield* Effect.log("Load operation not yet implemented");
        });

      return {
        getState,
        setState,
        resetState,
        initialize,
        getConfig,
        updateConfig,
        getFinalContext,
        getPrePromptElements,
        addPrePromptElement,
        updatePrePromptElement,
        removePrePromptElement,
        reorderPrePromptElements,
        getPostPromptElements,
        addPostPromptElement,
        updatePostPromptElement,
        removePostPromptElement,
        reorderPostPromptElements,
        getElementById,
        getElementsByName,
        getElementsByType,
        validateElement,
        validateSection,
        getStats,
        getElementCount,
        save,
        load,
        subscribe,
        clear,
        export: exportData,
        import: importData,
      } satisfies ContextEngineeringManagerApi;
    }),
    dependencies: [],
  }
) {}
