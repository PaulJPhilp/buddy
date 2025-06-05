# llm-agent

A WebSocket server that provides an LLM-powered chat experience with rich Markdown/MDX formatting support.

## Installation

To install dependencies:
```bash
bun install
```

## Running

To run:
```bash
bun run index.ts
```

Or using npm:
```bash
npm run start
```

## Features

- **Rich Markdown Support**: Responses include headers, lists, code blocks, tables, and more
- **Streaming Responses**: Real-time streaming for better user experience
- **WebSocket Protocol**: Full bidirectional communication
- **Google Gemini Integration**: Powered by Google's latest language model

## Testing Rich MDX Responses

Try these example prompts to see various markdown formatting in action:

### 1. Technical Explanation
```
"Explain how React hooks work"
```
Expected: Headers, code blocks, bullet points, **bold** terms

### 2. Tutorial Request
```
"Show me how to create a REST API with Node.js"
```
Expected: Step-by-step numbered lists, code examples, > blockquotes

### 3. Comparison Question
```
"Compare TypeScript vs JavaScript"
```
Expected: Tables, pros/cons lists, emphasis formatting

### 4. Business Analysis
```
"What are the key factors for startup success?"
```
Expected: ## Headers, ### Sub-sections, bullet points, **bold** emphasis

### 5. Recipe or Process
```
"How do I make the perfect pizza?"
```
Expected: Numbered steps, ingredient lists, *italic* tips

### 6. Complex Topic
```
"Explain quantum computing for beginners"
```
Expected: Multiple headers, analogies, > important notes, varied formatting

## Environment Variables

Create a `.env` file with:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
PORT=8080
```

This project was created using `bun init` in bun v1.2.12. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
