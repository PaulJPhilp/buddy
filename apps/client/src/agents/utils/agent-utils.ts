import type { AgentConfig } from "@/features/application/types/AppConfig";

export function isValidAgentId(id: string): boolean {
  return id.trim().length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// Helper to filter agents for workspace (using agent IDs)
export function filterAgentsForWorkspace(
  agents: AgentConfig[],
  agentIds: readonly string[]
): AgentConfig[] {
  return agents.filter((agent) => agentIds.includes(agent.id));
}
