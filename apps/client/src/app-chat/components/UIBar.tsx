"use client";

import { cn } from "@/lib/utils";
import { BarChart2Icon, PaperclipIcon } from "lucide-react";
import type { Theme } from "../types";
import { AgentSelector } from "./AgentSelector";

interface UIBarProps {
    theme: Theme;
    onPaperclipClickAction: () => void;
    onDashboardClickAction: () => void;
    selectedAgent?: string;
    agentNames?: string[];
    onAgentChangeAction?: (agent: string) => void;
    variant?: "input" | "agent";
}

export function UIBar({
    theme,
    onPaperclipClickAction,
    onDashboardClickAction,
    selectedAgent,
    agentNames,
    onAgentChangeAction,
    variant = "input"
}: UIBarProps) {
    if (variant === "agent" && selectedAgent && agentNames && onAgentChangeAction) {
        return (
            <div className="w-[90%] mx-auto flex items-start justify-start h-full py-0">
                <AgentSelector
                    selectedAgent={selectedAgent}
                    agentNames={agentNames}
                    theme={theme}
                    onChangeAction={onAgentChangeAction}
                />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-0.5 h-full">
            <button
                type="button"
                onClick={onPaperclipClickAction}
                className={cn(
                    "p-0.5 rounded-[1px]",
                    theme === "blue" ? "hover:bg-teal-50" : "hover:bg-orange-50"
                )}
                aria-label="Attach file"
            >
                <PaperclipIcon className="h-1.5 w-1.5 text-gray-500" aria-hidden={true} />
            </button>

            <button
                type="button"
                onClick={onDashboardClickAction}
                className={cn(
                    "p-0.5 rounded-[1px]",
                    theme === "blue" ? "hover:bg-teal-50" : "hover:bg-orange-50"
                )}
                aria-label="Show dashboard"
            >
                <BarChart2Icon className="h-1.5 w-1.5 text-gray-500" aria-hidden={true} />
            </button>
        </div>
    );
}
