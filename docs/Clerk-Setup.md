# Clerk Authentication Setup Guide

## Overview

This guide walks you through setting up Clerk authentication for the buddy application, from creating a Clerk account to implementing authentication in your app.

---

## Table of Contents

1. [What is Clerk?](#what-is-clerk)
2. [Creating a Clerk Account](#creating-a-clerk-account)
3. [Setting Up Your Application](#setting-up-your-application)
4. [Getting API Keys](#getting-api-keys)
5. [Configuring Environment Variables](#configuring-environment-variables)
6. [Authentication Flow](#authentication-flow)
7. [Testing Authentication](#testing-authentication)
8. [Customization](#customization)
9. [Troubleshooting](#troubleshooting)
10. [Production Deployment](#production-deployment)

---

## What is Clerk?

**Clerk** is a complete user management and authentication solution that provides:

- 🔐 **Authentication**: Sign-in, sign-up, password reset
- 👤 **User Management**: User profiles, sessions, organizations
- 🎨 **Customizable UI**: Pre-built components with theming
- 🔒 **Security**: Built-in security best practices
- 📱 **Multi-factor Auth**: SMS, TOTP, backup codes
- 🌐 **Social Login**: Google, GitHub, Twitter, etc.

**Why Clerk for buddy?**
- Drop-in React components
- Next.js 15 support
- Server and client-side authentication
- Minimal configuration required

---

## Creating a Clerk Account

### Step 1: Sign Up

1. Go to https://clerk.com/
2. Click "Start Building for Free"
3. Sign up with:
   - Email and password, OR
   - GitHub account, OR
   - Google account

### Step 2: Verify Email

1. Check your email for verification link
2. Click the link to verify your account
3. Complete your profile setup

---

## Setting Up Your Application

### Step 1: Create New Application

1. After signing in, you'll see the Clerk Dashboard
2. Click "Create Application" or "+ New Application"
3. Enter application details:
   - **Name**: `Buddy` (or your preferred name)
   - **Application Type**: Web Application
   - **Framework**: Next.js

### Step 2: Choose Authentication Methods

Select which sign-in methods to enable:

**Recommended for buddy**:
- ✅ **Email**: Email + password authentication
- ✅ **Google**: Google OAuth (optional but recommended)
- ✅ **GitHub**: GitHub OAuth (optional, good for developers)

**Other options**:
- Microsoft, Apple, Discord, Twitter, etc.
- Phone number (SMS)
- Passkeys
- SAML (Enterprise)

### Step 3: Configure Application Settings

**Application Settings**:
- **Home URL**: `http://localhost:3000` (development)
- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in URL**: `/`
- **After sign-up URL**: `/`

---

## Getting API Keys

### Step 1: Navigate to API Keys

1. In Clerk Dashboard, select your application
2. Click "API Keys" in the left sidebar
3. You'll see two types of keys:
   - **Publishable Key** (public, safe for client-side)
   - **Secret Key** (private, server-side only)

### Step 2: Copy Keys

**Publishable Key**:
```
pk_test_abc123...xyz789  (Development)
pk_live_abc123...xyz789  (Production)
```

**Secret Key**:
```
sk_test_abc123...xyz789  (Development)
sk_live_abc123...xyz789  (Production)
```

⚠️ **Important**: 
- Development keys start with `pk_test_` and `sk_test_`
- Production keys start with `pk_live_` and `sk_live_`
- Never commit secret keys to version control

---

## Configuring Environment Variables

### Step 1: Create .env.local

In your project root, create `.env.local`:

```bash
# Copy from .env.example
cp .env.example .env.local
```

### Step 2: Add Clerk Keys

Edit `.env.local` and add your Clerk keys:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-actual-publishable-key
CLERK_SECRET_KEY=sk_test_your-actual-secret-key

# Optional: Custom URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Step 3: Verify Configuration

Restart your development server:

```bash
bun dev
```

Check that variables are loaded:
```typescript
console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY); // Should print your key
```

---

## Authentication Flow

### How Clerk Works in buddy

```
┌─────────────────────────────────────────────────────────────┐
│                     User visits app                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Clerk checks authentication                    │
│              (via middleware.ts)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  Authenticated   │          │  Not Authenticated│
│  → Allow access  │          │  → Redirect to    │
│                  │          │     /sign-in      │
└──────────────────┘          └──────────────────┘
```

### Middleware Configuration

Clerk uses Next.js middleware to protect routes:

```typescript
// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Protect all routes except public ones
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Protected Routes

By default, Clerk protects all routes. To make routes public:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/public(.*)",
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});
```

---

## Testing Authentication

### Step 1: Start Development Server

```bash
bun dev
```

### Step 2: Navigate to Sign-Up

1. Open http://localhost:3000
2. You should be redirected to `/sign-in`
3. Click "Sign up" link

### Step 3: Create Test Account

**Option 1: Email**
1. Enter email address
2. Enter password (min 8 characters)
3. Verify email (check inbox)
4. Complete sign-up

**Option 2: Google/GitHub**
1. Click "Continue with Google" or "Continue with GitHub"
2. Authorize the application
3. Complete sign-up

### Step 4: Verify Authentication

After sign-up, you should:
- Be redirected to `/` (or your configured after-sign-up URL)
- See your user information in the app
- Be able to access protected routes

### Step 5: Test Sign-Out

```typescript
// In your component
import { SignOutButton } from "@clerk/nextjs";

<SignOutButton>
  <button>Sign Out</button>
</SignOutButton>
```

---

## Customization

### Custom Sign-In Page

Create `app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
      />
    </div>
  );
}
```

### Custom Sign-Up Page

Create `app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
      />
    </div>
  );
}
```

### Theming

Customize Clerk components to match your brand:

```typescript
import { ClerkProvider } from "@clerk/nextjs";

<ClerkProvider
  appearance={{
    baseTheme: "dark", // or "light"
    variables: {
      colorPrimary: "#3b82f6", // Your brand color
      colorBackground: "#ffffff",
      colorText: "#1f2937",
    },
    elements: {
      formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
      card: "shadow-xl",
    },
  }}
>
  {children}
</ClerkProvider>
```

### User Profile Component

Add user profile management:

```typescript
import { UserButton, UserProfile } from "@clerk/nextjs";

// User button (avatar with dropdown)
<UserButton afterSignOutUrl="/" />

// Full profile page
<UserProfile />
```

---

## Troubleshooting

### Issue: "Clerk: Missing publishable key"

**Cause**: Publishable key not set or not loaded

**Solution**:
1. Verify `.env.local` has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. Restart dev server
3. Check key starts with `pk_test_` or `pk_live_`
4. Ensure no typos in variable name

### Issue: "Clerk: Invalid secret key"

**Cause**: Secret key is incorrect or missing

**Solution**:
1. Verify `.env.local` has `CLERK_SECRET_KEY`
2. Check key starts with `sk_test_` or `sk_live_`
3. Ensure key matches the publishable key environment (both test or both live)
4. Regenerate keys in Clerk Dashboard if needed

### Issue: Infinite redirect loop

**Cause**: Middleware configuration issue

**Solution**:
1. Check `middleware.ts` configuration
2. Ensure sign-in/sign-up routes are public
3. Verify `NEXT_PUBLIC_CLERK_SIGN_IN_URL` matches actual route
4. Clear browser cookies and cache

### Issue: "User not found" after sign-up

**Cause**: Session not properly established

**Solution**:
1. Clear browser cookies
2. Sign out and sign in again
3. Check Clerk Dashboard → Users to verify user was created
4. Verify middleware is properly configured

### Issue: Social login not working

**Cause**: OAuth not configured in Clerk

**Solution**:
1. Go to Clerk Dashboard → Social Connections
2. Enable desired providers (Google, GitHub, etc.)
3. Configure OAuth credentials if required
4. Test again

---

## Production Deployment

### Step 1: Create Production Instance

**Option 1: Use same Clerk app**
- Switch to production keys (`pk_live_`, `sk_live_`)

**Option 2: Create separate production app**
1. In Clerk Dashboard, create new application
2. Name it "Buddy Production"
3. Configure same settings as development
4. Get production keys

### Step 2: Configure Production Environment

In your hosting platform (Vercel, etc.), set:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-production-key
CLERK_SECRET_KEY=sk_live_your-production-key

# Production URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Step 3: Update Clerk Application Settings

In Clerk Dashboard:
1. Go to your production application
2. Update URLs:
   - **Home URL**: `https://your-app.vercel.app`
   - **Authorized domains**: Add your production domain
3. Configure OAuth redirect URLs for production

### Step 4: Test Production Authentication

1. Deploy to production
2. Visit your production URL
3. Test sign-up flow
4. Test sign-in flow
5. Verify user data in Clerk Dashboard

### Step 5: Monitor

- Check Clerk Dashboard → Analytics for usage
- Monitor authentication errors
- Review user sign-ups and activity

---

## Security Best Practices

### 1. Protect Secret Keys

❌ **Never**:
- Commit secret keys to git
- Share secret keys in chat/email
- Use production keys in development

✅ **Always**:
- Use environment variables
- Rotate keys regularly
- Use different keys for dev/prod

### 2. Configure Allowed Domains

In Clerk Dashboard:
1. Go to Settings → Domains
2. Add only your actual domains
3. Remove localhost from production

### 3. Enable Multi-Factor Authentication

For admin users:
1. Go to Clerk Dashboard → User & Authentication
2. Enable MFA options
3. Require MFA for admin roles

### 4. Monitor User Activity

- Review Clerk Dashboard → Events regularly
- Set up webhooks for important events
- Monitor failed authentication attempts

---

## Advanced Features

### Webhooks

Sync Clerk users to your database:

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  const payload = await req.text();
  const headersList = headers();
  
  const wh = new Webhook(WEBHOOK_SECRET);
  const evt = wh.verify(payload, {
    "svix-id": headersList.get("svix-id")!,
    "svix-timestamp": headersList.get("svix-timestamp")!,
    "svix-signature": headersList.get("svix-signature")!,
  });

  // Handle user.created, user.updated, etc.
  if (evt.type === "user.created") {
    // Sync to database
  }
}
```

### Organizations

Enable multi-tenancy:

```typescript
import { OrganizationSwitcher, OrganizationProfile } from "@clerk/nextjs";

<OrganizationSwitcher />
<OrganizationProfile />
```

### Custom Claims

Add custom data to user tokens:

```typescript
// In Clerk Dashboard → JWT Templates
{
  "metadata": "{{user.public_metadata}}"
}
```

---

## Related Documentation

- [Environment Variables Guide](./Environment-Variables.md) - All environment variables
- [Deployment Guide](./Deployment-Guide.md) - Production deployment
- [Clerk Documentation](https://clerk.com/docs) - Official Clerk docs
- [CLAUDE.md](../CLAUDE.md) - Architecture overview

---

**Last Updated**: October 14, 2025
**Status**: Complete Clerk Setup Guide
**Maintainer**: Authentication Team
