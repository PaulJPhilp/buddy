---
title: "llm-ui Integration Example"
author: "Buddy Assistant"
date: "2024-01-30"
---

# Welcome to llm-ui Integration!

This is an example of how the **llm-ui service** processes content from LLM responses.

## Features

- ✅ **Frontmatter parsing** - Extract metadata from YAML headers
- ✅ **Markdown rendering** - Full markdown support with formatting via llm-ui
- ✅ **Interactive tables** - Scrollable tables with drag-and-drop functionality
- ✅ **Error handling** - Graceful fallback to raw text

## Code Example

```typescript
const mdxService = yield* MdxService;
const result = yield* mdxService.compileForLlmUi(content, {
    development: process.env.NODE_ENV === "development"
});
```

## Math Support (if enabled)

You can also include mathematical expressions:

Inline math: $E = mc^2$

Block math:
$$
\sum_{i=1}^{n} x_i = x_1 + x_2 + \ldots + x_n
$$

## Usage

When an LLM response includes markdown formatting, it will be automatically processed through the llm-ui service and rendered with proper styling and interactive elements. 