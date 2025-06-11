"use client";

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
  agentWsUrl?: string;
}

export interface AgentToolBarProps {
  agents: Agent[];
  selectedAgentId?: string;
  onSelectAgent: (agentId: string) => void | Promise<void>; // Updated type
  toolbarConfig?: (agent: Agent) => ToolBarItem[];
  className?: string;
}

const AgentToolBar: React.FC<AgentToolBarProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  toolbarConfig,
  className,
}) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

  const toolbarItems: ToolBarItem[] =
    selectedAgent && toolbarConfig ? toolbarConfig(selectedAgent) : [];

  return (
    // <>
    //   <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', fontSize: '20px', border: '5px solid yellow' }}>
    //     AGENT TOOLBAR TEST MARKER
    //   </div>
    <div
      className={cn(
        "flex items-center justify-start gap-2 py-1 pr-1 rounded-md h-full w-full",
        "bg-transparent",
        className,
      )}
    >
      <Select value={selectedAgentId ?? ""} onValueChange={onSelectAgent}>
        <SelectTrigger
          className="w-[60px] rounded-md text-[6px] leading-none px-2 py-1 text-center overflow-hidden whitespace-nowrap focus:ring-1 focus:ring-ring h-3"
          aria-label="Select agent"
          data-testid="agent-select"
        >
          <SelectValue
            placeholder="Select agent"
            className="text-[6px] leading-none text-center whitespace-nowrap"
          >
            {selectedAgentId
              ? agents.find((a) => a.id === selectedAgentId)?.name
              : "Select agent"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="text-[6px] leading-none min-w-[60px]">
          {agents.map((agent) => (
            <SelectItem
              key={agent.id}
              value={agent.id}
              className="text-[6px] leading-none py-0.5 hover:bg-accent hover:text-accent-foreground whitespace-nowrap flex items-center"
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
          variant="tiny"
          className="h-6 text-[4px] -space-x-1 [&_button]:p-0 [&_button]:mx-0.5 [&_svg.lucide]:!h-3 [&_svg.lucide]:!w-3"
          ariaLabel="Agent control toolbar"
        />
      )}
    </div>
    // </>
  );
};

export default AgentToolBar;
