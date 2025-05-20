import React from 'react';
import { cn } from '@/lib/utils';
import MinimalInput from './MinimalInput';
import AgentToolBar from './AgentToolBar';
import AttachmentBar from './AttachmentBar';
import type { Agent } from './AgentToolBar';
import type { AttachmentFile } from './AttachmentBar';
import type { ToolBarItem } from '@ui/components/ui/toolbar';
import type { Dispatch, SetStateAction } from 'react';

export interface UserAreaProps {
  /** Function to send a message with optional file attachments */
  onSendMessage: (text: string, files?: File[]) => void | Promise<void>;
  /** List of available agents */
  agents: Agent[];
  /** Currently selected agent ID */
  selectedAgent: string;
  /** Callback when agent selection changes */
  onSelectedAgentChange: Dispatch<SetStateAction<string>>;
  /** List of currently attached files */
  currentAttachments: AttachmentFile[];
  /** Callback when a file is removed */
  onRemoveAttachment: (fileId: string) => void;
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

const UserArea = React.forwardRef<HTMLDivElement, UserAreaProps>(({
  onSendMessage,
  agents,
  selectedAgent,
  onSelectedAgentChange,
  currentAttachments = [],
  onRemoveAttachment,
  minimalInputToolbarConfig,
  agentToolbarConfig,
  className,
  disabled,
  primaryColor,
  secondaryColor,
  activePrimaryColor,
  activeSecondaryColor,
}, ref) => {
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: AttachmentFile[] = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    onSendMessage('', files);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim() && !currentAttachments.length) return;
    onSendMessage(text, []);
  };

  return (
    <div ref={ref} className={cn('flex flex-col gap-3 p-4', className)}>
      {currentAttachments.length > 0 && (
        <AttachmentBar
          attachments={currentAttachments}
          onRemoveAttachment={onRemoveAttachment}
        />
      )}

      <MinimalInput
        onSendMessage={handleSendMessage}
        onAttachFiles={() => document.getElementById('file-input')?.click()}
        disabled={disabled}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        activePrimaryColor={activePrimaryColor}
        activeSecondaryColor={activeSecondaryColor}
        toolbarConfig={minimalInputToolbarConfig}
      />

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

      <input
        type="file"
        id="file-input"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        aria-label="File input"
      />
    </div>
  );
});

UserArea.displayName = 'UserArea';

export type { AttachmentFile } from './AttachmentBar';
export type { Agent } from './AgentToolBar';

export default UserArea;
