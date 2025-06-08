import { type ReactNode, createContext, useContext } from "react";
import {
    type ChatRuntimeServiceState,
    useChatRuntimeService,
} from "../hooks/useChatRuntimeService";

// Create the context
const ChatRuntimeContext = createContext<ChatRuntimeServiceState | null>(null);

// Provider component
interface ChatRuntimeProviderProps {
    children: ReactNode;
}

export function ChatRuntimeProvider({ children }: ChatRuntimeProviderProps) {
    const runtimeState = useChatRuntimeService();

    return (
        <ChatRuntimeContext.Provider value={runtimeState}>
            {children}
        </ChatRuntimeContext.Provider>
    );
}

// Hook to use the chat runtime context
export function useChatRuntime(): ChatRuntimeServiceState {
    const context = useContext(ChatRuntimeContext);
    if (!context) {
        throw new Error("useChatRuntime must be used within a ChatRuntimeProvider");
    }
    return context;
} 