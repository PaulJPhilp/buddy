"use client";

import { cn } from "@/utils";
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

    // Debug wrapper for setInputText
    const handleTextChange = (newText: string) => {
      console.log("[UserArea] Text change:", {
        oldText: inputText,
        newText,
        disabled,
      });
      setInputText(newText);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (onAddAttachments) {
        onAddAttachments(files);
      }
    };

    const internalHandleSendMessage = () => {
      console.log("[UserArea] internalHandleSendMessage called:", {
        inputText,
        inputTextLength: inputText.length,
        trimmedLength: inputText.trim().length,
        attachmentsCount: currentAttachments.length,
        hasAttachments: currentAttachments.length > 0,
      });

      if (!inputText.trim() && currentAttachments.length === 0) {
        console.log("[UserArea] Send blocked: no text and no attachments");
        return;
      }

      console.log("[UserArea] Calling onSendMessage with:", {
        text: inputText,
        attachments: currentAttachments.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      });

      onSendMessage(inputText, currentAttachments);
      console.log("[UserArea] onSendMessage called, clearing input text");
      setInputText("");
    };

    return (
      <div
        ref={ref}
        className={cn("w-full border-t h-12", className)}
        style={{
          backgroundColor: "var(--color-chat-user-area)",
          color: "var(--color-chat-foreground)",
          borderColor: "var(--color-chat-border)",
        }}
      >
        <div className="w-full max-w-4xl mx-auto px-1 py-0.5 space-y-0.5">
          {/* 3-Row Layout: AttachmentToolbar, MinimalInput, AgentToolbar */}
          <div className="flex flex-col space-y-1 w-1/2 mx-auto text-xs">
            {/* Row 1: AttachmentToolbar */}
            {currentAttachments.length > 0 && (
              <div className="w-full flex items-center h-3">
                <AttachmentRow
                  files={currentAttachments}
                  onRemoveFile={onRemoveAttachment}
                  className="w-full flex items-center"
                />
              </div>
            )}

            {/* Row 2: MinimalInput */}
            <div className="w-full flex items-center h-6">
              <MinimalInput
                text={inputText}
                onTextChange={handleTextChange}
                onSendMessage={internalHandleSendMessage}
                onFilesSelected={onAddAttachments}
                disabled={disabled}
                toolbarConfig={minimalInputToolbarConfig}
                selectedAgentId={selectedAgent}
                agents={agents}
                className="w-full"
              />
            </div>

            {/* Row 3: AgentToolbar */}
            {agents.length > 0 && (
              <div className="w-full flex items-center h-3">
                <AgentToolBar
                  agents={agents}
                  selectedAgentId={selectedAgent}
                  onSelectAgent={onSelectedAgentChange}
                  toolbarConfig={agentToolbarConfig}
                  className="w-full"
                />
              </div>
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
