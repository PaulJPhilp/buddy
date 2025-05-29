"use client";

import { cn } from "@/lib/utils";
import AttachmentRow from "@ui/components/AttachmentRow";
import type { ToolBarItem } from "@ui/components/ui/toolbar";
import React, { useState } from "react";
import type { Agent } from "./AgentToolBar";
import AgentToolBar from "./AgentToolBar";
import MinimalInput from "./MinimalInput";

export interface UserAreaProps {
  /** Function to send a message with optional file attachments */
  onSendMessage: (text: string, files?: File[]) => void | Promise<void>;
  /** List of available agents */
  agents: Agent[];
  /** Currently selected agent ID */
  selectedAgent: string;
  /** Callback when agent selection changes */
  onSelectedAgentChange: (agentId: string) => void | Promise<void>;
  /** List of currently attached files */
  currentAttachments: File[];
  /** Callback when a file is removed */
  onRemoveAttachment: (fileToRemove: File) => void;
  /** Callback when files are added */
  onAddAttachments: (newFiles: File[]) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Optional toolbar configurations */
  agentToolbarConfig?: (agent: Agent) => ToolBarItem[];
  minimalInputToolbarConfig?: ToolBarItem[];
  /** Optional class name for styling */
  className?: string;
}

const UserArea = React.forwardRef<HTMLDivElement, UserAreaProps>(
  (
    {
      onSendMessage,
      agents,
      selectedAgent,
      onSelectedAgentChange,
      currentAttachments = [],
      onRemoveAttachment,
      onAddAttachments,
      minimalInputToolbarConfig,
      agentToolbarConfig,
      className,
      disabled,
    },
    ref,
  ) => {
    const [inputText, setInputText] = useState("");

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (onAddAttachments) {
        onAddAttachments(files);
      }
    };

    const internalHandleSendMessage = () => {
      if (!inputText.trim() && currentAttachments.length === 0) return;
      onSendMessage(inputText, currentAttachments);
      setInputText("");
    };

    return (
      <div
        ref={ref}
        className={cn("flex flex-col p-1 bg-chat-user-area text-chat-user-area-foreground", className)}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            {currentAttachments.length > 0 && (
              <AttachmentRow
                files={currentAttachments}
                onRemoveFile={onRemoveAttachment}
                className="w-full"
              />
            )}
          </div>

          <div className="flex items-center">
            <MinimalInput
              text={inputText}
              onTextChange={setInputText}
              onSendMessage={internalHandleSendMessage}
              onFilesSelected={onAddAttachments}
              disabled={disabled}
              toolbarConfig={minimalInputToolbarConfig}
              selectedAgentId={selectedAgent}
              agents={agents}
            />
          </div>

          <div className="flex items-center">
            {agents.length > 0 && (
              <AgentToolBar
                agents={agents}
                selectedAgentId={selectedAgent}
                onSelectAgent={onSelectedAgentChange}
                toolbarConfig={agentToolbarConfig}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

UserArea.displayName = "UserArea";

export type { Agent } from "./AgentToolBar";

export default UserArea;
