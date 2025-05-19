"use client";

import React from "react";
import { MinimalInput } from "@/components/chat/MinimalInput";
import { XIcon } from "lucide-react";
import type { DisplayFile, Theme } from "@/features/chat/types";
import { AttachmentRow } from "@/components/chat/AttachmentRow";
interface UserAreaProps {
    theme: Theme;
    attachedFiles: DisplayFile[];
    selectedAgent: string;
    agentNames: string[];
    onRemoveFileAction: (fileId: string) => void;
    onFileClickAction: () => void;
    onDashboardClickAction: () => void;
    onSubmitMessageAction: (message: string) => void;
    onAgentChangeAction: (agent: string) => void;
    onCloseAction?: () => void;
    error?: string | null;
    onDismissErrorAction?: () => void;
}

export function UserArea({
    theme,
    attachedFiles,
    selectedAgent,
    agentNames,
    onRemoveFileAction,
    onFileClickAction,
    onDashboardClickAction,
    onSubmitMessageAction,
    onAgentChangeAction,
    onCloseAction,
    error,
    onDismissErrorAction
}: UserAreaProps) {
    return (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-sm absolute bottom-0 left-0 right-0 flex flex-col overflow-hidden">
            {/* Row 1: FileList */}
            <div className="flex-none">
                <div className="w-[95%] mx-auto">
                    <AttachmentRow
                        theme={theme}
                        attachedFiles={attachedFiles}
                        onRemoveFileAction={onRemoveFileAction}
                    />
                </div>
            </div>

            {/* Row 2: Input */}
            <div className="flex-none py-px">
                <div className="w-[95%] mx-auto">
                    <MinimalInput
                        theme={theme}
                        onSubmitMessageAction={onSubmitMessageAction}
                        onPaperclipClickAction={onFileClickAction}
                        onDashboardClickAction={onDashboardClickAction}
                    />
                </div>
            </div>

            {/* Row 3: Agent Selection */}
            <div className="w-full border-t bg-gray-50 flex-none pt-0.5">
                <div className="w-[95%] mx-auto p-2">
                    <select
                        value={selectedAgent}
                        onChange={(e) => onAgentChangeAction(e.target.value)}
                        className="w-full p-2 rounded-md border border-gray-200 bg-white text-sm"
                    >
                        {agentNames.map((agent) => (
                            <option key={agent} value={agent}>
                                {agent}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="absolute left-0 right-0 -top-8 flex items-center justify-between bg-red-100 p-2 text-sm text-red-800">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={onDismissErrorAction}
                        className="text-red-600 hover:text-red-800"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            {onCloseAction && (
                <button
                    type="button"
                    onClick={onCloseAction}
                    className="absolute -top-10 right-0 text-gray-400 hover:text-gray-600"
                >
                    <XIcon className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
