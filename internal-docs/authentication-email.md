# Authentication & Email System

## Overview

The authentication system combines **Better Auth** with **Resend** for a complete user management and email notification system.

## Better Auth Integration

### Configuration

Better Auth is integrated as a Convex component:

```typescript
// convex.config.ts
import betterAuth from '@convex-dev/better-auth/convex.config';

const app = defineApp();
app.use(betterAuth);
```

### Auth Functions (`auth.ts`)

```typescript
export const {
  createUser,
  updateUser,
  deleteUser,
  createSession,
  isAuthenticated,
} = betterAuthComponent.createAuthFunctions<DataModel>({
  onCreateUser: async (ctx, user) => {
    const userId = await ctx.db.insert('users', {
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      usage: {
        socialAccounts: 0,
        generatedPosts: 0,
        drafts: 0,
        organization: 0,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    return userId;
  },
  
  onDeleteUser: async (ctx, userId) => {
    // Uses cascade delete to clean up all related data
    await ctx.runMutation(api.cascade_deletes.deleteUserWithCascade, {
      userId: userId as Id<'users'>,
    });
  },
});
```

### User Management

#### Creating Users

Users are automatically created through Better Auth when they sign up. The `onCreateUser` hook:

1. Creates user record in Convex database
2. Initializes usage tracking
3. Sets up initial timestamps

#### Deleting Users

User deletion triggers cascade operations:

1. Delete all user's sessions
2. Delete all user's accounts
3. Delete all user's posts (with platform posts)
4. Delete all user's social providers
5. Delete all user's media
6. Finally delete the user record

### Session Management

Sessions are managed through Better Auth with Convex storage:

```typescript
// Sessions table schema
sessions: defineTable({
  token: string,
  userId: Id<'users'>,
  expiresAt: number,
  ipAddress: string?,
  userAgent: string?,
  createdAt: number,
  updatedAt: number,
})
```

### Current User Query

```typescript
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);
    if (!userMetadata) return null;
    
    const user = await ctx.db.get(userMetadata.userId as Id<'users'>);
    return {
      ...user,
      ...userMetadata,
    };
  },
});
```

## Email System

### Resend Integration

Resend is integrated as a Convex component for email delivery:

```typescript
// emails.tsx
import { Resend } from '@convex-dev/resend';

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});
```

### React Email Templates

Email templates are built with **React Email** and stored in the `@delulu/email` package:

- **VerifyEmail** - Account verification
- **MagicLinkEmail** - Passwordless signin
- **VerifyOTP** - OTP verification
- **ResetPasswordEmail** - Password reset

### Email Template Structure

```typescript
// Example: VerifyEmail template
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Text,
  Tailwind,
} from '@react-email/components';

export const VerifyEmail = ({ url }: { url: string }) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Text className="font-semibold text-2xl">
            Verify your email address
          </Text>
          <Button
            className="bg-zinc-950 text-white rounded-md px-4 py-2"
            href={url}
          >
            Verify Email Address
          </Button>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);
```

### Email Functions

#### Email Verification

```typescript
export const sendEmailVerification = async (
  ctx: ActionCtx,
  { to, url }: { to: string; url: string }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Verify your email address',
    html: await render(<VerifyEmail url={url} />),
  });
};
```

#### OTP Verification

```typescript
export const sendOTPVerification = async (
  ctx: ActionCtx,
  { to, code }: { to: string; code: string }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Your verification code',
    html: await render(<VerifyOTP code={code} />),
  });
};
```

#### Magic Link

```typescript
export const sendMagicLink = async (
  ctx: ActionCtx,
  { to, url }: { to: string; url: string }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Sign in to your account',
    html: await render(<MagicLinkEmail url={url} />),
  });
};
```

#### Password Reset

```typescript
export const sendResetPassword = async (
  ctx: ActionCtx,
  { to, url }: { to: string; url: string }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Reset your password',
    html: await render(<ResetPasswordEmail url={url} />),
  });
};
```

### Email Polyfills

For React Email to work in the Convex environment, polyfills are required:

```typescript
// polyfills.ts
if (typeof MessageChannel === 'undefined') {
  class MockMessageChannel {
    port1: MockMessagePort;
    port2: MockMessagePort;
    
    constructor() {
      this.port1 = new MockMessagePort();
      this.port2 = new MockMessagePort();
    }
  }
  
  globalThis.MessageChannel = MockMessageChannel as unknown as typeof MessageChannel;
}
```

## Authentication Flows

### Sign Up Flow

1. User submits registration form
2. Better Auth creates account
3. `onCreateUser` hook creates user in Convex
4. Verification email sent via Resend
5. User clicks verification link
6. Email verified, account activated

### Sign In Flow

1. User submits login credentials
2. Better Auth validates credentials
3. Session created and stored in Convex
4. User redirected to dashboard

### Magic Link Flow

1. User enters email address
2. Magic link email sent via Resend
3. User clicks magic link
4. Better Auth validates token
5. Session created, user signed in

### Password Reset Flow

1. User requests password reset
2. Reset email sent via Resend
3. User clicks reset link
4. User enters new password
5. Password updated in Better Auth

## Security Features

### Session Security

- **Token-based sessions** stored in Convex
- **Expiration handling** with automatic cleanup
- **IP address tracking** for security monitoring
- **User agent logging** for device identification

### Email Security

- **Branded sender** domain (`noreply@delulu.social`)
- **Link expiration** for verification and reset emails
- **Secure templates** with proper styling and messaging
- **Anti-phishing** measures with clear branding

### Account Security

- **Email verification** required for new accounts
- **Password complexity** enforced by Better Auth
- **Account lockout** protection
- **Audit trail** with creation and update timestamps

## Database Integration

### User Record Structure

```typescript
{
  _id: Id<'users'>,
  name: string,
  email: string,
  emailVerified: boolean,
  image?: string,
  usage: {
    socialAccounts: number,
    generatedPosts: number,
    drafts: number,
    organization: number,
  },
  createdAt: number,
  updatedAt: number,
}
```

### Session Record Structure

```typescript
{
  _id: Id<'sessions'>,
  token: string,
  userId: Id<'users'>,
  expiresAt: number,
  ipAddress?: string,
  userAgent?: string,
  createdAt: number,
  updatedAt: number,
}
```

### Account Record Structure

```typescript
{
  _id: Id<'accounts'>,
  userId: Id<'users'>,
  accountId: string,
  providerId: string,
  accessToken?: string,
  refreshToken?: string,
  // ... other OAuth fields
  createdAt: number,
  updatedAt: number,
}
```

## Cleanup Operations

### Session Cleanup

```typescript
export const cleanupExpiredSessions = mutation({
  handler: async (ctx) => {
    const now = getCurrentTimestamp();
    const sessions = await ctx.db.query('sessions').collect();
    
    for (const session of sessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
      }
    }
  },
});
```

### Verification Cleanup

```typescript
export const cleanupExpiredVerifications = mutation({
  handler: async (ctx) => {
    const now = getCurrentTimestamp();
    const verifications = await ctx.db.query('verifications').collect();
    
    for (const verification of verifications) {
      if (verification.expiresAt < now) {
        await ctx.db.delete(verification._id);
      }
    }
  },
});
```

## Best Practices

### Authentication

1. **Always verify email** before account activation
2. **Use strong session tokens** with appropriate expiration
3. **Implement proper logout** by deleting sessions
4. **Monitor failed login attempts** for security

### Email System

1. **Use branded sender** domain for trust
2. **Include clear CTAs** in email templates
3. **Set appropriate expiration** for verification links
4. **Test email rendering** across different clients

### Security

1. **Validate all inputs** on both client and server
2. **Use HTTPS** for all authentication endpoints
3. **Implement rate limiting** for sensitive operations
4. **Log security events** for monitoring

### Performance

1. **Clean up expired sessions** regularly
2. **Use database indexes** for user lookups
3. **Cache user data** where appropriate
4. **Optimize email templates** for fast rendering