import React, { useState } from "react";
import { HeaderBar } from "./HeaderBar";
import { ChatMessage, MessageArea } from "./MessageArea";
import { UIBarElementConfig } from "./UIBar";
import UserArea from "./UserArea";

export interface ChatAppProps {
    error?: Error;
    onDismissError?: () => void;
    onClose?: () => void;
    uiBarElements?: UIBarElementConfig[];
    initialAttachedFiles?: Array<File>;
    onSubmitMessage?: (text: string) => void;
    onRemoveFile?: (file: File) => void;
}

export function ChatApp(props: ChatAppProps): React.JSX.Element {
    const {
        error,
        onDismissError,
        onClose,
        uiBarElements,
        initialAttachedFiles = [],
        onSubmitMessage,
        onRemoveFile,
    } = props;

    const [attachedFiles, setAttachedFiles] = useState(initialAttachedFiles);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const handleRemoveFile = (file: File) => {
        setAttachedFiles(attachedFiles.filter((f) => f !== file));
        onRemoveFile?.(file);
    };

    const handleSubmitMessage = (text: string) => {
        onSubmitMessage?.(text);
    };

    return (
        <div className="flex flex-col h-screen border border-[#e5e5e5]">
            <HeaderBar title="Buddy Chat" />
            <MessageArea messages={messages} />
            <UserArea
                onSubmitMessage={handleSubmitMessage}
                error={error?.message}
                onDismissError={onDismissError}
                onClose={onClose}
                uiBarElements={uiBarElements}
                attachedFiles={attachedFiles}
                onRemoveFile={handleRemoveFile}
            />
        </div>
    );
}