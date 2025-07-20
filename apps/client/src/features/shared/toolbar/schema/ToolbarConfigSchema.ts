import { Schema } from "effect";

/**
 * Defines the visual appearance and styling of a toolbar.
 * This allows for theming toolbars at the instance level.
 */
export class ToolbarStyle extends Schema.Class<ToolbarStyle>("ToolbarStyle")({
  size: Schema.Union(
    Schema.Literal("xs"),
    Schema.Literal("sm"),
    Schema.Literal("md"),
    Schema.Literal("lg"),
    Schema.Literal("xl")
  ),
  primaryColor: Schema.optional(Schema.String),
  backgroundColor: Schema.optional(Schema.String),
  textColor: Schema.optional(Schema.String),
  textSize: Schema.optional(Schema.String),
  iconSize: Schema.optional(Schema.String),
  borderRadius: Schema.optional(Schema.String),
  buttonPadding: Schema.optional(Schema.String),
  // States
  hoverColor: Schema.optional(Schema.String),
  activeColor: Schema.optional(Schema.String),
  disabledColor: Schema.optional(Schema.String),
}) {}

/**
 * Represents the complete configuration for a single toolbar instance.
 * It is composed of an ordered list of command IDs and a style object.
 */
export class ToolbarConfig extends Schema.Class<ToolbarConfig>("ToolbarConfig")(
  {
    id: Schema.String,
    name: Schema.String,
    commands: Schema.Array(Schema.String),
    style: ToolbarStyle,
  }
) {}
