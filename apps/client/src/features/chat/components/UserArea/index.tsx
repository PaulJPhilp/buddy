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
  /** Theme colors */
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;
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
      primaryColor,
      secondaryColor,
      activePrimaryColor,
      activeSecondaryColor,
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
        className={cn("flex flex-col h-[5rem] p-1", className)}
        style={{ backgroundColor: secondaryColor }}
      >
        <div className="grid grid-rows-3 h-full gap-1">
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
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              activePrimaryColor={activePrimaryColor}
              activeSecondaryColor={activeSecondaryColor}
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
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                activePrimaryColor={activePrimaryColor}
                activeSecondaryColor={activeSecondaryColor}
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
