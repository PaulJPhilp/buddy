# Environment Variables Guide

## Overview

This guide documents all environment variables used in the buddy application, their purposes, where they're used, and how to configure them for different environments.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [AI Provider Keys](#ai-provider-keys)
3. [Clerk Authentication](#clerk-authentication)
4. [Application URLs](#application-urls)
5. [Security & CORS](#security--cors)
6. [Environment-Specific Configuration](#environment-specific-configuration)
7. [Usage in Code](#usage-in-code)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Required Variables

| Variable | Required | Type | Default |
|----------|----------|------|---------|
| `OPENAI_API_KEY` | One of AI keys | Server | - |
| `GOOGLE_GENERATIVE_AI_API_KEY` | One of AI keys | Server | - |
| `ANTHROPIC_API_KEY` | One of AI keys | Server | - |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Public | - |
| `CLERK_SECRET_KEY` | Yes | Server | - |
| `NEXT_PUBLIC_API_URL` | Yes | Public | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | Yes | Public | `ws://localhost:3001` |

### Optional Variables

| Variable | Required | Type | Default |
|----------|----------|------|---------|
| `NEXT_PUBLIC_WS_HOST` | No | Public | `localhost` |
| `NEXT_PUBLIC_AGENT_URL` | No | Public | `http://localhost:3002` |
| `ALLOWED_ORIGINS` | No | Server | `[]` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Public | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Public | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | Public | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | Public | `/` |

---

## AI Provider Keys

### OPENAI_API_KEY

**Type**: Server-side only  
**Required**: One of the AI provider keys is required  
**Purpose**: Authenticate with OpenAI API for GPT models

**Where to get it**:
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Used in**:
- `src/services/agentkit/service.ts` - AgentKitService provider selection
- `src/app/api/agent/generate/route.ts` - API route for agent generation

**Example**:
```bash
OPENAI_API_KEY=sk-proj-abc123...xyz789
```

**Models supported**:
- gpt-4
- gpt-4-turbo
- gpt-3.5-turbo
- And other OpenAI models

---

### GOOGLE_GENERATIVE_AI_API_KEY

**Type**: Server-side only  
**Required**: One of the AI provider keys is required  
**Purpose**: Authenticate with Google Generative AI (Gemini) API

**Where to get it**:
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

**Used in**:
- `src/services/agentkit/service.ts` - AgentKitService provider selection
- `src/app/api/agent/stream/route.ts` - Streaming API route
- `src/app/api/agent/generate/route.ts` - Generation API route

**Example**:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyAbc123...xyz789
```

**Models supported**:
- gemini-pro
- gemini-pro-vision
- And other Google Generative AI models

---

### ANTHROPIC_API_KEY

**Type**: Server-side only  
**Required**: One of the AI provider keys is required  
**Purpose**: Authenticate with Anthropic API for Claude models

**Where to get it**:
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key (starts with `sk-ant-`)

**Used in**:
- `src/services/agentkit/service.ts` - AgentKitService provider selection

**Example**:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-abc123...xyz789
```

**Models supported**:
- claude-3-opus
- claude-3-sonnet
- claude-3-haiku
- claude-2.1
- And other Claude models

---

## Clerk Authentication

### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

**Type**: Public (exposed to browser)  
**Required**: Yes  
**Purpose**: Client-side authentication with Clerk

**Where to get it**:
1. Go to https://dashboard.clerk.com/
2. Select your application
3. Navigate to "API Keys"
4. Copy the "Publishable Key" (starts with `pk_test_` or `pk_live_`)

**Used in**:
- Client-side Clerk components
- Authentication flows
- User session management

**Example**:
```bash
# Development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123...xyz789

# Production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_abc123...xyz789
```

---

### CLERK_SECRET_KEY

**Type**: Server-side only (NEVER expose to browser)  
**Required**: Yes  
**Purpose**: Server-side authentication and API calls to Clerk

**Where to get it**:
1. Go to https://dashboard.clerk.com/
2. Select your application
3. Navigate to "API Keys"
4. Copy the "Secret Key" (starts with `sk_test_` or `sk_live_`)

**Used in**:
- Server-side authentication
- API routes requiring authentication
- Middleware authentication checks

**Example**:
```bash
# Development
CLERK_SECRET_KEY=sk_test_abc123...xyz789

# Production
CLERK_SECRET_KEY=sk_live_abc123...xyz789
```

**⚠️ Security Warning**: Never commit this key to version control or expose it to the client.

---

### Clerk URL Configuration (Optional)

#### NEXT_PUBLIC_CLERK_SIGN_IN_URL

**Type**: Public  
**Required**: No  
**Default**: `/sign-in`  
**Purpose**: Custom sign-in page URL

**Example**:
```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
```

#### NEXT_PUBLIC_CLERK_SIGN_UP_URL

**Type**: Public  
**Required**: No  
**Default**: `/sign-up`  
**Purpose**: Custom sign-up page URL

**Example**:
```bash
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
```

#### NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL

**Type**: Public  
**Required**: No  
**Default**: `/`  
**Purpose**: Redirect URL after successful sign-in

**Example**:
```bash
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

#### NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL

**Type**: Public  
**Required**: No  
**Default**: `/`  
**Purpose**: Redirect URL after successful sign-up

**Example**:
```bash
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

---

## Application URLs

### NEXT_PUBLIC_API_URL

**Type**: Public (exposed to browser)  
**Required**: Yes  
**Purpose**: Base URL for API endpoints

**Used in**:
- `apps/client/__tests__/integration/test-config.ts` - Test configuration
- API client initialization
- Fetch requests to backend

**Examples**:
```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Production
NEXT_PUBLIC_API_URL=https://your-app.vercel.app

# Staging
NEXT_PUBLIC_API_URL=https://staging.your-app.vercel.app
```

**Configured in**: `next.config.ts` (line 24-25)

---

### NEXT_PUBLIC_WS_URL

**Type**: Public (exposed to browser)  
**Required**: Yes  
**Purpose**: WebSocket server URL for real-time communication

**Used in**:
- `apps/client/__tests__/integration/test-config.ts` - Test configuration
- WebSocket client connections
- Real-time chat functionality

**Examples**:
```bash
# Development
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Production (secure WebSocket)
NEXT_PUBLIC_WS_URL=wss://ws.your-app.com

# Staging
NEXT_PUBLIC_WS_URL=wss://ws-staging.your-app.com
```

**Configured in**: `next.config.ts` (line 24-25)

**Note**: Use `ws://` for local development, `wss://` for production (secure WebSocket)

---

### NEXT_PUBLIC_WS_HOST

**Type**: Public  
**Required**: No  
**Default**: `localhost`  
**Purpose**: WebSocket server hostname

**Used in**:
- Test server configuration
- WebSocket connection setup

**Example**:
```bash
NEXT_PUBLIC_WS_HOST=localhost
```

---

### NEXT_PUBLIC_AGENT_URL

**Type**: Public  
**Required**: No  
**Default**: `http://localhost:3002`  
**Purpose**: External agent service URL (if using separate agent server)

**Used in**:
- `apps/client/__tests__/integration/test-config.ts` - Test configuration
- Agent service communication

**Example**:
```bash
NEXT_PUBLIC_AGENT_URL=http://localhost:3002
```

---

## Security & CORS

### ALLOWED_ORIGINS

**Type**: Server-side only  
**Required**: No  
**Default**: `[]` (empty array)  
**Purpose**: Comma-separated list of allowed origins for Server Actions

**Used in**:
- `next.config.ts` (line 14-16) - Server Actions configuration
- CORS validation

**Examples**:
```bash
# Single origin
ALLOWED_ORIGINS=https://your-app.com

# Multiple origins
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com,https://admin.your-app.com

# Development (allow localhost)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**When to use**:
- Production deployments with multiple domains
- Microservices architecture
- CDN configurations

---

## Environment-Specific Configuration

### Development (.env.local)

```bash
# AI Providers (at least one required)
OPENAI_API_KEY=sk-proj-your-dev-key
GOOGLE_GENERATIVE_AI_API_KEY=your-dev-key
ANTHROPIC_API_KEY=sk-ant-your-dev-key

# Clerk (development keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-dev-key
CLERK_SECRET_KEY=sk_test_your-dev-key

# Local URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_WS_HOST=localhost
NEXT_PUBLIC_AGENT_URL=http://localhost:3002

# Development settings
ALLOWED_ORIGINS=http://localhost:3000
```

### Production (Vercel/Hosting Platform)

```bash
# AI Providers (production keys)
OPENAI_API_KEY=sk-proj-your-prod-key
GOOGLE_GENERATIVE_AI_API_KEY=your-prod-key
ANTHROPIC_API_KEY=sk-ant-your-prod-key

# Clerk (production keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-prod-key
CLERK_SECRET_KEY=sk_live_your-prod-key

# Production URLs
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://ws.your-app.com

# Production settings
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com
```

### Staging

```bash
# AI Providers (can use dev or separate staging keys)
OPENAI_API_KEY=sk-proj-your-staging-key
GOOGLE_GENERATIVE_AI_API_KEY=your-staging-key
ANTHROPIC_API_KEY=sk-ant-your-staging-key

# Clerk (test keys or separate staging)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-staging-key
CLERK_SECRET_KEY=sk_test_your-staging-key

# Staging URLs
NEXT_PUBLIC_API_URL=https://staging.your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://ws-staging.your-app.com

# Staging settings
ALLOWED_ORIGINS=https://staging.your-app.com
```

---

## Usage in Code

### Accessing Environment Variables

#### Server-Side (API Routes, Server Components)

```typescript
// Direct access to all environment variables
const apiKey = process.env.OPENAI_API_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

// Example in API route
export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GOOGLE_GENERATIVE_AI_API_KEY" },
      { status: 500 }
    );
  }
  // Use the API key...
}
```

#### Client-Side (React Components, Hooks)

```typescript
// Only NEXT_PUBLIC_* variables are available
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

// Example in component
export function MyComponent() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  // Use the URL...
}
```

#### In Effect.ts Services

```typescript
// src/services/agentkit/service.ts
function getProviderModel(config: AgentConfig) {
  switch (config.provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY)
        throw new InvalidAgentConfig("Missing OPENAI_API_KEY");
      return openai(config.model);
    
    case "google":
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        throw new InvalidAgentConfig("Missing GOOGLE_GENERATIVE_AI_API_KEY");
      return google(config.model);
    
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY)
        throw new InvalidAgentConfig("Missing ANTHROPIC_API_KEY");
      return anthropic(config.model);
  }
}
```

#### In Tests

```typescript
// __tests__/integration/test-config.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3002";

export const TestConfigLayer = Layer.succeed(ConfigService, {
  apiUrl: API_URL,
  wsUrl: WS_URL,
  agentUrl: AGENT_URL,
});
```

---

## Security Best Practices

### 1. Never Commit Secrets

❌ **DON'T**:
```bash
# .env (committed to git)
OPENAI_API_KEY=sk-proj-abc123...
CLERK_SECRET_KEY=sk_test_abc123...
```

✅ **DO**:
```bash
# .env.example (committed to git)
OPENAI_API_KEY=your-openai-api-key-here
CLERK_SECRET_KEY=your-clerk-secret-key-here

# .env.local (in .gitignore)
OPENAI_API_KEY=sk-proj-actual-key
CLERK_SECRET_KEY=sk_test_actual-key
```

### 2. Use NEXT_PUBLIC_ Prefix Carefully

❌ **DON'T**: Expose secrets with NEXT_PUBLIC_
```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-abc123  # EXPOSED TO BROWSER!
```

✅ **DO**: Only use NEXT_PUBLIC_ for truly public values
```bash
NEXT_PUBLIC_API_URL=https://api.example.com  # OK to expose
OPENAI_API_KEY=sk-proj-abc123  # Server-side only
```

### 3. Rotate Keys Regularly

- Rotate API keys every 90 days
- Immediately rotate if compromised
- Use different keys for dev/staging/prod

### 4. Use Environment-Specific Keys

- Development: Use test/development keys
- Staging: Use separate staging keys
- Production: Use production keys with rate limits

### 5. Validate Environment Variables

```typescript
// Validate on startup
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is required");
}

if (!process.env.OPENAI_API_KEY && 
    !process.env.GOOGLE_GENERATIVE_AI_API_KEY && 
    !process.env.ANTHROPIC_API_KEY) {
  throw new Error("At least one AI provider API key is required");
}
```

---

## Troubleshooting

### Variables Not Loading

**Problem**: Environment variables are undefined

**Solutions**:
1. Ensure file is named `.env.local` (not `.env`)
2. Restart dev server after changing variables
3. Check file is in project root
4. Verify no typos in variable names

### Public Variables Not Available in Browser

**Problem**: `process.env.NEXT_PUBLIC_*` is undefined in client

**Solutions**:
1. Ensure variable starts with `NEXT_PUBLIC_`
2. Restart dev server (required for new variables)
3. Check `next.config.ts` env configuration
4. Clear Next.js cache: `rm -rf .next`

### Clerk Authentication Not Working

**Problem**: Clerk throws authentication errors

**Solutions**:
1. Verify both publishable and secret keys are set
2. Ensure keys match (both test or both live)
3. Check keys are for the correct Clerk application
4. Restart server after updating keys

### WebSocket Connection Fails

**Problem**: Cannot connect to WebSocket server

**Solutions**:
1. Verify `NEXT_PUBLIC_WS_URL` is set correctly
2. Ensure WebSocket server is running (`bun run start:ws`)
3. Check URL uses `ws://` (dev) or `wss://` (prod)
4. Verify firewall/network allows WebSocket connections

### AI Provider Errors

**Problem**: AI API calls fail with authentication errors

**Solutions**:
1. Verify correct API key is set for the provider
2. Check API key has not expired
3. Ensure API key has sufficient credits/quota
4. Verify key format (OpenAI: `sk-`, Anthropic: `sk-ant-`)

---

## Related Documentation

- [.env.example](../.env.example) - Example environment file
- [Clerk Setup Guide](./Clerk-Setup.md) - Clerk authentication setup
- [Deployment Guide](./Deployment-Guide.md) - Production deployment
- [CLAUDE.md](../CLAUDE.md) - Architecture overview

---

**Last Updated**: October 14, 2025
**Status**: Complete Environment Variables Reference
**Maintainer**: DevOps & Security Team
