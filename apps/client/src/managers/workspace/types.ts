import { calculateContrastColor } from "@/utils/color-utils";
import { Schema as S } from "effect";

/**
 * Workspace visual styling configuration.
 * Defines colors, typography, and visual appearance for the workspace.
 */
export class WorkspaceStyle extends S.Class<WorkspaceStyle>("WorkspaceStyle")({
  // Primary color and its contrast
  primaryColor: S.String.pipe(S.optional),
  primaryContrastColor: S.String.pipe(S.optional),

  // Background colors
  backgroundColor: S.String.pipe(S.optional),
  backgroundSecondaryColor: S.String.pipe(S.optional),

  // Border styling
  borderColor: S.String.pipe(S.optional),
  borderRadius: S.String.pipe(S.optional),
  borderWidth: S.String.pipe(S.optional),

  // Typography
  typographyClass: S.String.pipe(S.optional),
  fontFamily: S.String.pipe(S.optional),
  fontSize: S.String.pipe(S.optional),
  fontWeight: S.String.pipe(S.optional),

  // Additional styling properties
  shadowColor: S.String.pipe(S.optional),
  shadowIntensity: S.Literal("none", "sm", "md", "lg", "xl").pipe(S.optional),
  opacity: S.Number.pipe(S.optional),

  // Icon styling
  iconColor: S.String.pipe(S.optional),
  iconSize: S.String.pipe(S.optional),
}) {
  /**
   * Get the primary contrast color, calculating it if not explicitly set
   */
  get computedPrimaryContrastColor(): string {
    if (this.primaryContrastColor) {
      return this.primaryContrastColor;
    }

    if (this.primaryColor) {
      return calculateContrastColor(this.primaryColor);
    }

    return "#ffffff"; // Default fallback
  }

  /**
   * Create a WorkspaceStyle instance with computed contrast color
   */
  static createWithComputedContrast(
    data: Partial<WorkspaceStyle>
  ): WorkspaceStyle {
    const style = new WorkspaceStyle(data);

    // If primaryContrastColor is not set but primaryColor is, calculate it
    if (!data.primaryContrastColor && data.primaryColor) {
      return new WorkspaceStyle({
        ...data,
        primaryContrastColor: calculateContrastColor(data.primaryColor),
      });
    }

    return style;
  }
}

/**
 * Represents a single workspace in the application.
 * This is the core data model for the Workspace domain.
 */
export class Workspace extends S.Class<Workspace>("Workspace")({
  id: S.String,
  name: S.String,
  description: S.String.pipe(S.optional),
  chatappIds: S.mutable(S.Array(S.String)),
  agentIds: S.mutable(S.Array(S.String)),
  permissions: S.Struct({
    canAddApps: S.Boolean,
    canRemoveApps: S.Boolean,
    canModifyLayout: S.Boolean,
    canChangeSettings: S.Boolean,
    canInviteUsers: S.Boolean,
    canManagePermissions: S.Boolean,
  }),
  isDefault: S.Boolean.pipe(S.optional),
  isArchived: S.Boolean.pipe(S.optional),
  maxExpandedApps: S.Number.pipe(S.optional),
  createdAt: S.String,
  updatedAt: S.String,
  metadata: S.optional(S.Record({ key: S.String, value: S.Unknown })),
  style: S.optional(WorkspaceStyle),
}) {}
