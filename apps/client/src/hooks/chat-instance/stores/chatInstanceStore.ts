import { createStore } from '@xstate/store';
import type { ChatInstanceState } from '../types';

// Initial state factory
const createInitialState = (): ChatInstanceState => ({
    chatId: '',
    messages: [],
    status: 'initializing',
    agentName: '',
    isTyping: false,
    error: undefined,
});

// Chat Instance Store - manages core chat state
export const chatInstanceStore = createStore({
    context: createInitialState(),
    on: {
        initialize: (context, event: { chatId: string; agentName: string }) => ({
            ...context,
            chatId: event.chatId,
            agentName: event.agentName,
            status: 'initializing' as const,
            messages: [],
            isTyping: false,
            error: undefined,
        }),

        statusChanged: (context, event: { status: ChatInstanceState['status'] }) => ({
            ...context,
            status: event.status,
            // Clear error when status changes to a non-error state
            error: event.status === 'error' ? context.error : undefined,
        }),

        messageAdded: (context, event: { message: ChatInstanceState['messages'][0] }) => ({
            ...context,
            messages: [...context.messages, event.message],
            // Clear typing when a message is added
            isTyping: false,
        }),

        messagesCleared: (context) => ({
            ...context,
            messages: [],
            isTyping: false,
        }),

        typingChanged: (context, event: { isTyping: boolean }) => ({
            ...context,
            isTyping: event.isTyping,
        }),

        errorOccurred: (context, event: { error: string }) => ({
            ...context,
            error: event.error,
            status: 'error' as const,
            isTyping: false,
        }),

        errorCleared: (context) => ({
            ...context,
            error: undefined,
            // Don't change status here - let connection/status events handle that
        }),

        agentNameChanged: (context, event: { agentName: string }) => ({
            ...context,
            agentName: event.agentName,
        }),
    },
});

// Selectors for common state access patterns
export const chatInstanceSelectors = {
    // Get the full state
    getState: (state: typeof chatInstanceStore.getSnapshot) => state().context,

    // Get specific parts of state
    getMessages: (state: typeof chatInstanceStore.getSnapshot) => state().context.messages,
    getStatus: (state: typeof chatInstanceStore.getSnapshot) => state().context.status,
    getIsTyping: (state: typeof chatInstanceStore.getSnapshot) => state().context.isTyping,
    getError: (state: typeof chatInstanceStore.getSnapshot) => state().context.error,
    getChatId: (state: typeof chatInstanceStore.getSnapshot) => state().context.chatId,
    getAgentName: (state: typeof chatInstanceStore.getSnapshot) => state().context.agentName,

    // Computed selectors
    getLastMessage: (state: typeof chatInstanceStore.getSnapshot) => {
        const messages = state().context.messages;
        return messages.length > 0 ? messages[messages.length - 1] : null;
    },

    getMessageCount: (state: typeof chatInstanceStore.getSnapshot) => state().context.messages.length,

    getIsConnected: (state: typeof chatInstanceStore.getSnapshot) =>
        state().context.status === 'connected',

    getHasError: (state: typeof chatInstanceStore.getSnapshot) =>
        state().context.status === 'error' || Boolean(state().context.error),
};

// Action creators for type-safe event dispatching
export const chatInstanceActions = {
    initialize: (chatId: string, agentName: string) =>
        chatInstanceStore.send({ type: 'initialize', chatId, agentName }),

    setStatus: (status: ChatInstanceState['status']) =>
        chatInstanceStore.send({ type: 'statusChanged', status }),

    addMessage: (message: ChatInstanceState['messages'][0]) =>
        chatInstanceStore.send({ type: 'messageAdded', message }),

    clearMessages: () =>
        chatInstanceStore.send({ type: 'messagesCleared' }),

    setTyping: (isTyping: boolean) =>
        chatInstanceStore.send({ type: 'typingChanged', isTyping }),

    setError: (error: string) =>
        chatInstanceStore.send({ type: 'errorOccurred', error }),

    clearError: () =>
        chatInstanceStore.send({ type: 'errorCleared' }),

    setAgentName: (agentName: string) =>
        chatInstanceStore.send({ type: 'agentNameChanged', agentName }),
}; 