"use client";

import { markdownLookBack } from "@llm-ui/markdown";
import { type LLMOutputComponent, useLLMOutput } from "@llm-ui/react";
import { useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CustomTable, CustomTableCell } from "./CustomTable";

export interface ChatBubbleLlmUiProps {
  role: "user" | "assistant";
  content?: React.ReactNode;
  // Enhanced props for complex message handling
  message?: {
    id: string;
    text: string;
    role: "user" | "assistant";
    timestamp?: number;
    metadata?: {
      llmUi?: {
        rawMarkdown?: string;
        frontmatter?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      };
      streaming?: boolean;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  isCurrentUser?: boolean;
  // Add direct streaming support
  isStreaming?: boolean;
}

// llm-ui Markdown component with improved table styling
const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  return (
    <div className="llm-ui-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => <CustomTable>{children}</CustomTable>,
          th: ({ children }) => (
            <CustomTableCell isHeader={true}>{children}</CustomTableCell>
          ),
          td: ({ children }) => <CustomTableCell>{children}</CustomTableCell>,
          // Also improve other elements to match your styling
          h1: ({ children }) => (
            <h1
              style={{
                display: "block",
                fontSize: "8px",
                fontWeight: "700",
                margin: "3px 0 1px 0",
                lineHeight: "1.3",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                display: "block",
                fontSize: "7px",
                fontWeight: "700",
                margin: "2px 0 1px 0",
                lineHeight: "1.3",
              }}
            >
              {children}
            </h2>
          ),
          p: ({ children }) => (
            <p
              style={{
                display: "block",
                margin: "0 0 1px 0",
                lineHeight: "1.3",
                fontSize: "7px",
              }}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul
              style={{
                display: "block",
                paddingLeft: "6px",
                margin: "0 0 1px 0",
                listStyleType: "disc",
                fontSize: "7px",
              }}
            >
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li
              style={{
                display: "list-item",
                margin: "0 0 1px 0",
                fontSize: "7px",
              }}
            >
              {children}
            </li>
          ),
        }}
      >
        {blockMatch.output}
      </ReactMarkdown>
    </div>
  );
};

export function ChatBubbleLlmUi({
  role,
  content,
  message,
  isCurrentUser,
  isStreaming,
}: ChatBubbleLlmUiProps) {
  // Determine which props to use
  const actualRole = message?.role || role;
  const actualIsCurrentUser = isCurrentUser ?? actualRole === "user";
  const actualContent = message?.text || content;

  // Determine if we're in streaming mode
  const actualIsStreaming =
    isStreaming || message?.metadata?.streaming || false;

  // llm-ui processing logic
  const llmUiData = message?.metadata?.llmUi
    ? {
        rawMarkdown: message.metadata.llmUi.rawMarkdown,
        frontmatter: message.metadata.llmUi.frontmatter,
        metadata: message.metadata.llmUi.metadata,
      }
    : undefined;

  // Memoize the llm-ui dependencies to prevent infinite re-renders
  const llmOutput = useMemo(() => {
    return llmUiData?.rawMarkdown || String(actualContent || "");
  }, [llmUiData?.rawMarkdown, actualContent]);

  const fallbackBlock = useMemo(
    () => ({
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    }),
    [],
  );

  const blocks = useMemo(() => [], []);

  const isStreamFinished = useMemo(
    () => !actualIsStreaming,
    [actualIsStreaming],
  );

  // Use llm-ui for processing - now with memoized dependencies
  const { blockMatches } = useLLMOutput({
    llmOutput,
    fallbackBlock,
    blocks,
    isStreamFinished,
  });

  const bubbleClass = actualIsCurrentUser ? "user" : "agent";
  const bubbleStyle: React.CSSProperties = {
    backgroundColor:
      actualRole === "user"
        ? "var(--color-chat-header-bg)"
        : "var(--color-chat-bubble-agent)",
    color:
      actualRole === "user"
        ? "var(--color-chat-header-text)"
        : "var(--color-chat-bubble-agent-foreground)",
    borderRadius: "0.75rem",
  };

  return (
    <div
      className={`w-full flex ${actualIsCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative max-w-[75%] px-1.5 py-0.5 shadow-sm chat-bubble-${bubbleClass}`}
        style={{
          ...bubbleStyle,
          fontSize: "9px",
          lineHeight: "1.2",
          borderRadius: "0.5rem",
        }}
      >
        {/* Show frontmatter if available */}
        {llmUiData?.frontmatter &&
          Object.keys(llmUiData.frontmatter).length > 0 && (
            <div
              className="opacity-75 mb-1 border-b border-current/20 pb-1"
              style={{ fontSize: "8px" }}
            >
              {llmUiData.frontmatter.title != null && (
                <div className="font-medium">
                  {String(llmUiData.frontmatter.title)}
                </div>
              )}
              {llmUiData.frontmatter.author != null && (
                <div>by {String(llmUiData.frontmatter.author)}</div>
              )}
            </div>
          )}

        {/* Render with llm-ui */}
        <div className="llm-ui-content max-w-full">
          {blockMatches.length > 0 ? (
            blockMatches.map((blockMatch) => {
              const Component = blockMatch.block.component;
              return (
                <Component
                  key={`block-${Math.random()}`}
                  blockMatch={blockMatch}
                />
              );
            })
          ) : (
            // Fallback: render raw content if no blockMatches
            <div style={{ fontSize: "7px", lineHeight: "1.3" }}>
              {llmUiData?.rawMarkdown || String(actualContent || "")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
