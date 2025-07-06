"use client";

import { AppManager } from "@/managers/app-manager";
import type { AppManagerState } from "@/managers/app-manager/api";
import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";

export interface AppManagerUIProps {
  className?: string;
}

export function AppManagerUI({ className }: AppManagerUIProps) {
  const [state, setState] = useState<AppManagerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const serviceLayerRef = useRef<any>(null);

  // Form states for better UX
  const [showAddWorkspaceForm, setShowAddWorkspaceForm] = useState(false);
  const [showAddAgentForm, setShowAddAgentForm] = useState(false);
  const [workspaceFormData, setWorkspaceFormData] = useState({
    name: "",
    description: "",
    icon: "📁",
    color: "#3b82f6",
  });
  const [agentFormData, setAgentFormData] = useState({
    name: "",
    description: "",
    avatar: "🤖",
  });

  useEffect(() => {
    const initializeService = async () => {
      try {
        // Create the service layer once and reuse it
        if (!serviceLayerRef.current) {
          serviceLayerRef.current = AppManager.Default;
        }

        const program = Effect.gen(function* () {
          const appManager = yield* AppManager;

          // Subscribe to state changes
          const unsubscribe = yield* appManager.subscribe((newState) => {
            console.log("🔄 State update received:", {
              workspaceCount: Object.keys(newState.workspaces).length,
              workspaces: Object.keys(newState.workspaces),
              currentWorkspaceId: newState.currentWorkspaceId,
              timestamp: new Date().toISOString(),
              isLoading: newState.isLoading,
            });
            console.log("🔄 Setting React state with new workspace data...");
            setState(newState);
            setIsLoading(newState.isLoading);
            console.log("🔄 React state updated");
          });

          // Load initial data
          yield* appManager.loadInitialData();

          return unsubscribe;
        });

        const result = await Effect.runPromise(
          Effect.provide(program, serviceLayerRef.current),
        );

        unsubscribeRef.current = result;
      } catch (error) {
        console.error("Failed to initialize AppManager:", error);
        setError("Failed to initialize workspace service");
      }
    };

    initializeService();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Service actions
  const actions = {
    createWorkspace: async () => {
      console.log("🚀 createWorkspace called with data:", workspaceFormData);

      if (!workspaceFormData.name.trim()) {
        console.log("❌ Validation failed: name is required");
        setError("Workspace name is required");
        return;
      }

      try {
        console.log("📝 Creating workspace with Effect program...");
        const program = Effect.gen(function* () {
          console.log("🔄 Getting AppManager service...");
          const appManager = yield* AppManager;

          // Get current agents to use as available agents
          console.log("📊 Getting current state for agents...");
          const currentState = yield* appManager.getState();
          const availableAgents = Object.keys(currentState.agents);
          console.log("👥 Available agents:", availableAgents);

          console.log("✨ Calling createWorkspace with params:", {
            name: workspaceFormData.name,
            description: workspaceFormData.description,
            icon: workspaceFormData.icon,
            color: workspaceFormData.color,
            availableAgents:
              availableAgents.length > 0 ? availableAgents : ["default-agent"],
          });

          return yield* appManager.createWorkspace({
            name: workspaceFormData.name,
            description: workspaceFormData.description,
            icon: workspaceFormData.icon,
            color: workspaceFormData.color,
            availableAgents:
              availableAgents.length > 0 ? availableAgents : ["default-agent"],
          });
        });

        console.log("🏃 Running Effect program...");
        const result = await Effect.runPromise(
          Effect.provide(program, serviceLayerRef.current),
        );
        console.log("✅ Workspace created successfully:", result);
        console.log("📊 Checking current state after creation...");

        // Get the current state to verify the workspace was added
        const verifyProgram = Effect.gen(function* () {
          const appManager = yield* AppManager;
          const currentState = yield* appManager.getState();
          console.log("📋 Current state verification:", {
            totalWorkspaces: Object.keys(currentState.workspaces).length,
            workspaceIds: Object.keys(currentState.workspaces),
            newWorkspaceInState: !!currentState.workspaces[result.id],
            workspacesData: currentState.workspaces,
            reactState: state,
            reactStateWorkspaceCount: state
              ? Object.keys(state.workspaces).length
              : 0,
          });
          return currentState;
        });

        await Effect.runPromise(
          Effect.provide(verifyProgram, serviceLayerRef.current),
        );

        // Force a state refresh to ensure UI updates
        console.log("🔄 Forcing state refresh...");
        const refreshProgram = Effect.gen(function* () {
          const appManager = yield* AppManager;
          const freshState = yield* appManager.getState();
          console.log("🔄 Fresh state retrieved:", {
            workspaceCount: Object.keys(freshState.workspaces).length,
            workspaceIds: Object.keys(freshState.workspaces),
          });
          setState(freshState);
          return freshState;
        });

        await Effect.runPromise(
          Effect.provide(refreshProgram, serviceLayerRef.current),
        );

        // Reset form and close modal
        setWorkspaceFormData({
          name: "",
          description: "",
          icon: "📁",
          color: "#3b82f6",
        });
        setShowAddWorkspaceForm(false);
        setError(null);
        console.log("🎉 Form reset and closed");
      } catch (error) {
        console.error("❌ Failed to create workspace:", error);
        setError(
          `Failed to create workspace: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },

    addAgent: async () => {
      if (!agentFormData.name.trim()) {
        setError("Agent name is required");
        return;
      }

      try {
        const program = Effect.gen(function* () {
          const appManager = yield* AppManager;
          return yield* appManager.addAgent({
            name: agentFormData.name,
            avatar: agentFormData.avatar,
            description:
              agentFormData.description ||
              `AI assistant: ${agentFormData.name}`,
          });
        });

        await Effect.runPromise(
          Effect.provide(program, serviceLayerRef.current),
        );

        setAgentFormData({
          name: "",
          description: "",
          avatar: "🤖",
        });
        setShowAddAgentForm(false);
        setError(null);
      } catch (error) {
        console.error("Failed to add agent:", error);
        setError(
          `Failed to add agent: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Loading workspace data...</span>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className={`p-6 ${className}`}>
        <p className="text-gray-500">No workspace data available</p>
      </div>
    );
  }

  const workspaces = Object.values(state.workspaces || {});
  const agentsMap = state.agents || {};
  const chatAppsMap = state.chatApps || {};

  return (
    <div className={`p-6 space-y-8 max-w-6xl mx-auto ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <p className="text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            EffectTalk Workspace Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Demonstrating reactive service-first architecture
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setShowAddWorkspaceForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            + New Workspace
          </button>
          <button
            type="button"
            onClick={() => setShowAddAgentForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            + New Agent
          </button>
        </div>
      </div>

      {/* Add Workspace Form */}
      {showAddWorkspaceForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Create New Workspace
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="workspace-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="workspace-name"
                type="text"
                value={workspaceFormData.name}
                onChange={(e) =>
                  setWorkspaceFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter workspace name"
              />
            </div>
            <div>
              <label
                htmlFor="workspace-icon"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Icon
              </label>
              <input
                id="workspace-icon"
                type="text"
                value={workspaceFormData.icon}
                onChange={(e) =>
                  setWorkspaceFormData((prev) => ({
                    ...prev,
                    icon: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="📁"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="workspace-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="workspace-description"
                value={workspaceFormData.description}
                onChange={(e) =>
                  setWorkspaceFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={2}
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={() => setShowAddWorkspaceForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                actions.createWorkspace();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Create Workspace
            </button>
          </div>
        </div>
      )}

      {/* Add Agent Form */}
      {showAddAgentForm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Add New Agent
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="agent-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="agent-name"
                type="text"
                value={agentFormData.name}
                onChange={(e) =>
                  setAgentFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter agent name"
              />
            </div>
            <div>
              <label
                htmlFor="agent-avatar"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Avatar
              </label>
              <input
                id="agent-avatar"
                type="text"
                value={agentFormData.avatar}
                onChange={(e) =>
                  setAgentFormData((prev) => ({
                    ...prev,
                    avatar: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="🤖"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="agent-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="agent-description"
                value={agentFormData.description}
                onChange={(e) =>
                  setAgentFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={2}
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={() => setShowAddAgentForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={actions.addAgent}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              Add Agent
            </button>
          </div>
        </div>
      )}

      {/* Workspaces Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Workspaces</h2>
          <span className="text-sm text-gray-500">
            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
          </span>
        </div>

        {workspaces.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No workspaces yet</p>
            <button
              type="button"
              onClick={() => setShowAddWorkspaceForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => {
              // New pattern: look up chat apps and agents by ID
              const workspaceChatApps = (workspace.chatAppIds || [])
                .map((id) => chatAppsMap[id])
                .filter(Boolean);
              const workspaceAgents = (workspace.availableAgents || [])
                .map((id) => agentsMap[id])
                .filter(Boolean);
              return (
                <div
                  key={workspace.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{workspace.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {workspace.description}
                      </p>
                    </div>
                    {state.currentWorkspaceId === workspace.id && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {workspaceAgents.length} agent
                    {workspaceAgents.length !== 1 ? "s" : ""}
                  </div>
                  {/* Render chat apps for this workspace */}
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {workspaceChatApps.length} chat app
                      {workspaceChatApps.length !== 1 ? "s" : ""}
                    </div>
                    {workspaceChatApps.length === 0 ? (
                      <div className="text-gray-400 italic text-xs">
                        No chat apps
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {workspaceChatApps.map((app) => (
                          <li key={app.id} className="text-sm text-gray-700">
                            <span className="font-medium">
                              {app.config?.name || app.id}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {app.config?.agentId}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agents Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Agents</h2>
          <span className="text-sm text-gray-500">
            {Object.keys(agentsMap).length} agent
            {Object.keys(agentsMap).length !== 1 ? "s" : ""}
          </span>
        </div>

        {Object.keys(agentsMap).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No agents yet</p>
            <button
              type="button"
              onClick={() => setShowAddAgentForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              Add Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(agentsMap).map((agent) => (
              <div
                key={agent.id}
                className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">{agent.avatar}</div>
                <h3 className="font-medium text-gray-900 mb-1">{agent.name}</h3>
                <p className="text-sm text-gray-500">{agent.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live State Inspector */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Live State Inspector
        </h2>
        <div className="bg-white border border-gray-200 rounded p-4">
          <pre className="text-xs text-gray-600 overflow-auto max-h-64">
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
