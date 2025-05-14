"use client";

import { cn } from "@/lib/utils";
import type { Theme } from "../types";

interface AgentSelectorProps {
    selectedAgent: string;
    agentNames: string[];
    theme: Theme;
    onChangeAction: (agent: string) => void;
}

export function AgentSelector({ selectedAgent, agentNames, theme, onChangeAction }: AgentSelectorProps) {
    return (
        <div className="relative">
            <select
                className={cn(
                    "text-[2.5pt] pl-1 pr-2 py-0.5 rounded-[1px] border bg-white text-gray-600 focus:outline-none focus:ring-0 shadow-none h-2.5 appearance-none",
                    theme === "blue" ? "border-teal-200" : "border-orange-200"
                )}
                value={selectedAgent}
                onChange={e => onChangeAction(e.target.value)}
                aria-label="Select agent"
                style={{ minWidth: 40, maxWidth: 60 }}
            >
                {agentNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                ))}
            </select>
            <div className={cn(
                "absolute top-1/2 right-1 -translate-y-1/2 pointer-events-none",
                "w-1 h-1"
            )}>
                <svg
                    width="4"
                    height="3"
                    viewBox="0 0 4 3"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={theme === "blue" ? "text-teal-400" : "text-orange-400"}
                >
                    <path d="M2 3L0 0L4 0L2 3Z" fill="currentColor" />
                </svg>
            </div>
        </div>
    );
}
