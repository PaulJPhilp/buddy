"use client";

import { useWorkspaceManager } from "@/components/workspace/useWorkspaceManager";
import type { WorkspaceModel } from "@/domain/workspace";
import { WorkspaceForm } from "@/features/workspaces-editor/workspace-editor/components/WorkspaceForm";
import React from "react";
import { useState } from "react";
import type { WorkspaceCreateInput } from "../../managers/workspace-manager/types";
import { WorkspaceTree } from "./WorkspaceTree";

interface AppSidebarProps {
  className?: string;
  isOpen: boolean;
}

export function AppSidebar({ className = "", isOpen }: AppSidebarProps) {
  const { createWorkspace } = useWorkspaceManager();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div
      className={`
        fixed left-0 top-0 h-full
        transition-transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${className}
      `}
      style={{
        width: "var(--app-sidebar-width, 160px)",
        backgroundColor: "var(--app-sidebar-background, #ffffff)",
        borderRight: "1px solid var(--app-sidebar-border, #e5e7eb)",
        fontFamily: "var(--app-font-family, 'Geist', system-ui, sans-serif)",
        boxShadow: "var(--app-sidebar-shadow, 1px 0 3px 0 rgba(0, 0, 0, 0.1))",
        padding: "var(--app-sidebar-padding, 0px)",
        borderRadius: "var(--app-sidebar-border-radius, 0px)",
        transitionDuration: "var(--app-sidebar-transition-duration, 200ms)",
        zIndex: "var(--app-sidebar-z-index, 30)",
        color: "var(--app-sidebar-foreground, #111827)",
      }}
    >
      {/* Sidebar Header */}
      <div
        className="flex items-center justify-between border-b"
        style={{
          height: "var(--app-header-height, 24px)",
          backgroundColor: "var(--app-sidebar-background, #ffffff)",
          borderBottom: "1px solid var(--app-sidebar-border, #e5e7eb)",
          padding: "var(--app-header-padding, 8px)",
        }}
      >
        <span
          style={{
            fontSize: "var(--app-header-font-size, 12px)",
            fontWeight: "var(--app-header-font-weight, 700)",
            color: "var(--app-sidebar-foreground, #111827)",
          }}
        >
          Workspaces
        </span>
        <button
          type="button"
          className="ml-auto rounded focus:outline-none transition-colors"
          style={{
            color: "var(--color-workspace-primary, #3b82f6)",
            fontSize: "18px",
            fontWeight: "bold",
            padding: "var(--app-header-button-padding, 2px)",
            border: "var(--app-header-button-border, none)",
            background: "var(--app-header-button-background, transparent)",
            cursor: "pointer",
            borderRadius: "var(--app-header-button-border-radius, 6px)",
            transitionDuration: "var(--app-sidebar-transition-duration, 200ms)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color =
              "var(--color-workspace-sidebar-item-active-text, #1d4ed8)";
            e.currentTarget.style.backgroundColor =
              "var(--app-header-button-hover-background, #f3f4f6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              "var(--color-workspace-primary, #3b82f6)";
            e.currentTarget.style.backgroundColor =
              "var(--app-header-button-background, transparent)";
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline =
              "2px solid var(--color-workspace-primary, #3b82f6)";
            e.currentTarget.style.outlineOffset = "2px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = "none";
          }}
          title="Add Workspace"
          onClick={() => setShowModal(true)}
        >
          +
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        <WorkspaceTree />
      </div>

      {/* Workspace Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-3 w-40 shadow-lg">
            <WorkspaceForm
              hideIconPicker
              hideColorPicker
              compact
              onSubmit={async (input: WorkspaceCreateInput) => {
                setIsSubmitting(true);
                try {
                  await createWorkspace(input);
                  setShowModal(false);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              onCancel={() => setShowModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
