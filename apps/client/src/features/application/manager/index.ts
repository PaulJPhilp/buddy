/**
 * This barrel file is the public API for the main Application Component (`AppComponent`).
 * It exports the service itself, its API, all related types, errors, and UI containers.
 * This is the single entry point for interacting with the core application logic.
 */
export * from "./api";
export * from "./errors";
export * from "./service";
export * from "./types";
export * from "./AppContainer";
export * from "./AppShellIntegration";
export * from "./AppManagementUI";
export * from "./ManagerDashboard";
export * from "./AppShell";
export * from "./AppSidebar";
export * from "./WorkspaceTree";
