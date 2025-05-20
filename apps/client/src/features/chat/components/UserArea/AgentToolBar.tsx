import React from 'react';
import { cn } from '@ui/lib/utils';
import { ToolBar, type ToolBarItem } from '@ui/components/ui/toolbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/ui/select';

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
  onSelectAgent: (agentId: string) => void;
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
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
  
  const toolbarItems: ToolBarItem[] = selectedAgent && toolbarConfig 
    ? toolbarConfig(selectedAgent)
    : [];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select
        value={selectedAgentId ?? ''}
        onValueChange={onSelectAgent}
      >
        <SelectTrigger 
          className="w-[180px]"
          aria-label="Select agent"
          data-testid="agent-select"
        >
          <SelectValue placeholder="Select an agent" />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem 
              key={agent.id} 
              value={agent.id}
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
          className="flex-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
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
