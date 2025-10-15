import { Effect } from "effect";
import { ToolbarCommand } from "../types/types";

const createCommand = (
  id: string,
  name: string,
  icon: string,
  tooltip: string
) =>
  new ToolbarCommand({
    id,
    name,
    icon,
    tooltip,
    action: Effect.log(`Executing command: ${name}`),
  });

export const coreCommands = [
  createCommand("core.save", "Save", "Save", "Save the current item"),
  createCommand("core.undo", "Undo", "Undo2", "Undo the last action"),
  createCommand("core.redo", "Redo", "Redo2", "Redo the last action"),
  createCommand("core.settings", "Settings", "Settings", "Open settings panel"),
  createCommand("core.help", "Help", "HelpCircle", "Get help"),
];

export const textCommands = [
  createCommand("text.bold", "Bold", "Bold", "Make text bold"),
  createCommand("text.italic", "Italic", "Italic", "Make text italic"),
  createCommand("text.underline", "Underline", "Underline", "Underline text"),
];

export const viewCommands = [
  createCommand("view.zoom-in", "Zoom In", "ZoomIn", "Zoom in"),
  createCommand("view.zoom-out", "Zoom Out", "ZoomOut", "Zoom out"),
  createCommand("view.reset-zoom", "Reset Zoom", "Maximize", "Reset zoom"),
];

export const allCommands = [...coreCommands, ...textCommands, ...viewCommands];
