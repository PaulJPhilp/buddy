"use client";

import { InputArea } from "@/components/InputArea";
import { XIcon } from "lucide-react";
import type { DisplayFile, Theme } from "../types";
import { AttachmentRow } from "./AttachmentRow";
import { UIBar } from "./UIBar";

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
        <div className="w-full bg-gray-50 border border-gray-200 rounded-sm absolute bottom-0 left-0 right-0 flex flex-col overflow-hidden" style={{ transform: 'translateY(-75px)' }}>
            {/* Row 1: FileList */}
            <div className="flex-none p-2">
                <div className="w-[90%] mx-auto">
                    <AttachmentRow
                        theme={theme}
                        attachedFiles={attachedFiles}
                        onRemoveFileAction={onRemoveFileAction}
                    />
                </div>
            </div>

            {/* Row 2: Input */}
            <div className="h-[50px] flex-none">
                <div className="w-[90%] mx-auto h-full">
                    <InputArea
                        theme={theme}
                        onSubmitMessageAction={onSubmitMessageAction}
                        onPaperclipClickAction={onFileClickAction}
                        onDashboardClickAction={onDashboardClickAction}
                    />
                </div>
            </div>

            {/* Row 3: Agent Selection UIBar */}
            <div className="w-full border-t bg-gray-50 flex-none py-2">
                <div className="w-[90%] mx-auto">
                    <UIBar
                        theme={theme}
                        onPaperclipClickAction={onFileClickAction}
                        onDashboardClickAction={onDashboardClickAction}
                        selectedAgent={selectedAgent}
                        agentNames={agentNames}
                        onAgentChangeAction={onAgentChangeAction}
                        variant="agent"
                    />
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
