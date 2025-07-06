"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentConfig } from "@/services/agent/types";
import React, { useEffect, useState } from "react";

interface AgentSelectorProps {
  selectedAgent?: string;
  onSelectedAgentChange: (agentId: string) => void;
  disabled?: boolean;
}

export function AgentSelector({
  selectedAgent,
  onSelectedAgentChange,
  disabled,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await fetch("/api/agent");
        if (!response.ok) {
          throw new Error(`Failed to load agents: ${response.statusText}`);
        }
        const agentList: AgentConfig[] = await response.json();
        setAgents(agentList);
      } catch (error) {
        console.error("Failed to load agents:", error);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, []);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Loading agents..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="No agents available" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      onValueChange={onSelectedAgentChange}
      value={selectedAgent}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Agent" />
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.initialAgentName || agent.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
