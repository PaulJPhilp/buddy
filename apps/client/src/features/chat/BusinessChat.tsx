"use client";

import { Icon } from "@ui/components/Icon";
import type { ToolBarItem } from "@ui/components/ui/toolbar";
import { useMemo } from "react";
// import { useChatAppInstance, type UseChatAppInstanceConfig } from "@/hooks/useChatAppInstance"; // OLD HOOK
import { useChatInstance } from "../../hooks/useChatInstance"; // NEW HOOK
import { useAppShellStore } from "../../stores/appShellStore"; // IMPORT appShellStore
import { useBusinessChatStore } from "../../stores/chatStores";
import ChatApp from "./ChatApp";
// OLD: import type { AgentConfigData } from "../../hooks/chatInstanceTypes"; // NEW TYPES
import type { ChatAgentConfig, Message as ChatInstanceMessage, FileAttachment } from "./types"; // UPDATED import from AgentConfigData to ChatAgentConfig

interface BusinessChatProps {
  isActive?: boolean;
  onActivate?: () => void;
  // chatInstanceId is now derived from the store
}

export default function BusinessChat({
  isActive,
  onActivate,
}: BusinessChatProps) { // Removed chatInstanceId from props
  const {
    theme,
    agents: initialAgents, // This is Array<Agent> from store
    selectedAgent: initialSelectedAgentId,
  } = useBusinessChatStore();

  const { selectedThreadId } = useAppShellStore(); // GET selectedThreadId

  // Find the selected agent object to get its name for initialAgentName
  const selectedAgentObject = useMemo(
    () => initialAgents.find((agent) => agent.id === initialSelectedAgentId),
    [initialAgents, initialSelectedAgentId],
  );

  // Prepare AgentConfigData for the new hook
  const agentConfig: ChatAgentConfig = useMemo(() => {
    const agentId =
      initialSelectedAgentId ||
      (initialAgents.length > 0 ? initialAgents[0].id : "default-agent");
    const currentAgent = initialAgents.find((agent) => agent.id === agentId);

    // Use a default/fallback URL if not specified on the agent object, or throw an error.
    // For now, let's assume a default is less safe and we should ensure agents have their URLs.
    const wsUrl = currentAgent?.agentWsUrl;
    if (!wsUrl) {
      // This case should ideally not happen if agents are configured correctly.
      // Depending on requirements, could throw error, or use a global default as a last resort.
      console.error(`Agent ${agentId} does not have agentWsUrl configured.`);
      // Fallback to a globally defined default if absolutely necessary, but this is not ideal.
      // For this implementation, we will throw to highlight misconfiguration.
      throw new Error(`Configuration error: agentWsUrl missing for agent ${agentId}`);
    }

    return {
      agentId,
      agentWsUrl: wsUrl, // USE DYNAMIC URL
      initialAgentName:
        currentAgent?.name ||
        (initialAgents.length > 0 ? initialAgents[0].name : "Business Agent"),
    };
  }, [initialSelectedAgentId, initialAgents]);

  // Conditional rendering if no thread is selected
  if (!selectedThreadId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No chat selected. Please select a chat thread.</p>
      </div>
    );
  }

  // Use the new useChatInstance hook
  const { chatState, dispatchAction, runtimeError } = useChatInstance(
    selectedThreadId, // USE selectedThreadId from store
    agentConfig,
  );

  const handleSendMessage = (text: string, files?: File[]) => {
    if (!text.trim() && (!files || files.length === 0)) {
      return;
    }
    // Map File[] to FileAttachment[] for the action
    const attachmentsForAction: FileAttachment[] | undefined = files?.map(file => ({
      id: file.name, // Using name as ID, consider more robust ID if needed for backend
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    dispatchAction({
      _tag: "sendMessage",
      text,
      attachments: attachmentsForAction
    });
  };

  const handleSelectedAgentChange = (agentId: string) => {
    // The new hook doesn't directly handle agent changes via dispatchAction in its current design.
    // This would typically involve re-initializing the useChatInstance hook with a new AgentConfig
    // (which means BusinessChat would need to manage and pass a new agentConfig object),
    // or the hook's Effect program would need a new ChatAction like `changeAgent`.
    // For now, this action might update the store, and then BusinessChat would get new props, leading to re-render and potentially new agentConfig.
    // This part needs further design based on how agent switching should affect the hook's lifecycle.
    // console.warn(
    //   "handleSelectedAgentChange - Re-evaluate how agent switching impacts useChatInstance and its AgentConfig",
    //   agentId,
    // ); 
    // Potentially: useBusinessChatStore.getState().setSelectedAgent(agentId); // This would trigger re-render with new selectedAgentObject etc.
    useBusinessChatStore.getState().setSelectedAgent(agentId);
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
    messages: chatState.messages.map((m: ChatInstanceMessage) => {
      // Construct metadata expected by ChatAppProps
      const messageMetadata = {
        length: m.text.length,
        hasAttachments: !!(m.attachments && m.attachments.length > 0),
        attachedFileCount: m.attachments?.length ?? 0,
        fileNames: m.attachments?.map(att => att.name) ?? [],
        // Preserve any other metadata if present, though ChatAppProps might only care about the above
        // Cast m.metadata to ensure compatibility if it exists
        ...(m.metadata as Record<string, unknown> || {}),
      };

      return {
        ...m,
        sender: m.role === "user" ? "user" as const : "assistant" as const, // Map role to sender
        timestamp: m.timestamp, // timestamp is already a number from ChatInstanceMessage
        metadata: messageMetadata,
      };
    }),
    isTyping: chatState.isTyping, // USE new isTyping from chatState
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

