"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { AppEditorContainer } from "@/features/app-editor/container/AppEditorContainer";
import { AppSidebar } from "@/features/application/components/AppSidebar";
import { AppStyle } from "@/features/application/types/AppStyle";
import { WorkspaceContainer } from "@/features/workspace/container/WorkspaceContainer";
import { WorkspacesEditorContainer } from "@/features/workspaces-editor/container/WorkspacesEditorContainer";

// Default app style
const defaultAppStyle: AppStyle = {
  background: "#f9fafb",
  foreground: "#111827",
  fontFamily: '"Geist", system-ui, sans-serif',
  minHeight: "100vh",
  borderRadius: "0px",
  shadow: "none",

  // Header/Toolbar
  headerHeight: "24px",
  headerBackground: "#ffffff",
  headerForeground: "#111827",
  headerBorder: "#e5e7eb",
  headerShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  headerPadding: "4px",
  headerGap: "4px",
  headerFontSize: "12px",
  headerFontWeight: "600",
  headerBorderRadius: "0px",

  // Header Buttons
  headerButtonPadding: "2px",
  headerButtonBorderRadius: "6px",
  headerButtonBackground: "transparent",
  headerButtonForeground: "#6b7280",
  headerButtonHoverBackground: "#f3f4f6",
  headerButtonHoverForeground: "#374151",
  headerButtonActiveBackground: "#e5e7eb",
  headerButtonBorder: "none",
  headerButtonIconSize: "12px",

  // Sidebar
  sidebarWidth: "160px",
  sidebarBackground: "#ffffff",
  sidebarForeground: "#111827",
  sidebarBorder: "#e5e7eb",
  sidebarShadow: "1px 0 3px 0 rgba(0, 0, 0, 0.1)",
  sidebarPadding: "0px",
  sidebarBorderRadius: "0px",
  sidebarTransitionDuration: "200ms",
  sidebarZIndex: "30",

  // Main Content
  mainBackground: "#f9fafb",
  mainForeground: "#111827",
  mainPadding: "0px",
  mainBorderRadius: "0px",
  mainTransitionDuration: "200ms",
  mainOverflow: "hidden",

  // Loading States
  loadingBackground: "#ffffff",
  loadingForeground: "#6b7280",
  loadingSpinnerColor: "#3b82f6",
  loadingSpinnerSize: "32px",
  loadingTextSize: "14px",
  loadingPadding: "24px",
  loadingBorderRadius: "8px",
  loadingShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",

  // Error States
  errorBackground: "#fef2f2",
  errorForeground: "#991b1b",
  errorBorder: "#fecaca",
  errorButtonBackground: "#dc2626",
  errorButtonForeground: "#ffffff",
  errorButtonHoverBackground: "#b91c1c",
  errorPadding: "24px",
  errorBorderRadius: "8px",
  errorShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  errorTitleSize: "18px",
  errorTextSize: "14px",
  errorButtonPadding: "8px 16px",
  errorButtonBorderRadius: "6px",

  // Auth States
  authButtonBackground: "#3b82f6",
  authButtonForeground: "#ffffff",
  authButtonHoverBackground: "#2563eb",
  authButtonPadding: "4px 8px",
  authButtonBorderRadius: "4px",
  authButtonFontSize: "12px",
  authButtonFontWeight: "500",

  // Responsive
  mobileBreakpoint: "768px",
  tabletBreakpoint: "1024px",
  desktopBreakpoint: "1280px",
  mobileSidebarWidth: "280px",
  mobileHeaderHeight: "56px",
};

// Utility function to apply app-specific styling
function applyStyleToDOM(style: AppStyle) {
  if (!style) return;

  const root = document.documentElement;

  // App Container
  if (style.background)
    root.style.setProperty("--app-background", style.background);
  if (style.foreground)
    root.style.setProperty("--app-foreground", style.foreground);
  if (style.fontFamily)
    root.style.setProperty("--app-font-family", style.fontFamily);
  if (style.minHeight)
    root.style.setProperty("--app-min-height", style.minHeight);
  if (style.borderRadius)
    root.style.setProperty("--app-border-radius", style.borderRadius);
  if (style.shadow) root.style.setProperty("--app-shadow", style.shadow);

  // Header/Toolbar
  if (style.headerHeight)
    root.style.setProperty("--app-header-height", style.headerHeight);
  if (style.headerBackground)
    root.style.setProperty("--app-header-background", style.headerBackground);
  if (style.headerForeground)
    root.style.setProperty("--app-header-foreground", style.headerForeground);
  if (style.headerBorder)
    root.style.setProperty("--app-header-border", style.headerBorder);
  if (style.headerShadow)
    root.style.setProperty("--app-header-shadow", style.headerShadow);
  if (style.headerPadding)
    root.style.setProperty("--app-header-padding", style.headerPadding);
  if (style.headerGap)
    root.style.setProperty("--app-header-gap", style.headerGap);
  if (style.headerFontSize)
    root.style.setProperty("--app-header-font-size", style.headerFontSize);
  if (style.headerFontWeight)
    root.style.setProperty("--app-header-font-weight", style.headerFontWeight);
  if (style.headerBorderRadius)
    root.style.setProperty(
      "--app-header-border-radius",
      style.headerBorderRadius,
    );

  // Header Buttons
  if (style.headerButtonPadding)
    root.style.setProperty(
      "--app-header-button-padding",
      style.headerButtonPadding,
    );
  if (style.headerButtonBorderRadius)
    root.style.setProperty(
      "--app-header-button-border-radius",
      style.headerButtonBorderRadius,
    );
  if (style.headerButtonBackground)
    root.style.setProperty(
      "--app-header-button-background",
      style.headerButtonBackground,
    );
  if (style.headerButtonForeground)
    root.style.setProperty(
      "--app-header-button-foreground",
      style.headerButtonForeground,
    );
  if (style.headerButtonHoverBackground)
    root.style.setProperty(
      "--app-header-button-hover-background",
      style.headerButtonHoverBackground,
    );
  if (style.headerButtonHoverForeground)
    root.style.setProperty(
      "--app-header-button-hover-foreground",
      style.headerButtonHoverForeground,
    );
  if (style.headerButtonActiveBackground)
    root.style.setProperty(
      "--app-header-button-active-background",
      style.headerButtonActiveBackground,
    );
  if (style.headerButtonBorder)
    root.style.setProperty(
      "--app-header-button-border",
      style.headerButtonBorder,
    );
  if (style.headerButtonIconSize)
    root.style.setProperty(
      "--app-header-button-icon-size",
      style.headerButtonIconSize,
    );

  // Sidebar
  if (style.sidebarWidth)
    root.style.setProperty("--app-sidebar-width", style.sidebarWidth);
  if (style.sidebarBackground)
    root.style.setProperty("--app-sidebar-background", style.sidebarBackground);
  if (style.sidebarForeground)
    root.style.setProperty("--app-sidebar-foreground", style.sidebarForeground);
  if (style.sidebarBorder)
    root.style.setProperty("--app-sidebar-border", style.sidebarBorder);
  if (style.sidebarShadow)
    root.style.setProperty("--app-sidebar-shadow", style.sidebarShadow);
  if (style.sidebarPadding)
    root.style.setProperty("--app-sidebar-padding", style.sidebarPadding);
  if (style.sidebarBorderRadius)
    root.style.setProperty(
      "--app-sidebar-border-radius",
      style.sidebarBorderRadius,
    );
  if (style.sidebarTransitionDuration)
    root.style.setProperty(
      "--app-sidebar-transition-duration",
      style.sidebarTransitionDuration,
    );
  if (style.sidebarZIndex)
    root.style.setProperty("--app-sidebar-z-index", style.sidebarZIndex);

  // Main Content
  if (style.mainBackground)
    root.style.setProperty("--app-main-background", style.mainBackground);
  if (style.mainForeground)
    root.style.setProperty("--app-main-foreground", style.mainForeground);
  if (style.mainPadding)
    root.style.setProperty("--app-main-padding", style.mainPadding);
  if (style.mainBorderRadius)
    root.style.setProperty("--app-main-border-radius", style.mainBorderRadius);
  if (style.mainTransitionDuration)
    root.style.setProperty(
      "--app-main-transition-duration",
      style.mainTransitionDuration,
    );
  if (style.mainOverflow)
    root.style.setProperty("--app-main-overflow", style.mainOverflow);

  // Loading States
  if (style.loadingBackground)
    root.style.setProperty("--app-loading-background", style.loadingBackground);
  if (style.loadingForeground)
    root.style.setProperty("--app-loading-foreground", style.loadingForeground);
  if (style.loadingSpinnerColor)
    root.style.setProperty(
      "--app-loading-spinner-color",
      style.loadingSpinnerColor,
    );
  if (style.loadingSpinnerSize)
    root.style.setProperty(
      "--app-loading-spinner-size",
      style.loadingSpinnerSize,
    );
  if (style.loadingTextSize)
    root.style.setProperty("--app-loading-text-size", style.loadingTextSize);
  if (style.loadingPadding)
    root.style.setProperty("--app-loading-padding", style.loadingPadding);
  if (style.loadingBorderRadius)
    root.style.setProperty(
      "--app-loading-border-radius",
      style.loadingBorderRadius,
    );
  if (style.loadingShadow)
    root.style.setProperty("--app-loading-shadow", style.loadingShadow);

  // Error States
  if (style.errorBackground)
    root.style.setProperty("--app-error-background", style.errorBackground);
  if (style.errorForeground)
    root.style.setProperty("--app-error-foreground", style.errorForeground);
  if (style.errorBorder)
    root.style.setProperty("--app-error-border", style.errorBorder);
  if (style.errorButtonBackground)
    root.style.setProperty(
      "--app-error-button-background",
      style.errorButtonBackground,
    );
  if (style.errorButtonForeground)
    root.style.setProperty(
      "--app-error-button-foreground",
      style.errorButtonForeground,
    );
  if (style.errorButtonHoverBackground)
    root.style.setProperty(
      "--app-error-button-hover-background",
      style.errorButtonHoverBackground,
    );
  if (style.errorPadding)
    root.style.setProperty("--app-error-padding", style.errorPadding);
  if (style.errorBorderRadius)
    root.style.setProperty(
      "--app-error-border-radius",
      style.errorBorderRadius,
    );
  if (style.errorShadow)
    root.style.setProperty("--app-error-shadow", style.errorShadow);
  if (style.errorTitleSize)
    root.style.setProperty("--app-error-title-size", style.errorTitleSize);
  if (style.errorTextSize)
    root.style.setProperty("--app-error-text-size", style.errorTextSize);
  if (style.errorButtonPadding)
    root.style.setProperty(
      "--app-error-button-padding",
      style.errorButtonPadding,
    );
  if (style.errorButtonBorderRadius)
    root.style.setProperty(
      "--app-error-button-border-radius",
      style.errorButtonBorderRadius,
    );

  // Auth States
  if (style.authButtonBackground)
    root.style.setProperty(
      "--app-auth-button-background",
      style.authButtonBackground,
    );
  if (style.authButtonForeground)
    root.style.setProperty(
      "--app-auth-button-foreground",
      style.authButtonForeground,
    );
  if (style.authButtonHoverBackground)
    root.style.setProperty(
      "--app-auth-button-hover-background",
      style.authButtonHoverBackground,
    );
  if (style.authButtonPadding)
    root.style.setProperty(
      "--app-auth-button-padding",
      style.authButtonPadding,
    );
  if (style.authButtonBorderRadius)
    root.style.setProperty(
      "--app-auth-button-border-radius",
      style.authButtonBorderRadius,
    );
  if (style.authButtonFontSize)
    root.style.setProperty(
      "--app-auth-button-font-size",
      style.authButtonFontSize,
    );
  if (style.authButtonFontWeight)
    root.style.setProperty(
      "--app-auth-button-font-weight",
      style.authButtonFontWeight,
    );

  // Responsive
  if (style.mobileBreakpoint)
    root.style.setProperty("--app-mobile-breakpoint", style.mobileBreakpoint);
  if (style.tabletBreakpoint)
    root.style.setProperty("--app-tablet-breakpoint", style.tabletBreakpoint);
  if (style.desktopBreakpoint)
    root.style.setProperty("--app-desktop-breakpoint", style.desktopBreakpoint);
  if (style.mobileSidebarWidth)
    root.style.setProperty(
      "--app-mobile-sidebar-width",
      style.mobileSidebarWidth,
    );
  if (style.mobileHeaderHeight)
    root.style.setProperty(
      "--app-mobile-header-height",
      style.mobileHeaderHeight,
    );
}

// Utility function to reset app styling to defaults
function resetStyleInDOM() {
  const root = document.documentElement;

  // Reset all app custom properties to their defaults
  const defaultStyles = {
    "--app-background": "#f9fafb",
    "--app-foreground": "#111827",
    "--app-font-family": '"Geist", system-ui, sans-serif',
    "--app-min-height": "100vh",
    "--app-border-radius": "0px",
    "--app-shadow": "none",
    "--app-header-height": "24px",
    "--app-header-background": "#ffffff",
    "--app-header-foreground": "#111827",
    "--app-header-border": "#e5e7eb",
    "--app-header-shadow": "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    "--app-header-padding": "4px",
    "--app-header-gap": "4px",
    "--app-header-font-size": "12px",
    "--app-header-font-weight": "600",
    "--app-header-border-radius": "0px",
    "--app-header-button-padding": "2px",
    "--app-header-button-border-radius": "6px",
    "--app-header-button-background": "transparent",
    "--app-header-button-foreground": "#6b7280",
    "--app-header-button-hover-background": "#f3f4f6",
    "--app-header-button-hover-foreground": "#374151",
    "--app-header-button-active-background": "#e5e7eb",
    "--app-header-button-border": "none",
    "--app-header-button-icon-size": "12px",
    "--app-sidebar-width": "160px",
    "--app-sidebar-background": "#ffffff",
    "--app-sidebar-foreground": "#111827",
    "--app-sidebar-border": "#e5e7eb",
    "--app-sidebar-shadow": "1px 0 3px 0 rgba(0, 0, 0, 0.1)",
    "--app-sidebar-padding": "0px",
    "--app-sidebar-border-radius": "0px",
    "--app-sidebar-transition-duration": "200ms",
    "--app-sidebar-z-index": "30",
    "--app-main-background": "#f9fafb",
    "--app-main-foreground": "#111827",
    "--app-main-padding": "0px",
    "--app-main-border-radius": "0px",
    "--app-main-transition-duration": "200ms",
    "--app-main-overflow": "hidden",
    "--app-loading-background": "#ffffff",
    "--app-loading-foreground": "#6b7280",
    "--app-loading-spinner-color": "#3b82f6",
    "--app-loading-spinner-size": "32px",
    "--app-loading-text-size": "14px",
    "--app-loading-padding": "24px",
    "--app-loading-border-radius": "8px",
    "--app-loading-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "--app-error-background": "#fef2f2",
    "--app-error-foreground": "#991b1b",
    "--app-error-border": "#fecaca",
    "--app-error-button-background": "#dc2626",
    "--app-error-button-foreground": "#ffffff",
    "--app-error-button-hover-background": "#b91c1c",
    "--app-error-padding": "24px",
    "--app-error-border-radius": "8px",
    "--app-error-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "--app-error-title-size": "18px",
    "--app-error-text-size": "14px",
    "--app-error-button-padding": "8px 16px",
    "--app-error-button-border-radius": "6px",
    "--app-auth-button-background": "#3b82f6",
    "--app-auth-button-foreground": "#ffffff",
    "--app-auth-button-hover-background": "#2563eb",
    "--app-auth-button-padding": "4px 8px",
    "--app-auth-button-border-radius": "4px",
    "--app-auth-button-font-size": "12px",
    "--app-auth-button-font-weight": "500",
    "--app-mobile-breakpoint": "768px",
    "--app-tablet-breakpoint": "1024px",
    "--app-desktop-breakpoint": "1280px",
    "--app-mobile-sidebar-width": "280px",
    "--app-mobile-header-height": "56px",
  };

  for (const [property, value] of Object.entries(defaultStyles)) {
    root.style.setProperty(property, value);
  }
}

interface ApplicationUIProps {
  isLoading?: boolean;
  error?: string | null;
}

export function ApplicationUI({ isLoading, error }: ApplicationUIProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [appStyle, setAppStyle] = useState<AppStyle>(defaultAppStyle);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAppEditor, setShowAppEditor] = useState(false);
  const [appEditorActiveTab, setAppEditorActiveTab] = useState<
    "edit" | "preview"
  >("edit");

  const updateAppStyle = useCallback((newStyle: Partial<AppStyle>) => {
    setAppStyle((prev) => ({ ...prev, ...newStyle }));
  }, []);

  const resetAppStyle = useCallback(() => {
    setAppStyle(defaultAppStyle);
  }, []);

  // New state to manage the active main feature
  const [activeMainFeature, setActiveMainFeature] = useState<
    "workspace" | "workspaces-editor"
  >("workspace");

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Apply external appStyle from useAppStyle (if provided via context)
  // ApplicationUI component receives the appStyle from the AppStyleContext via useAppStyle hook,
  // and then applies it to the document.documentElement. This ensures that the dynamic
  // styling mechanism is preserved even after moving AppShell's responsibilities.
  useEffect(() => {
    applyStyleToDOM(appStyle);

    return () => {
      resetStyleInDOM();
    };
  }, [appStyle]);

  if (isLoading) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{
          backgroundColor: "var(--app-loading-background, #ffffff)",
          color: "var(--app-loading-foreground, #6b7280)",
        }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full border-b-2 mx-auto mb-4"
            style={{
              width: "var(--app-loading-spinner-size, 32px)",
              height: "var(--app-loading-spinner-size, 32px)",
              borderColor: "var(--app-loading-spinner-color, #3b82f6)",
            }}
          />
          <p
            style={{
              fontSize: "var(--app-loading-text-size, 14px)",
              color: "var(--app-loading-foreground, #6b7280)",
            }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{
          backgroundColor: "var(--app-error-background, #fef2f2)",
          color: "var(--app-error-foreground, #991b1b)",
        }}
      >
        <div
          className="text-center bg-white rounded-lg p-8 shadow-sm border border-red-200"
          style={{
            padding: "var(--app-error-padding, 24px)",
            borderRadius: "var(--app-error-border-radius, 8px)",
            boxShadow:
              "var(--app-error-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1))",
          }}
        >
          <div className="text-4xl mb-4">⚠️</div>
          <p
            className="text-lg font-medium text-red-700 mb-2"
            style={{
              fontSize: "var(--app-error-title-size, 18px)",
              color: "var(--app-error-foreground, #991b1b)",
            }}
          >
            Application Error
          </p>
          <p
            className="text-sm text-red-600 mb-4"
            style={{
              fontSize: "var(--app-error-text-size, 14px)",
              color: "var(--app-error-foreground, #991b1b)",
            }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            style={{
              backgroundColor: "var(--app-error-button-background, #dc2626)",
              color: "var(--app-error-button-foreground, #ffffff)",
              padding: "var(--app-error-button-padding, 8px 16px)",
              borderRadius: "var(--app-error-button-border-radius, 6px)",
              "--app-error-button-hover-background": "#b91c1c",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--app-error-button-hover-background, #b91c1c)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--app-error-button-background, #dc2626)";
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex w-full"
      style={{
        minHeight: "100vh",
        backgroundColor: appStyle.background,
        color: appStyle.foreground,
        fontFamily: appStyle.fontFamily,
      }}
    >
      <AppSidebar isOpen={isSidebarOpen} />
      <div
        className="flex flex-1 flex-col"
        style={{
          marginLeft: isSidebarOpen ? "var(--app-sidebar-width, 160px)" : "0px",
          transition: `margin-left var(--app-main-transition-duration, 200ms)`,
        }}
      >
        {/* Header/Toolbar - Single Row */}
        <header
          className="flex items-center justify-between border-b px-4"
          style={{
            height: appStyle.headerHeight,
            backgroundColor: appStyle.headerBackground,
            color: appStyle.headerForeground,
            borderBottomColor: appStyle.headerBorder,
            boxShadow: appStyle.headerShadow,
          }}
        >
          {/* Left Section: Sidebar Toggle + App Title */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="shrink-0 rounded transition-colors"
              aria-label="Toggle sidebar"
              style={{
                padding: "var(--app-header-button-padding, 8px)",
                borderRadius: "var(--app-header-button-border-radius, 6px)",
                backgroundColor:
                  "var(--app-header-button-background, transparent)",
                color: "var(--app-header-button-foreground, #6b7280)",
                border: "var(--app-header-button-border, none)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--app-header-button-hover-background, #f3f4f6)";
                e.currentTarget.style.color =
                  "var(--app-header-button-hover-foreground, #374151)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--app-header-button-background, transparent)";
                e.currentTarget.style.color =
                  "var(--app-header-button-foreground, #6b7280)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--app-header-button-active-background, #e5e7eb)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--app-header-button-hover-background, #f3f4f6)";
              }}
            >
              <Menu
                style={{
                  width: "var(--app-header-button-icon-size, 20px)",
                  height: "var(--app-header-button-icon-size, 20px)",
                }}
              />
            </button>

            <h1
              style={{
                fontSize: "var(--app-header-font-size, 18px)",
                fontWeight: "var(--app-header-font-weight, 600)",
                color: "var(--app-header-foreground, #111827)",
                margin: 0,
              }}
            >
              BuddyChat
            </h1>
            {/* Feature Navigation Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                type="button"
                onClick={() => setActiveMainFeature("workspace")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeMainFeature === "workspace"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setActiveMainFeature("workspaces-editor")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeMainFeature === "workspaces-editor"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Workspaces Editor
              </button>
            </div>
          </div>
          {/* Right Section: App Editor + User Auth */}
          <div className="flex items-center space-x-3">
            {/* App Editor Button */}
            <button
              type="button"
              onClick={() => setShowAppEditor(true)}
              className="rounded transition-colors"
              style={{
                fontSize: "var(--app-header-button-font-size, 14px)",
                fontWeight: "var(--app-header-button-font-weight, 500)",
                backgroundColor:
                  "var(--app-header-button-background, transparent)",
                color: "var(--app-header-button-foreground, #6b7280)",
                padding: "var(--app-header-button-padding, 8px)",
                borderRadius: "var(--app-header-button-border-radius, 6px)",
                border: "var(--app-header-button-border, 1px solid #e5e7eb)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--app-header-button-hover-background, #f3f4f6)";
                e.currentTarget.style.color =
                  "var(--app-header-button-hover-foreground, #374151)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--app-header-button-background, transparent)";
                e.currentTarget.style.color =
                  "var(--app-header-button-foreground, #6b7280)";
              }}
              title="App Editor"
            >
              ⚙️
            </button>

            {/* User Authentication */}
            {isLoaded &&
              (isSignedIn ? (
                <UserButton />
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded transition-colors"
                    style={{
                      fontSize: "var(--app-auth-button-font-size, 14px)",
                      fontWeight: "var(--app-auth-button-font-weight, 500)",
                      backgroundColor:
                        "var(--app-auth-button-background, #3b82f6)",
                      color: "var(--app-auth-button-foreground, #ffffff)",
                      padding: "var(--app-auth-button-padding, 6px 16px)",
                      borderRadius: "var(--app-auth-button-border-radius, 6px)",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--app-auth-button-hover-background, #2563eb)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--app-auth-button-background, #3b82f6)";
                    }}
                  >
                    Sign In
                  </button>
                </SignInButton>
              ))}
          </div>
        </header>

        <main
          style={{
            flex: "1",
            overflow: "hidden",
            backgroundColor: appStyle.mainBackground,
            color: appStyle.mainForeground,
            padding: "0px",
            display: "flex", // Added to enable side-by-side layout
            gap: "8px", // Added for spacing between components
          }}
        >
          <div style={{ flex: 1, overflow: "auto" }}>
            <WorkspacesEditorContainer />
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            <WorkspaceContainer />
          </div>
        </main>
      </div>

      {/* App Editor Modal */}
      {showAppEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 h-[80vh]">
            <div className="px-0.5 py-0.5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xs font-semibold text-gray-900">
                App Editor
              </h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-gray-100 rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setAppEditorActiveTab("edit")}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      appEditorActiveTab === "edit"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppEditorActiveTab("preview")}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      appEditorActiveTab === "preview"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Preview
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAppEditor(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <AppEditorContainer
                activeTab={appEditorActiveTab}
                onCancel={() => setShowAppEditor(false)}
                updateAppStyle={updateAppStyle}
                resetAppStyle={resetAppStyle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
