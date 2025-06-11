# llm-agent

**Production LLM WebSocket Server** - A WebSocket server that provides an LLM-powered chat experience with rich Markdown/MDX formatting support.

## Installation

To install dependencies:
```bash
bun install
```

## Running

### Development
```bash
bun run dev          # Watch mode for development
```

### Production
```bash
bun run start        # Start with Node.js + tsx
bun run start:bun    # Start with Bun runtime
bun run start:server # Start with helper script
```

### Testing
```bash
bun test             # Run tests once
bun test:watch       # Run tests in watch mode
```

## Features

- **Rich Markdown Support**: Responses include headers, lists, code blocks, tables, and more
- **Streaming Responses**: Real-time streaming for better user experience
- **WebSocket Protocol**: Full bidirectional communication using @buddy/protocol
- **Google Gemini Integration**: Powered by Google's latest language model
- **Effect.js Integration**: Modern functional programming patterns
- **Production Ready**: Clean architecture, proper error handling, comprehensive tests

## Architecture

- **Main Server**: `index.ts` - Production WebSocket server implementation
- **Protocol**: Uses `@buddy/protocol` package for standardized WebSocket messaging
- **Testing**: Comprehensive test suite with Effect.js client testing
- **Startup**: Helper startup script with environment validation

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

## Development

This is the main production server for the Buddy chat application. It handles:
- WebSocket connections from chat clients
- LLM processing with Google Gemini
- Rich markdown response formatting
- Real-time streaming responses
- Protocol-compliant message handling

Built with [Bun](https://bun.sh) and modern TypeScript.
