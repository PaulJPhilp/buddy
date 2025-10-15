# Deployment Guide

## Overview

This guide covers deploying the buddy application to production, with a focus on Vercel deployment (recommended), but also covering alternative platforms.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
3. [Environment Configuration](#environment-configuration)
4. [Build Configuration](#build-configuration)
5. [Database & Storage](#database--storage)
6. [WebSocket Server Deployment](#websocket-server-deployment)
7. [Alternative Platforms](#alternative-platforms)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Logging](#monitoring--logging)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Before Deploying

✅ **Required**:
- [ ] All tests passing (`bun test`)
- [ ] Type checking passes (`bun run check-types`)
- [ ] Linting passes (`bun run lint`)
- [ ] Production build succeeds (`bun run build`)
- [ ] Environment variables documented
- [ ] API keys for production ready
- [ ] Clerk production keys obtained

✅ **Recommended**:
- [ ] E2E tests passing (`bun e2e`)
- [ ] Performance tests passing
- [ ] Security audit completed
- [ ] Backup strategy in place

### Required Accounts

1. **Vercel Account** (or alternative hosting)
   - Sign up at https://vercel.com/
   - Free tier available

2. **Clerk Production Account**
   - Production keys from https://dashboard.clerk.com/

3. **AI Provider Accounts**
   - OpenAI, Google AI, or Anthropic production keys

---

## Vercel Deployment (Recommended)

### Why Vercel?

- ✅ Built for Next.js (same team)
- ✅ Automatic deployments from git
- ✅ Preview deployments for PRs
- ✅ Edge network (global CDN)
- ✅ Serverless functions
- ✅ Environment variable management
- ✅ Free tier available

### Step 1: Connect Repository

#### Option A: Deploy from GitHub

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select "Import Git Repository"
4. Authorize Vercel to access your GitHub
5. Select the `buddy` repository
6. Click "Import"

#### Option B: Deploy with Vercel CLI

```bash
# Install Vercel CLI
bun add -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Step 2: Configure Project

**Framework Preset**: Next.js (auto-detected)

**Build Settings**:
- **Build Command**: `bun run build`
- **Output Directory**: `apps/client/.next`
- **Install Command**: `bun install`
- **Development Command**: `bun dev`

**Root Directory**: `apps/client` (if monorepo structure)

### Step 3: Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```bash
# AI Provider Keys (at least one required)
OPENAI_API_KEY=sk-proj-your-production-key
GOOGLE_GENERATIVE_AI_API_KEY=your-production-key
ANTHROPIC_API_KEY=sk-ant-your-production-key

# Clerk Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-production-key
CLERK_SECRET_KEY=sk_live_your-production-key

# Application URLs
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://ws.your-app.com

# Optional
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**Environment Scopes**:
- **Production**: Live production environment
- **Preview**: PR preview deployments
- **Development**: Local development (use `.env.local` instead)

### Step 4: Deploy

**Automatic Deployment**:
- Push to `main` branch → Deploys to production
- Push to other branches → Creates preview deployment
- Open PR → Creates preview deployment with unique URL

**Manual Deployment**:
```bash
vercel --prod
```

### Step 5: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `buddy.yourdomain.com`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)
5. SSL certificate automatically provisioned

---

## Environment Configuration

### Production Environment Variables

#### Required Variables

```bash
# AI Providers (at least one)
OPENAI_API_KEY=sk-proj-...
GOOGLE_GENERATIVE_AI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...

# Clerk (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# URLs (required)
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://ws.your-app.com
```

#### Optional Variables

```bash
# CORS
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# WebSocket
NEXT_PUBLIC_WS_HOST=ws.your-app.com
NEXT_PUBLIC_AGENT_URL=https://agent.your-app.com
```

### Environment-Specific Configuration

**Production**:
```bash
NODE_ENV=production  # Automatically set by Vercel
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://ws.your-app.com
```

**Staging/Preview**:
```bash
NODE_ENV=production  # Automatically set
NEXT_PUBLIC_API_URL=https://staging-your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://ws-staging.your-app.com
```

---

## Build Configuration

### Next.js Configuration

The app uses `next.config.ts` with production optimizations:

```typescript
// next.config.ts
const config: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@buddy/ui", "@clerk/nextjs"],
  
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Remove console.log in prod
  },
  
  experimental: {
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : [],
    },
  },
};
```

### Build Command

```bash
# Local production build
bun run build

# Vercel automatically runs
bun install && bun run build
```

### Build Output

```
apps/client/.next/
├── static/          # Static assets
├── server/          # Server-side code
└── cache/           # Build cache
```

---

## Database & Storage

### Current Setup

The buddy app currently uses:
- **Local file storage** for configuration
- **In-memory state** for runtime data

### Production Considerations

For production, consider adding:

#### 1. PostgreSQL Database

```bash
# Add to environment variables
DATABASE_URL=postgresql://user:password@host:5432/buddy
```

**Providers**:
- Vercel Postgres
- Supabase
- Neon
- Railway

#### 2. Redis for Caching

```bash
REDIS_URL=redis://user:password@host:6379
```

**Providers**:
- Upstash Redis
- Redis Cloud
- Vercel KV

#### 3. File Storage

```bash
# For user uploads, configs, etc.
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

**Providers**:
- Vercel Blob
- AWS S3
- Cloudflare R2

---

## WebSocket Server Deployment

### Separate WebSocket Server

The WebSocket server needs separate deployment from Next.js:

#### Option 1: Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create app
flyctl launch

# Deploy
flyctl deploy
```

**fly.toml**:
```toml
app = "buddy-websocket"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "3001"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

#### Option 2: Deploy to Railway

1. Go to https://railway.app/
2. Create new project
3. Connect GitHub repository
4. Select WebSocket server directory
5. Set environment variables
6. Deploy

#### Option 3: Use Vercel Serverless WebSocket

For simpler setup, use Vercel's WebSocket support:

```typescript
// app/api/ws/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }
  
  // WebSocket handling
}
```

---

## Alternative Platforms

### Netlify

```bash
# netlify.toml
[build]
  command = "bun run build"
  publish = "apps/client/.next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### AWS Amplify

1. Connect GitHub repository
2. Configure build settings:
   - **Build command**: `bun run build`
   - **Base directory**: `apps/client`
3. Set environment variables
4. Deploy

### Docker Deployment

```dockerfile
# Dockerfile
FROM oven/bun:1.2.3

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "start"]
```

```bash
# Build and run
docker build -t buddy .
docker run -p 3000:3000 buddy
```

---

## Post-Deployment

### Step 1: Verify Deployment

```bash
# Check deployment URL
curl https://your-app.vercel.app

# Check health endpoint (if implemented)
curl https://your-app.vercel.app/api/health

# Check WebSocket connection
wscat -c wss://ws.your-app.com
```

### Step 2: Update Clerk Settings

1. Go to Clerk Dashboard
2. Update application URLs:
   - **Home URL**: `https://your-app.vercel.app`
   - **Authorized domains**: Add production domain
3. Update OAuth redirect URLs

### Step 3: Test Authentication

1. Visit production URL
2. Sign up with test account
3. Verify email flow
4. Test sign-in
5. Test sign-out

### Step 4: Test Core Functionality

- [ ] Create workspace
- [ ] Create chat app
- [ ] Send messages
- [ ] WebSocket connection
- [ ] AI responses
- [ ] User profile

### Step 5: Configure Monitoring

Set up monitoring and alerts:
- Vercel Analytics (built-in)
- Error tracking (Sentry, etc.)
- Uptime monitoring (UptimeRobot, etc.)

---

## Monitoring & Logging

### Vercel Analytics

Automatically enabled for all deployments:
- Page views
- Performance metrics
- Web Vitals
- User analytics

Access: Vercel Dashboard → Your Project → Analytics

### Error Tracking

#### Option 1: Sentry

```bash
# Install
bun add @sentry/nextjs

# Configure
# sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Option 2: Vercel Logs

View logs in Vercel Dashboard:
- Real-time logs
- Function logs
- Build logs
- Error logs

### Performance Monitoring

```typescript
// app/api/metrics/route.ts
export async function GET() {
  return Response.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
}
```

---

## Rollback Procedures

### Vercel Rollback

#### Via Dashboard

1. Go to Vercel Dashboard → Your Project → Deployments
2. Find previous working deployment
3. Click "..." menu
4. Click "Promote to Production"

#### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Git Rollback

```bash
# Revert last commit
git revert HEAD

# Push to trigger redeployment
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Environment Variable Rollback

1. Go to Vercel Dashboard → Settings → Environment Variables
2. View history of each variable
3. Restore previous value
4. Redeploy

---

## Troubleshooting

### Build Failures

**Issue**: Build fails on Vercel

**Solutions**:
1. Check build logs in Vercel Dashboard
2. Verify `bun run build` works locally
3. Check all dependencies are in `package.json`
4. Verify environment variables are set
5. Check for TypeScript errors

### Environment Variables Not Working

**Issue**: Variables undefined in production

**Solutions**:
1. Verify variables are set in Vercel Dashboard
2. Check variable names match exactly (case-sensitive)
3. Ensure `NEXT_PUBLIC_` prefix for client-side variables
4. Redeploy after adding variables
5. Check environment scope (Production/Preview/Development)

### Authentication Errors

**Issue**: Clerk authentication fails in production

**Solutions**:
1. Verify production Clerk keys are set
2. Check Clerk Dashboard → Domains includes production URL
3. Ensure both publishable and secret keys match (both live)
4. Update OAuth redirect URLs in Clerk
5. Clear cookies and test again

### WebSocket Connection Fails

**Issue**: Cannot connect to WebSocket server

**Solutions**:
1. Verify WebSocket server is deployed and running
2. Check `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`)
3. Verify firewall/security groups allow WebSocket
4. Check WebSocket server logs
5. Test connection with `wscat`

### Performance Issues

**Issue**: Slow page loads or API responses

**Solutions**:
1. Check Vercel Analytics for bottlenecks
2. Optimize images (use Next.js Image component)
3. Enable caching where appropriate
4. Consider adding Redis for caching
5. Review database query performance
6. Check for memory leaks

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not code)
- [ ] `.env.local` in `.gitignore`
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection enabled

### Post-Deployment

- [ ] Security headers configured
- [ ] CSP (Content Security Policy) set
- [ ] API keys rotated from development
- [ ] Clerk production keys active
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Incident response plan documented

---

## Continuous Deployment

### Automatic Deployments

**Main Branch** → Production:
```yaml
# .github/workflows/deploy.yml (optional)
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run build
```

**Feature Branches** → Preview:
- Automatic preview deployments for all PRs
- Unique URL for each preview
- Automatically deleted when PR is closed

### Deployment Workflow

```
1. Developer pushes to feature branch
   ↓
2. Vercel creates preview deployment
   ↓
3. Run tests on preview
   ↓
4. Review and test preview URL
   ↓
5. Merge PR to main
   ↓
6. Vercel deploys to production
   ↓
7. Monitor production deployment
```

---

## Related Documentation

- [Environment Variables Guide](./Environment-Variables.md) - All environment variables
- [Clerk Setup Guide](./Clerk-Setup.md) - Authentication setup
- [Testing Guide](./Testing-Guide.md) - Testing before deployment
- [CLAUDE.md](../CLAUDE.md) - Architecture overview

---

**Last Updated**: October 14, 2025
**Status**: Complete Deployment Guide
**Maintainer**: DevOps Team
