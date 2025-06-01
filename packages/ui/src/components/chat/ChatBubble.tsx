import * as React from "react";

export interface ChatBubbleProps {
  role: "user" | "assistant";
  content?: React.ReactNode;
  // Enhanced props for complex message handling
  message?: {
    id: string;
    text: string;
    role: "user" | "assistant";
    timestamp?: number;
    metadata?: {
      mdx?: {
        compiledSource?: string;
        frontmatter?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  isCurrentUser?: boolean;
  // Optional MDX processing
  enableMdxProcessing?: boolean;
  showDebugInfo?: boolean;
}

export function ChatBubble({
  role,
  content,
  message,
  isCurrentUser,
  enableMdxProcessing = false,
  showDebugInfo = false,
}: ChatBubbleProps) {
  // Determine which props to use
  const actualRole = message?.role || role;
  const actualIsCurrentUser = isCurrentUser ?? (actualRole === "user");
  const actualContent = message?.text || content;

  // MDX processing logic (only if enabled and message provided)
  const mdxData = enableMdxProcessing && message?.metadata?.mdx ? {
    compiledSource: message.metadata.mdx.compiledSource,
    frontmatter: message.metadata.mdx.frontmatter,
    metadata: message.metadata.mdx.metadata,
  } : undefined;

  // DEBUG: Uncomment for detailed rendering logs
  // if (process.env.NODE_ENV === "development" && showDebugInfo && message?.role === "assistant") {
  //   console.log("[ChatBubble] 🎨 Rendering assistant message:", {
  //     messageId: message.id,
  //     actualContent: typeof actualContent === 'string' ? actualContent.substring(0, 100) : String(actualContent).substring(0, 100),
  //     enableMdxProcessing,
  //     hasMdxData: !!mdxData,
  //     mdxCompiledLength: mdxData?.compiledSource?.length,
  //     mdxCompiledPreview: mdxData?.compiledSource?.substring(0, 200),
  //     messageMetadata: message.metadata
  //   });
  // }

  const bubbleClass = actualIsCurrentUser ? "user" : "agent";
  const bubbleStyle: React.CSSProperties = {
    backgroundColor: actualRole === "user" ? 'var(--color-chat-bubble-user)' : 'var(--color-chat-bubble-agent)',
    color: actualRole === "user" ? 'var(--color-chat-bubble-user-foreground)' : 'var(--color-chat-bubble-agent-foreground)',
    borderRadius: '0.75rem',
  };

  return (
    <div
      className={`w-full flex ${actualIsCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative max-w-[75%] px-4 py-2 text-xs leading-[1.15] shadow-sm chat-bubble-${bubbleClass}`}
        style={bubbleStyle}
      >
        {/* Show MDX frontmatter if available */}
        {mdxData?.frontmatter && Object.keys(mdxData.frontmatter).length > 0 && (
          <div className="text-xs opacity-75 mb-2 border-b border-current/20 pb-1">
            {mdxData.frontmatter.title != null && (
              <div className="font-medium">{String(mdxData.frontmatter.title)}</div>
            )}
            {mdxData.frontmatter.author != null && (
              <div>by {String(mdxData.frontmatter.author)}</div>
            )}
          </div>
        )}

        {/* Render MDX compiled content if available, otherwise raw text/content */}
        {mdxData?.compiledSource ? (
          (() => {
            const styledHtml = mdxData.compiledSource
              .replace(/<h1>/g, '<h1 style="display: block; font-size: 24px; font-weight: 700; margin: 16px 0 8px 0; line-height: 1.2;">')
              .replace(/<h2>/g, '<h2 style="display: block; font-size: 20px; font-weight: 700; margin: 16px 0 8px 0; line-height: 1.2;">')
              .replace(/<h3>/g, '<h3 style="display: block; font-size: 18px; font-weight: 700; margin: 12px 0 6px 0; line-height: 1.2;">')
              .replace(/<p>/g, '<p style="display: block; margin: 0 0 8px 0; line-height: 1.5;">')
              .replace(/<strong>/g, '<strong style="font-weight: 700;">')
              .replace(/<em>/g, '<em style="font-style: italic;">')
              .replace(/<ul>/g, '<ul style="display: block; padding-left: 16px; margin: 0 0 8px 0; list-style-type: disc;">')
              .replace(/<li>/g, '<li style="display: list-item; margin: 0 0 4px 0;">')
              .replace(/<blockquote>/g, '<blockquote style="display: block; border-left: 4px solid #ccc; padding-left: 16px; margin: 8px 0; font-style: italic; opacity: 0.8;">')
              .replace(/<hr>/g, '<hr style="display: block; border: none; border-top: 1px solid #ccc; margin: 16px 0;">')
              .replace(/<a>/g, '<a style="color: #0066cc; text-decoration: underline;">')
              .replace(/<a href="([^"]*)">/g, '<a href="$1" style="color: #0066cc; text-decoration: underline;">')
              .replace(/<table>/g, '<table style="border-collapse: collapse; width: auto; margin: 6px 0; font-size: 0.75em; line-height: 1.2;">')
              .replace(/<th>/g, '<th style="border: 1px solid #ccc; padding: 2px 4px; background-color: #f5f5f5; font-weight: 700; text-align: left; white-space: nowrap;">')
              .replace(/<td>/g, '<td style="border: 1px solid #ccc; padding: 2px 4px; white-space: nowrap;">');

            // DEBUG: Uncomment for HTML styling details
            // if (process.env.NODE_ENV === "development" && showDebugInfo) {
            //   console.log("[ChatBubble] 🎨 Styled HTML preview:", {
            //     originalLength: mdxData.compiledSource.length,
            //     styledLength: styledHtml.length,
            //     hasH2Styling: styledHtml.includes('font-weight: bold !important'),
            //     sampleStyled: styledHtml.substring(0, 300)
            //   });
            // }

            return (
              <div
                // biome-ignore lint/security/noDangerouslySetInnerHtml: MDX compiled content is safe
                dangerouslySetInnerHTML={{
                  __html: styledHtml
                }}
              />
            );
          })()
        ) : (
          <span className="whitespace-pre-wrap">{actualContent}</span>
        )}

        {/* Show MDX compilation status for debugging */}
        {process.env.NODE_ENV === "development" && showDebugInfo && mdxData && (
          <div className="text-xs bg-yellow-100 text-black p-2 mt-2 border border-yellow-300 rounded">
            <strong>🔍 MDX DEBUG INFO:</strong><br />
            MDX: {mdxData.metadata?.mdxError ? "❌ Error" : "✅ Compiled"}
            {mdxData.compiledSource && ` (${mdxData.compiledSource.length} chars)`}
            <br />
            HTML: {mdxData.compiledSource?.includes('<strong>') ? '💪 Has <strong>' : '❌ No <strong>'}
            {mdxData.compiledSource?.includes('<b>') ? ' 💪 Has <b>' : ' ❌ No <b>'}
            {mdxData.compiledSource?.includes('<h1>') ? ' 📰 Has <h1>' : ' ❌ No <h1>'}
            {mdxData.compiledSource?.includes('<h2>') ? ' 📰 Has <h2>' : ' ❌ No <h2>'}
            <br />
            Raw HTML: <pre className="text-xs bg-gray-100 p-1 mt-1 overflow-auto max-h-20" style={{ color: 'black' }}>{mdxData.compiledSource}</pre>
          </div>
        )}

        {/* Additional debug for message content */}
        {process.env.NODE_ENV === "development" && showDebugInfo && (
          <div className="text-xs bg-blue-100 text-black p-2 mt-1 border border-blue-300 rounded">
            <strong>💬 MESSAGE DEBUG:</strong><br />
            Text: "{typeof actualContent === 'string' ? actualContent.substring(0, 100) : String(actualContent).substring(0, 100)}..."<br />
            Has MDX: {mdxData ? '✅ Yes' : '❌ No'}<br />
            {mdxData && `Compiled Source Length: ${mdxData.compiledSource?.length || 0}`}
          </div>
        )}
      </div>
    </div>
  );
}
