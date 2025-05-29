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
        className={cn("w-full bg-chat-user-area text-chat-user-area-foreground", className)}
      >
        <div className="max-w-4xl mx-auto p-0.5 w-full">
          {/* 3-Row Layout: AttachmentToolbar, MinimalInput, AgentToolbar */}
          <div className="flex flex-col h-16 space-y-2">

            {/* Row 1: AttachmentToolbar */}
            <div className="flex-1 flex items-center min-h-0">
              <AttachmentRow
                files={currentAttachments}
                onRemoveFile={onRemoveAttachment}
                className="w-full h-full flex items-center"
              />
            </div>

            {/* Row 2: MinimalInput */}
            <div className="flex-1 flex items-center min-h-0">
              <MinimalInput
                text={inputText}
                onTextChange={setInputText}
                onSendMessage={internalHandleSendMessage}
                onFilesSelected={onAddAttachments}
                disabled={disabled}
                toolbarConfig={minimalInputToolbarConfig}
                selectedAgentId={selectedAgent}
                agents={agents}
                className="w-full h-full"
              />
            </div>

            {/* Row 3: AgentToolbar */}
            <div className="flex-1 flex items-center min-h-0">
              {agents.length > 0 ? (
                <AgentToolBar
                  agents={agents}
                  selectedAgentId={selectedAgent}
                  onSelectAgent={onSelectedAgentChange}
                  toolbarConfig={agentToolbarConfig}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[7px]">
                  No agents available
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  },
);

UserArea.displayName = "UserArea";

export type { Agent } from "./AgentToolBar";

export default UserArea;
