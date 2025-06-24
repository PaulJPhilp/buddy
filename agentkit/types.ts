export interface AgentConfig {
  /**
   * The provider to use for this agent (required).
   * Supported: 'openai', 'google', 'anthropic'
   */
  readonly provider: "openai" | "google" | "anthropic";
  readonly name: string;
  readonly model: string;
  readonly prompt: string;
  // Add more agent parameters as needed
}
