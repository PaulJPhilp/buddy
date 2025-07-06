import path from "node:path";
import { agentConfigServiceLayerWithPath } from "../../src/services/agent-config/service.js";

// Create a test agents directory path
const TEST_ROOT = path.join(__dirname, "test-files");
const TEST_AGENTS_PATH = path.join(TEST_ROOT, "agents");

// Export test agent data for reuse
export const TEST_AGENT = {
  id: "test-agent",
  initialAgentName: "Test Agent",
  prompt: "You are a test agent.",
  provider: "test",
  model: "test-model",
};

// Export the test agent config layer
export const TestAgentConfigLayer =
  agentConfigServiceLayerWithPath(TEST_AGENTS_PATH);
