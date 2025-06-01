---
title: "MDX Integration Example"
author: "Buddy Assistant"
date: "2024-01-30"
---

# Welcome to MDX Integration!

This is an example of how the **MDX service** processes content from LLM responses.

## Features

- ✅ **Frontmatter parsing** - Extract metadata from YAML headers
- ✅ **Markdown rendering** - Full markdown support with formatting
- ✅ **Code highlighting** - Syntax highlighting for code blocks
- ✅ **Error handling** - Graceful fallback to raw text

## Code Example

```typescript
const mdxService = yield* MdxService;
const result = yield* mdxService.compile(content, {
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

When an LLM response includes markdown formatting, it will be automatically processed through the MDX service and rendered with proper styling. 