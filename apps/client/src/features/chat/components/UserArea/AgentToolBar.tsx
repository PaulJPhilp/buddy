import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/ui/select";
import { ToolBar, type ToolBarItem } from "@ui/components/ui/toolbar";
import { cn } from "@ui/lib/utils";
import React from "react";

export interface AgentStatus {
  mood: number;
  energy: number;
  health: number;
}

export interface AgentCapabilities {
  canSpeak: boolean;
  canMove: boolean;
  canLearn: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  capabilities: AgentCapabilities;
  avatar?: string;
  type?: string;
}

export interface AgentToolBarProps {
  agents: Agent[];
  selectedAgentId?: string;
  onSelectAgent: (agentId: string) => void | Promise<void>; // Updated type
  toolbarConfig?: (agent: Agent) => ToolBarItem[];
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;
}

const AgentToolBar: React.FC<AgentToolBarProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  toolbarConfig,
  className,
  primaryColor,
  secondaryColor,
  activePrimaryColor,
  activeSecondaryColor,
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

  const toolbarItems: ToolBarItem[] =
    selectedAgent && toolbarConfig ? toolbarConfig(selectedAgent) : [];

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 p-1 rounded-md",
        className,
      )}
    >
      <Select value={selectedAgentId ?? ""} onValueChange={onSelectAgent}>
        <SelectTrigger
          className="w-[60px] h-4 bg-white rounded text-[0.5rem] leading-none py-0 px-1 text-center overflow-hidden whitespace-nowrap"
          aria-label="Select agent"
          data-testid="agent-select"
        >
          <SelectValue
            placeholder="Select agent"
            className="text-[0.5rem] leading-none text-center whitespace-nowrap"
          >
            {selectedAgentId
              ? agents.find((a) => a.id === selectedAgentId)?.name
              : "Select agent"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="text-[0.5rem] leading-none bg-white min-w-[60px]">
          {agents.map((agent) => (
            <SelectItem
              key={agent.id}
              value={agent.id}
              className="text-[0.5rem] leading-none py-0.5 bg-white hover:bg-gray-50 whitespace-nowrap"
              data-testid={`agent-option-${agent.id}`}
            >
              {agent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAgent && toolbarItems.length > 0 && (
        <ToolBar
          commands={toolbarItems}
          variant="compact"
          className=""
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          activePrimaryColor={activePrimaryColor}
          activeSecondaryColor={activeSecondaryColor}
          ariaLabel="Agent control toolbar"
        />
      )}
    </div>
  );
};

export default AgentToolBar;
