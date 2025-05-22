"use client";

import { Icon } from "@ui/components/Icon";
import type { ToolBarItem } from "@ui/components/ui/toolbar";
import { useMemo } from "react";
import type { AgentConfigData } from "../../features/chat/hooks/chatInstanceTypes"; // NEW TYPES
// import { useChatAppInstance, type UseChatAppInstanceConfig } from "@/hooks/useChatAppInstance"; // OLD HOOK
import { useChatInstance } from "../../features/chat/hooks/useChatInstance"; // NEW HOOK
import { useBusinessChatStore } from "../../stores/chatStores";
import ChatApp from "./ChatApp";

interface BusinessChatProps {
  isActive?: boolean;
  onActivate?: () => void;
  // Add a unique ID for this chat instance, or generate one if not provided
  // For now, let's assume it might be passed or we generate a static one for example purposes
  chatInstanceId?: string;
}

// TODO: This URL should come from configuration, environment variables, or a service discovery mechanism.
const DEFAULT_AGENT_WS_URL = "ws://localhost:8080/api/agent/socket"; // Placeholder

export default function BusinessChat({
  isActive,
  onActivate,
  chatInstanceId = "business-chat-001",
}: BusinessChatProps) {
  const {
    theme,
    agents: initialAgents, // This is Array<Agent> from store
    selectedAgent: initialSelectedAgentId,
  } = useBusinessChatStore();

  // Find the selected agent object to get its name for initialAgentName
  const selectedAgentObject = useMemo(
    () => initialAgents.find((agent) => agent.id === initialSelectedAgentId),
    [initialAgents, initialSelectedAgentId],
  );

  // Prepare AgentConfigData for the new hook
  // TODO: agentWsUrl should be dynamic based on the selected agent or a global config.
  // For now, using a default. The agentId from the store will be used for the specific agent.
  const agentConfig: AgentConfigData = useMemo(
    () => ({
      agentId:
        initialSelectedAgentId ||
        (initialAgents.length > 0 ? initialAgents[0].id : "default-agent"),
      agentWsUrl: DEFAULT_AGENT_WS_URL, // Placeholder - This needs to be properly configured
      initialAgentName:
        selectedAgentObject?.name ||
        (initialAgents.length > 0 ? initialAgents[0].name : "Business Agent"),
    }),
    [initialSelectedAgentId, initialAgents, selectedAgentObject],
  );

  // Use the new useChatInstance hook
  const { chatState, dispatchAction, runtimeError } = useChatInstance(
    chatInstanceId,
    agentConfig,
  );

  const handleSendMessage = (text: string, files?: File[]) => {
    if (!text.trim() && (!files || files.length === 0)) {
      return;
    }
    dispatchAction({ _tag: "sendMessage", text });
    // File handling with dispatchAction would need to be added if `sendMessage` action supports files.
  };

  const handleSelectedAgentChange = (agentId: string) => {
    // The new hook doesn't directly handle agent changes via dispatchAction in its current design.
    // This would typically involve re-initializing the useChatInstance hook with a new AgentConfig
    // (which means BusinessChat would need to manage and pass a new agentConfig object),
    // or the hook's Effect program would need a new ChatAction like `changeAgent`.
    // For now, this action might update the store, and then BusinessChat would get new props, leading to re-render and potentially new agentConfig.
    // This part needs further design based on how agent switching should affect the hook's lifecycle.
    console.warn(
      "handleSelectedAgentChange - Re-evaluate how agent switching impacts useChatInstance and its AgentConfig",
      agentId,
    );
    // Potentially: useBusinessChatStore.getState().setSelectedAgent(agentId); // This would trigger re-render with new selectedAgentObject etc.
  };

  const minimalInputToolbarConfig: ToolBarItem[] = [
    {
      id: "dashboard",
      icon: <Icon name="LayoutDashboard" size={6} />,
      action: () => console.log("Open dashboard"),
      tooltip: "Open Dashboard",
      intent: "primary",
    },
    {
      id: "attach",
      icon: <Icon name="Paperclip" size={6} />,
      action: () =>
        console.log(
          "Attach file - TODO: Connect to dispatchAction or other mechanism",
        ),
      tooltip: "Attach File",
    },
    {
      id: "send",
      icon: <Icon name="Send" size={6} />,
      action: () =>
        console.log(
          "Send button in toolbar clicked - UserArea handles actual send via onSendMessage prop",
        ),
      tooltip: "Send Message",
      intent: "secondary",
    },
  ];

  if (
    chatState.status === "initializing" ||
    (chatState.status === "connecting" && chatState.messages.length === 0)
  ) {
    return <div>Loading Chat Instance ({chatState.status})...</div>; // Or a proper loading spinner
  }

  if (runtimeError) {
    return <div>Error initializing chat runtime: {String(runtimeError)}</div>;
  }

  // Map chatState from the new hook to ChatAppProps
  const chatAppProps = {
    appName: "Business Analytics", // Or could come from chatState.agentName or agentConfig.initialAgentName
    isActive: isActive,
    onActivate: onActivate,
    messages: chatState.messages,
    isTyping: chatState.status === "connected" && false, // The new hook doesn't have a dedicated isTyping in ChatState yet, inferring for now
    isSending: chatState.status === "connecting", // This maps to the brief moment of sending, might need refinement
    error: chatState.error,
    agents: initialAgents, // Pass agents from the store
    selectedAgent: agentConfig.agentId, // Reflect the agentId used by the hook
    onSendMessage: handleSendMessage,
    onSelectedAgentChange: handleSelectedAgentChange,
    minimalInputToolbarConfig: minimalInputToolbarConfig,
    ...theme, // Spread theme properties
  };

  return <ChatApp {...chatAppProps} />;
}
