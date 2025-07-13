"use client";

import { markdownLookBack } from "@llm-ui/markdown";
import { type LLMOutputComponent, useLLMOutput } from "@llm-ui/react";
import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CustomTable, CustomTableCell } from "./CustomTable";
import type { ChatBubbleAction } from "./chatbubble-manager/api";

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
}: ChatBubbleProps) {
  const { content, sender, timestamp, isStreaming = false } = message;
  const isUser = sender === "user";

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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {/* Render content with llm-ui or formattedContent */}
        <div className="text-xs">
          {bubbleState?.isStreaming || isStreaming ? (
            <div className="flex space-x-1">
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
          ) : bubbleState?.hasError ? (
            <div className="text-red-500">
              {bubbleState.errorMessage || "Error"}
            </div>
          ) : formattedContent ? (
            <div className="whitespace-pre-wrap">{formattedContent}</div>
          ) : blockMatches.length > 0 ? (
            blockMatches.map((blockMatch, index) => {
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
        </div>

        {/* Example action buttons */}
        {onAction && (
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => onAction("edit")}>
              Edit
            </button>
            <button type="button" onClick={() => onAction("retry")}>
              Retry
            </button>
            <button type="button" onClick={() => onAction("copy")}>
              Copy
            </button>
          </div>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <p
            className={`text-xs mt-1 ${
              isUser ? "text-blue-200" : "text-gray-500"
            }`}
          >
            {formatTime(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}
