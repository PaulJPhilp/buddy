"use client";

import { markdownLookBack } from "@llm-ui/markdown";
import { type LLMOutputComponent, useLLMOutput } from "@llm-ui/react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CustomTable, CustomTableCell } from "../CustomTable";

// ChatBubbleAction type (inline for now)
export type ChatBubbleAction = 
  | { type: "copy" }
  | { type: "regenerate" }
  | { type: "edit" };

export interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatBubbleProps {
  message: Message;
  showTimestamp?: boolean;
  bubbleState?: any; // Accept ChatBubbleState, but keep loose for now
  formattedContent?: string;
  onAction?: (action: ChatBubbleAction) => void;
}

// llm-ui Markdown component with custom styling
const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  return (
    <div className="llm-ui-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom table components
          table: ({ children }) => <CustomTable>{children}</CustomTable>,
          th: ({ children }) => (
            <CustomTableCell isHeader={true}>{children}</CustomTableCell>
          ),
          td: ({ children }) => <CustomTableCell>{children}</CustomTableCell>,

          // Styled headers
          h1: ({ children }) => (
            <h1 className="text-xs font-bold mb-2 mt-3 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">
              {children}
            </h3>
          ),

          // Styled paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),

          // Styled lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 pl-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,

          // Code blocks
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-gray-100 text-gray-800 p-3 rounded-md text-sm font-mono overflow-x-auto mb-2">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 text-gray-800 p-3 rounded-md text-sm font-mono overflow-x-auto mb-2">
              {children}
            </pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2 text-gray-700">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),

          // Horizontal rules
          hr: () => <hr className="border-gray-300 my-4" />,

          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {blockMatch.output}
      </ReactMarkdown>
    </div>
  );
};

export function ChatBubble({
  message,
  showTimestamp = true,
  bubbleState,
  formattedContent,
  onAction,
}: ChatBubbleProps): React.ReactElement {
  const { content, sender, timestamp, isStreaming = false } = message;
  const isUser = sender === "user";
  const [showDebug, setShowDebug] = useState(false);
  const userName = "You"; // Simplified - no Clerk dependency in UI package

  // Memoize llm-ui dependencies
  const llmOutput = useMemo(() => content, [content]);

  const fallbackBlock = useMemo(
    () => ({
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    }),
    [],
  );

  const blocks = useMemo(() => [], []);

  const isStreamFinished = useMemo(() => !isStreaming, [isStreaming]);

  // Use llm-ui for processing
  const { blockMatches } = useLLMOutput({
    llmOutput,
    fallbackBlock,
    blocks,
    isStreamFinished,
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex flex-col items-end ${isUser ? "items-end" : "items-start"} mb-2`}
    >
      {/* Sender name above the bubble */}
      <span
        className={`mb-0.5 px-1 text-[0.5rem] font-semibold select-none ${
          isUser
            ? "text-blue-400 text-right self-end"
            : "text-gray-400 text-left self-start"
        }`}
        style={{ lineHeight: 1 }}
      >
        {isUser ? userName : "Assistant"}
      </span>
      <div
        className={`max-w-[16rem] lg:max-w-[28rem] px-2 py-1 rounded-lg ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {/* Render content with llm-ui or formattedContent */}
        <div className="text-xs">
          {bubbleState?.hasError ? (
            <div className="text-red-500">
              {bubbleState.errorMessage || "Error"}
            </div>
          ) : formattedContent ? (
            <div className="whitespace-pre-wrap">{formattedContent}</div>
          ) : blockMatches.length > 0 ? (
            blockMatches.map((blockMatch) => {
              const Component = blockMatch.block.component;
              return (
                <Component
                  key={`${blockMatch.startIndex}-${blockMatch.endIndex}`}
                  blockMatch={blockMatch}
                />
              );
            })
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}

          {/* Streaming indicator */}
          {(bubbleState?.isStreaming || isStreaming) && (
            <div className="flex space-x-1 mt-1">
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{
                  animationDuration: "0.8s",
                  animationTimingFunction:
                    "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{
                  animationDelay: "0.1s",
                  animationDuration: "0.8s",
                  animationTimingFunction:
                    "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{
                  animationDelay: "0.2s",
                  animationDuration: "0.8s",
                  animationTimingFunction:
                    "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                }}
              />
            </div>
          )}
        </div>

        {/* Example action buttons */}
        {onAction && (
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => onAction({ type: "edit" })}>
              Edit
            </button>
            <button type="button" onClick={() => onAction({ type: "regenerate" })}>
              Retry
            </button>
            <button type="button" onClick={() => onAction({ type: "copy" })}>
              Copy
            </button>
          </div>
        )}
      </div>
      {/* Timestamp and debug toggle below the bubble */}
      {showTimestamp && (
        <div
          className={`mt-0.5 flex items-center gap-1 ${
            isUser ? "text-blue-200 justify-end" : "text-gray-500 justify-start"
          }`}
          style={{ maxWidth: "16rem", fontSize: "0.375rem" }}
        >
          <span>{formatTime(timestamp)}</span>
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="hover:opacity-70 transition-opacity"
            title="Toggle debug info"
          >
            🐛
          </button>
        </div>
      )}

      {/* Debug information */}
      {showDebug && (
        <div className="text-xs text-gray-400 p-2 border border-gray-200 rounded bg-gray-50 mt-1">
          <strong>Debug Info:</strong>
          <br />
          Message ID: {message.id}
          <br />
          Sender: {sender}
          <br />
          Timestamp: {timestamp.toISOString()}
          <br />
          Content Length: {content.length}
          <br />
          Is Streaming: {isStreaming ? "Yes" : "No"}
          {bubbleState && (
            <>
              <br />
              Bubble State: {JSON.stringify(bubbleState, null, 2)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
