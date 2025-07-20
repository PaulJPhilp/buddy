import { Effect, Ref } from "effect";
import type { UserAreaManagerApi } from "./api";
import {
  UserAreaManagerAgentError,
  UserAreaManagerConfigError,
  UserAreaManagerError,
  UserAreaManagerFileError,
  UserAreaManagerInitializationError,
  UserAreaManagerInputError,
  UserAreaManagerMessageError,
  UserAreaManagerOperationError,
  UserAreaManagerStateError,
  UserAreaManagerValidationError,
} from "./errors";
import type {
  AgentInfo,
  UserAreaManagerConfig,
  UserAreaManagerState,
  UserAreaManagerStats,
  ValidationError,
} from "./types";
import { USER_AREA_CONSTANTS } from "./types";

export class UserAreaManager extends Effect.Service<UserAreaManagerApi>()(
  "UserAreaManager",
  {
    scoped: Effect.gen(function* () {
      const stateRef = yield* Ref.make<UserAreaManagerState | null>(null);
      const configRef = yield* Ref.make<UserAreaManagerConfig | null>(null);
      const subscribersRef = yield* Ref.make<
        Array<(state: UserAreaManagerState) => void>
      >([]);

      const notifySubscribers = (state: UserAreaManagerState) =>
        Effect.gen(function* () {
          const subscribers = yield* Ref.get(subscribersRef);
          yield* Effect.forEach(subscribers, (callback) =>
            Effect.sync(() => callback(state))
          );
        });

      const createInitialState = (
        config: UserAreaManagerConfig
      ): UserAreaManagerState => ({
        chatAppId: config.chatAppId,
        inputText: config.initialText || "",
        attachments: [],
        selectedAgentId: config.initialAgentId || null,
        availableAgents: [],
        isInputDisabled: false,
        isLoading: false,
        inputPlaceholder:
          config.inputPlaceholder || USER_AREA_CONSTANTS.DEFAULT_PLACEHOLDER,
        showAttachments: config.showAttachments ?? true,
        showAgentToolbar: config.showAgentToolbar ?? true,
        inputRows: config.inputRows || USER_AREA_CONSTANTS.DEFAULT_INPUT_ROWS,
        maxInputLength:
          config.maxInputLength || USER_AREA_CONSTANTS.DEFAULT_MAX_LENGTH,
        isInitialized: false,
        lastActivity: new Date(),
        errorInfo: null,
        validationErrors: [],
        stats: {
          totalMessages: 0,
          totalAttachments: 0,
          totalFileSize: 0,
          agentSwitches: 0,
          averageMessageLength: 0,
          interactionCount: 0,
          lastMessageTime: null,
          sessionDuration: 0,
          errorCount: 0,
          validationFailures: 0,
        },
      });

      const validateConfig = (
        config: UserAreaManagerConfig
      ): Effect.Effect<readonly ValidationError[], never> =>
        Effect.gen(function* () {
          const errors: ValidationError[] = [];

          if (!config.chatAppId || config.chatAppId.trim() === "") {
            errors.push({
              field: "chatAppId",
              message: "Chat app ID is required",
              code: "REQUIRED",
            });
          }

          if (config.maxInputLength && config.maxInputLength < 1) {
            errors.push({
              field: "maxInputLength",
              message: "Max input length must be positive",
              code: "INVALID_RANGE",
            });
          }

          if (config.inputRows && config.inputRows < 1) {
            errors.push({
              field: "inputRows",
              message: "Input rows must be positive",
              code: "INVALID_RANGE",
            });
          }

          if (config.maxFileSize && config.maxFileSize < 1) {
            errors.push({
              field: "maxFileSize",
              message: "Max file size must be positive",
              code: "INVALID_RANGE",
            });
          }

          if (config.maxAttachments && config.maxAttachments < 1) {
            errors.push({
              field: "maxAttachments",
              message: "Max attachments must be positive",
              code: "INVALID_RANGE",
            });
          }

          return errors;
        });

      const validateText = (
        text: string
      ): Effect.Effect<readonly ValidationError[], never> =>
        Effect.gen(function* () {
          const errors: ValidationError[] = [];
          const config = yield* Ref.get(configRef);

          if (!config) {
            return errors;
          }

          if (text.length > config.maxInputLength!) {
            errors.push({
              field: "inputText",
              message: `Text exceeds maximum length of ${config.maxInputLength} characters`,
              code: "MAX_LENGTH_EXCEEDED",
            });
          }

          return errors;
        });

      const validateTextForSending = (
        text: string
      ): Effect.Effect<readonly ValidationError[], never> =>
        Effect.gen(function* () {
          const errors: ValidationError[] = [];
          const config = yield* Ref.get(configRef);

          if (!config) {
            return errors;
          }

          if (text.length > config.maxInputLength!) {
            errors.push({
              field: "inputText",
              message: `Text exceeds maximum length of ${config.maxInputLength} characters`,
              code: "MAX_LENGTH_EXCEEDED",
            });
          }

          if (text.trim() === "" && text.length > 0) {
            errors.push({
              field: "inputText",
              message: "Text cannot be only whitespace",
              code: "WHITESPACE_ONLY",
            });
          }

          return errors;
        });

      const validateFile = (
        file: File
      ): Effect.Effect<readonly ValidationError[], never> =>
        Effect.gen(function* () {
          const errors: ValidationError[] = [];
          const config = yield* Ref.get(configRef);

          if (!config) {
            return errors;
          }

          const maxFileSize =
            config.maxFileSize || USER_AREA_CONSTANTS.MAX_FILE_SIZE;
          if (file.size > maxFileSize) {
            errors.push({
              field: "file",
              message: `File size exceeds maximum of ${maxFileSize} bytes`,
              code: "FILE_TOO_LARGE",
            });
          }

          const allowedTypes =
            config.allowedFileTypes || USER_AREA_CONSTANTS.ALLOWED_FILE_TYPES;
          if (!allowedTypes.includes(file.type)) {
            errors.push({
              field: "file",
              message: `File type ${file.type} is not allowed`,
              code: "INVALID_FILE_TYPE",
            });
          }

          return errors;
        });

      const updateState = (updates: Partial<UserAreaManagerState>) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          if (!currentState) {
            return yield* Effect.fail(
              new UserAreaManagerStateError({
                message: "Cannot update state: UserAreaManager not initialized",
                state: "uninitialized",
              })
            );
          }

          const newState = {
            ...currentState,
            ...updates,
            lastActivity: new Date(),
          };
          yield* Ref.set(stateRef, newState);
          yield* notifySubscribers(newState);
        });

      const recordInteraction = (
        type: string,
        details?: Record<string, unknown>
      ) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          if (!currentState) return;

          const newStats = {
            ...currentState.stats,
            interactionCount: currentState.stats.interactionCount + 1,
          };

          yield* updateState({ stats: newStats });
        });

      return {
        // Core lifecycle operations
        initialize: (config: UserAreaManagerConfig) =>
          Effect.gen(function* () {
            const validationErrors = yield* validateConfig(config);
            if (validationErrors.length > 0) {
              return yield* Effect.fail(
                new UserAreaManagerConfigError({
                  message: `Configuration validation failed: ${validationErrors
                    .map((e) => e.message)
                    .join(", ")}`,
                  field: "config",
                  value: config,
                })
              );
            }

            const initialState = createInitialState(config);
            yield* Ref.set(stateRef, { ...initialState, isInitialized: true });
            yield* Ref.set(configRef, config);
            yield* notifySubscribers({ ...initialState, isInitialized: true });
          }),

        cleanup: () =>
          Effect.gen(function* () {
            yield* Ref.set(stateRef, null);
            yield* Ref.set(configRef, null);
            yield* Ref.set(subscribersRef, []);
          }),

        reset: () =>
          Effect.gen(function* () {
            const config = yield* Ref.get(configRef);
            if (!config) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "Cannot reset: UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const initialState = createInitialState(config);
            yield* Ref.set(stateRef, { ...initialState, isInitialized: true });
            yield* notifySubscribers({ ...initialState, isInitialized: true });
          }),

        // State management
        getState: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }
            return state;
          }),

        setState: (updates: Partial<UserAreaManagerState>) =>
          updateState(updates),

        subscribe: (callback: (state: UserAreaManagerState) => void) =>
          Effect.gen(function* () {
            const currentSubscribers = yield* Ref.get(subscribersRef);
            yield* Ref.set(subscribersRef, [...currentSubscribers, callback]);

            // Return unsubscribe function
            return () =>
              Effect.gen(function* () {
                const subscribers = yield* Ref.get(subscribersRef);
                const filtered = subscribers.filter((sub) => sub !== callback);
                yield* Ref.set(subscribersRef, filtered);
              });
          }),

        // Text input operations
        setText: (text: string) =>
          Effect.gen(function* () {
            const errors = yield* validateText(text);
            yield* updateState({
              inputText: text,
              validationErrors: errors,
            });
            yield* recordInteraction("text_change", {
              textLength: text.length,
            });
          }),

        getText: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }
            return state.inputText;
          }),

        clearText: () =>
          Effect.gen(function* () {
            yield* updateState({ inputText: "", validationErrors: [] });
            yield* recordInteraction("text_clear");
          }),

        validateText: (text: string) => validateText(text),

        // Message operations
        sendMessage: (text?: string, attachments?: readonly File[]) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const messageText = text || state.inputText;
            const messageAttachments = attachments || state.attachments;

            if (!messageText.trim() && messageAttachments.length === 0) {
              return yield* Effect.fail(
                new UserAreaManagerMessageError({
                  message: "Cannot send empty message without attachments",
                  messageText,
                  attachmentCount: messageAttachments.length,
                })
              );
            }

            const textErrors = yield* validateTextForSending(messageText);
            if (textErrors.length > 0) {
              return yield* Effect.fail(
                new UserAreaManagerValidationError({
                  message: `Message validation failed: ${textErrors
                    .map((e) => e.message)
                    .join(", ")}`,
                  field: "messageText",
                  value: messageText,
                  rule: "message_validation",
                })
              );
            }

            // Update stats
            const newStats = {
              ...state.stats,
              totalMessages: state.stats.totalMessages + 1,
              totalAttachments:
                state.stats.totalAttachments + messageAttachments.length,
              totalFileSize:
                state.stats.totalFileSize +
                messageAttachments.reduce((sum, file) => sum + file.size, 0),
              averageMessageLength: Math.round(
                (state.stats.averageMessageLength * state.stats.totalMessages +
                  messageText.length) /
                  (state.stats.totalMessages + 1)
              ),
              lastMessageTime: new Date(),
            };

            yield* updateState({
              inputText: "",
              attachments: [],
              stats: newStats,
              validationErrors: [],
            });
            yield* recordInteraction("message_sent", {
              textLength: messageText.length,
              attachmentCount: messageAttachments.length,
            });
          }),

        canSendMessage: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) return false;

            const hasText = state.inputText.trim().length > 0;
            const hasAttachments = state.attachments.length > 0;
            const isNotDisabled = !state.isInputDisabled;
            const isNotLoading = !state.isLoading;

            return (hasText || hasAttachments) && isNotDisabled && isNotLoading;
          }),

        getMessagePreview: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            return {
              text: state.inputText,
              attachments: state.attachments,
            };
          }),

        // File attachment operations
        addAttachment: (file: File) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const config = yield* Ref.get(configRef);
            if (!state || !config) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const maxAttachments =
              config.maxAttachments || USER_AREA_CONSTANTS.MAX_ATTACHMENTS;
            if (state.attachments.length >= maxAttachments) {
              return yield* Effect.fail(
                new UserAreaManagerFileError({
                  message: `Maximum number of attachments (${maxAttachments}) exceeded`,
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                })
              );
            }

            const fileErrors = yield* validateFile(file);
            if (fileErrors.length > 0) {
              return yield* Effect.fail(
                new UserAreaManagerFileError({
                  message: `File validation failed: ${fileErrors
                    .map((e) => e.message)
                    .join(", ")}`,
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                })
              );
            }

            const newAttachments = [...state.attachments, file];
            yield* updateState({ attachments: newAttachments });
            yield* recordInteraction("file_attached", {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            });
          }),

        addAttachments: (files: readonly File[]) =>
          Effect.gen(function* () {
            yield* Effect.forEach(files, (file) => {
              return Effect.gen(function* () {
                const state = yield* Ref.get(stateRef);
                const config = yield* Ref.get(configRef);
                if (!state || !config) {
                  return yield* Effect.fail(
                    new UserAreaManagerStateError({
                      message: "UserAreaManager not initialized",
                      state: "uninitialized",
                    })
                  );
                }

                const maxAttachments =
                  config.maxAttachments || USER_AREA_CONSTANTS.MAX_ATTACHMENTS;
                if (state.attachments.length >= maxAttachments) {
                  return yield* Effect.fail(
                    new UserAreaManagerFileError({
                      message: `Maximum number of attachments (${maxAttachments}) exceeded`,
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type,
                    })
                  );
                }

                const fileErrors = yield* validateFile(file);
                if (fileErrors.length > 0) {
                  return yield* Effect.fail(
                    new UserAreaManagerFileError({
                      message: `File validation failed: ${fileErrors
                        .map((e) => e.message)
                        .join(", ")}`,
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type,
                    })
                  );
                }

                const newAttachments = [...state.attachments, file];
                yield* updateState({ attachments: newAttachments });
                yield* recordInteraction("file_attached", {
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                });
              });
            });
          }),

        removeAttachment: (file: File) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const newAttachments = state.attachments.filter((f) => f !== file);
            yield* updateState({ attachments: newAttachments });
            yield* recordInteraction("file_removed", {
              fileName: file.name,
              fileSize: file.size,
            });
          }),

        clearAttachments: () =>
          Effect.gen(function* () {
            yield* updateState({ attachments: [] });
            yield* recordInteraction("attachments_cleared");
          }),

        getAttachments: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }
            return state.attachments;
          }),

        validateFile: (file: File) => validateFile(file),

        // Agent operations
        setSelectedAgent: (agentId: string) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const agent = state.availableAgents.find((a) => a.id === agentId);
            if (!agent) {
              return yield* Effect.fail(
                new UserAreaManagerAgentError({
                  message: `Agent with ID ${agentId} not found`,
                  agentId,
                  operation: "setSelectedAgent",
                })
              );
            }

            if (!agent.isAvailable) {
              return yield* Effect.fail(
                new UserAreaManagerAgentError({
                  message: `Agent ${agentId} is not available`,
                  agentId,
                  operation: "setSelectedAgent",
                })
              );
            }

            const newStats = {
              ...state.stats,
              agentSwitches: state.stats.agentSwitches + 1,
            };

            yield* updateState({
              selectedAgentId: agentId,
              stats: newStats,
            });
            yield* recordInteraction("agent_selected", {
              agentId,
              agentName: agent.name,
            });
          }),

        getSelectedAgent: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }
            return state.selectedAgentId;
          }),

        getAvailableAgents: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }
            return state.availableAgents;
          }),

        setAvailableAgents: (agents: readonly AgentInfo[]) =>
          Effect.gen(function* () {
            yield* updateState({ availableAgents: agents });
            yield* recordInteraction("agents_updated", {
              agentCount: agents.length,
            });
          }),

        refreshAgents: () =>
          Effect.gen(function* () {
            // This would typically fetch agents from a service
            // For now, we'll just trigger a refresh event
            yield* recordInteraction("agents_refreshed");
          }),

        // Input state operations
        setInputDisabled: (disabled: boolean) =>
          Effect.gen(function* () {
            yield* updateState({ isInputDisabled: disabled });
            yield* recordInteraction("input_disabled_changed", { disabled });
          }),

        isInputDisabled: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) return false;
            return state.isInputDisabled;
          }),

        setInputPlaceholder: (placeholder: string) =>
          Effect.gen(function* () {
            yield* updateState({ inputPlaceholder: placeholder });
            yield* recordInteraction("placeholder_changed", { placeholder });
          }),

        setInputRows: (rows: number) =>
          Effect.gen(function* () {
            if (rows < 1) {
              return yield* Effect.fail(
                new UserAreaManagerValidationError({
                  message: "Input rows must be positive",
                  field: "inputRows",
                  value: rows,
                  rule: "positive_number",
                })
              );
            }

            yield* updateState({ inputRows: rows });
            yield* recordInteraction("input_rows_changed", { rows });
          }),

        // UI state operations
        setShowAttachments: (show: boolean) =>
          Effect.gen(function* () {
            yield* updateState({ showAttachments: show });
            yield* recordInteraction("show_attachments_changed", { show });
          }),

        setShowAgentToolbar: (show: boolean) =>
          Effect.gen(function* () {
            yield* updateState({ showAgentToolbar: show });
            yield* recordInteraction("show_agent_toolbar_changed", { show });
          }),

        setLoading: (loading: boolean) =>
          Effect.gen(function* () {
            yield* updateState({ isLoading: loading });
            yield* recordInteraction("loading_changed", { loading });
          }),

        // Event handlers
        onInputFocus: () =>
          Effect.gen(function* () {
            yield* recordInteraction("input_focus");
          }),

        onInputBlur: () =>
          Effect.gen(function* () {
            yield* recordInteraction("input_blur");
          }),

        onInputKeyDown: (event: KeyboardEvent) =>
          Effect.gen(function* () {
            yield* recordInteraction("input_keydown", {
              key: event.key,
              ctrlKey: event.ctrlKey,
              shiftKey: event.shiftKey,
            });

            // Handle Enter key for sending messages
            if (event.key === "Enter" && !event.shiftKey) {
              const state = yield* Ref.get(stateRef);
              if (!state) return;

              const hasText = state.inputText.trim().length > 0;
              const hasAttachments = state.attachments.length > 0;
              const isNotDisabled = !state.isInputDisabled;
              const isNotLoading = !state.isLoading;
              const canSend =
                (hasText || hasAttachments) && isNotDisabled && isNotLoading;

              if (canSend) {
                const messageText = state.inputText;
                const messageAttachments = state.attachments;

                if (!messageText.trim() && messageAttachments.length === 0) {
                  return;
                }

                const textErrors = yield* validateTextForSending(messageText);
                if (textErrors.length > 0) {
                  return;
                }

                // Update stats
                const newStats = {
                  ...state.stats,
                  totalMessages: state.stats.totalMessages + 1,
                  totalAttachments:
                    state.stats.totalAttachments + messageAttachments.length,
                  totalFileSize:
                    state.stats.totalFileSize +
                    messageAttachments.reduce(
                      (sum, file) => sum + file.size,
                      0
                    ),
                  averageMessageLength: Math.round(
                    (state.stats.averageMessageLength *
                      state.stats.totalMessages +
                      messageText.length) /
                      (state.stats.totalMessages + 1)
                  ),
                  lastMessageTime: new Date(),
                };

                yield* updateState({
                  inputText: "",
                  attachments: [],
                  stats: newStats,
                  validationErrors: [],
                });
                yield* recordInteraction("message_sent", {
                  textLength: messageText.length,
                  attachmentCount: messageAttachments.length,
                });
              }
            }
          }),

        onTextChange: (text: string) =>
          Effect.gen(function* () {
            const errors = yield* validateText(text);
            yield* updateState({
              inputText: text,
              validationErrors: errors,
            });
            yield* recordInteraction("text_change", {
              textLength: text.length,
            });
          }),

        onAgentChange: (agentId: string) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const agent = state.availableAgents.find((a) => a.id === agentId);
            if (!agent) {
              return yield* Effect.fail(
                new UserAreaManagerAgentError({
                  message: `Agent with ID ${agentId} not found`,
                  agentId,
                  operation: "setSelectedAgent",
                })
              );
            }

            if (!agent.isAvailable) {
              return yield* Effect.fail(
                new UserAreaManagerAgentError({
                  message: `Agent ${agentId} is not available`,
                  agentId,
                  operation: "setSelectedAgent",
                })
              );
            }

            const newStats = {
              ...state.stats,
              agentSwitches: state.stats.agentSwitches + 1,
            };

            yield* updateState({
              selectedAgentId: agentId,
              stats: newStats,
            });
            yield* recordInteraction("agent_selected", {
              agentId,
              agentName: agent.name,
            });
          }),

        onFileAttach: (files: readonly File[]) =>
          Effect.gen(function* () {
            yield* Effect.forEach(files, (file) => {
              return Effect.gen(function* () {
                const state = yield* Ref.get(stateRef);
                const config = yield* Ref.get(configRef);
                if (!state || !config) {
                  return yield* Effect.fail(
                    new UserAreaManagerStateError({
                      message: "UserAreaManager not initialized",
                      state: "uninitialized",
                    })
                  );
                }

                const maxAttachments =
                  config.maxAttachments || USER_AREA_CONSTANTS.MAX_ATTACHMENTS;
                if (state.attachments.length >= maxAttachments) {
                  return yield* Effect.fail(
                    new UserAreaManagerFileError({
                      message: `Maximum number of attachments (${maxAttachments}) exceeded`,
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type,
                    })
                  );
                }

                const fileErrors = yield* validateFile(file);
                if (fileErrors.length > 0) {
                  return yield* Effect.fail(
                    new UserAreaManagerFileError({
                      message: `File validation failed: ${fileErrors
                        .map((e) => e.message)
                        .join(", ")}`,
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type,
                    })
                  );
                }

                const newAttachments = [...state.attachments, file];
                yield* updateState({ attachments: newAttachments });
                yield* recordInteraction("file_attached", {
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                });
              });
            });
          }),

        onFileRemove: (file: File) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const newAttachments = state.attachments.filter((f) => f !== file);
            yield* updateState({ attachments: newAttachments });
            yield* recordInteraction("file_removed", {
              fileName: file.name,
              fileSize: file.size,
            });
          }),

        onSendMessage: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const messageText = state.inputText;
            const messageAttachments = state.attachments;

            if (!messageText.trim() && messageAttachments.length === 0) {
              return yield* Effect.fail(
                new UserAreaManagerMessageError({
                  message: "Cannot send empty message without attachments",
                  messageText,
                  attachmentCount: messageAttachments.length,
                })
              );
            }

            const textErrors = yield* validateTextForSending(messageText);
            if (textErrors.length > 0) {
              return yield* Effect.fail(
                new UserAreaManagerValidationError({
                  message: `Message validation failed: ${textErrors
                    .map((e) => e.message)
                    .join(", ")}`,
                  field: "messageText",
                  value: messageText,
                  rule: "message_validation",
                })
              );
            }

            // Update stats
            const newStats = {
              ...state.stats,
              totalMessages: state.stats.totalMessages + 1,
              totalAttachments:
                state.stats.totalAttachments + messageAttachments.length,
              totalFileSize:
                state.stats.totalFileSize +
                messageAttachments.reduce((sum, file) => sum + file.size, 0),
              averageMessageLength: Math.round(
                (state.stats.averageMessageLength * state.stats.totalMessages +
                  messageText.length) /
                  (state.stats.totalMessages + 1)
              ),
              lastMessageTime: new Date(),
            };

            yield* updateState({
              inputText: "",
              attachments: [],
              stats: newStats,
              validationErrors: [],
            });
            yield* recordInteraction("message_sent", {
              textLength: messageText.length,
              attachmentCount: messageAttachments.length,
            });
          }),

        // Validation operations
        validateState: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) return [];

            const textErrors = yield* validateText(state.inputText);
            const fileErrors = yield* Effect.forEach(
              state.attachments,
              validateFile
            );
            const allFileErrors = fileErrors.flat();

            return [...textErrors, ...allFileErrors];
          }),

        validateConfig: (config: UserAreaManagerConfig) =>
          validateConfig(config),

        clearValidationErrors: () =>
          Effect.gen(function* () {
            yield* updateState({ validationErrors: [] });
          }),

        // Statistics and monitoring
        getStats: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }
            return state.stats;
          }),

        resetStats: () =>
          Effect.gen(function* () {
            const initialStats: UserAreaManagerStats = {
              totalMessages: 0,
              totalAttachments: 0,
              totalFileSize: 0,
              agentSwitches: 0,
              averageMessageLength: 0,
              interactionCount: 0,
              lastMessageTime: null,
              sessionDuration: 0,
              errorCount: 0,
              validationFailures: 0,
            };

            yield* updateState({ stats: initialStats });
            yield* recordInteraction("stats_reset");
          }),

        recordInteraction: (type: string, details?: Record<string, unknown>) =>
          recordInteraction(type, details),

        // Configuration operations
        updateConfig: (configUpdates: Partial<UserAreaManagerConfig>) =>
          Effect.gen(function* () {
            const currentConfig = yield* Ref.get(configRef);
            if (!currentConfig) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }

            const newConfig = { ...currentConfig, ...configUpdates };
            const validationErrors = yield* validateConfig(newConfig);
            if (validationErrors.length > 0) {
              return yield* Effect.fail(
                new UserAreaManagerConfigError({
                  message: `Configuration validation failed: ${validationErrors
                    .map((e) => e.message)
                    .join(", ")}`,
                  field: "config",
                  value: newConfig,
                })
              );
            }

            yield* Ref.set(configRef, newConfig);
            yield* recordInteraction("config_updated", {
              updatedFields: Object.keys(configUpdates),
            });
          }),

        getConfig: () =>
          Effect.gen(function* () {
            const config = yield* Ref.get(configRef);
            if (!config) {
              return yield* Effect.fail(
                new UserAreaManagerStateError({
                  message: "UserAreaManager not initialized",
                  state: "uninitialized",
                })
              );
            }
            return config;
          }),

        // Error handling
        clearError: () =>
          Effect.gen(function* () {
            yield* updateState({ errorInfo: null });
          }),

        getLastError: () =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            if (!state) return null;
            return state.errorInfo ? new Error(state.errorInfo.message) : null;
          }),

        handleError: (error: Error, context?: string) =>
          Effect.gen(function* () {
            const errorInfo = {
              message: error.message,
              code: "UNKNOWN_ERROR",
              timestamp: new Date(),
              details: context ? { context } : undefined,
            };

            const state = yield* Ref.get(stateRef);
            if (state) {
              const newStats = {
                ...state.stats,
                errorCount: state.stats.errorCount + 1,
              };
              yield* updateState({ errorInfo, stats: newStats });
            }

            yield* recordInteraction("error_handled", {
              errorMessage: error.message,
              context,
            });
          }),
      } satisfies UserAreaManagerApi;
    }),
    dependencies: [],
  }
) {}
