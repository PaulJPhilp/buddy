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
          "flex items-center justify-between gap-2 p-2 rounded-md",
          className,
        )}
      >
        <Select value={selectedAgentId ?? ""} onValueChange={onSelectAgent}>
          <SelectTrigger
            className="w-auto min-w-[60px] rounded text-[0.5rem] leading-none px-2 py-1 text-center overflow-hidden whitespace-nowrap focus:ring-1 focus:ring-ring"
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
          <SelectContent 
            className="text-[0.5rem] leading-none min-w-[60px]"
          >
            {agents.map((agent) => (
              <SelectItem
                key={agent.id}
                value={agent.id}
                className="text-[0.5rem] leading-none py-0.5 hover:bg-accent hover:text-accent-foreground whitespace-nowrap flex items-center"
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
            ariaLabel="Agent control toolbar"
          />
        )}
      </div>
    // </>
  );
};

export default AgentToolBar;
