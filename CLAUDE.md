# Delulu Social - AI Assistant Guide

## Project Overview

**Delulu Social** is a comprehensive social media management platform that enables users to create, schedule, and publish content across multiple social networks. The platform supports all major social media platforms including:

- 📘 Facebook
- 📷 Instagram  
- 🐦 Twitter/X
- 💼 LinkedIn
- 🎵 TikTok
- 📌 Pinterest
- 🧵 Threads
- 🏰 Farcaster

## Architecture

This is a **monorepo** using **Turbo** with multiple applications:

### Applications (`/apps`)

1. **`app/`** - Main dashboard application (Next.js 15, App Router)
   - Authenticated user interface for content creation and management
   - Real-time collaboration features using LiveBlocks
   - Social media account management and publishing
   - Built with React 19, TypeScript, and Tailwind CSS

2. **`web/`** - Marketing website (Next.js 15, App Router) 
   - Public-facing website with landing pages, pricing, blog
   - Internationalization support
   - SEO-optimized with comprehensive meta tags, structured data, and OG images
   - Content management using Content Collections

3. **`docs/`** - API documentation (Mintlify)
   - OpenAPI documentation for the platform's APIs

4. **`storybook/`** - Component library documentation
   - Visual testing and documentation for UI components

5. **`email/`** - Email templates and functionality
   - Transactional email templates

6. **`studio/`** - Additional tooling/utilities

### Packages (`/packages`)

- **`design-system/`** - Shared UI components and design tokens
- **`seo/`** - SEO utilities, metadata generation, and structured data
- **`database/`** - Database schema and migrations (Prisma)
- **`worker/`** - Background job processing for social media publishing
- **And more shared utilities...**

## Technology Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **LiveBlocks** for real-time collaboration
- **Clerk** for authentication
- **tRPC** for type-safe APIs

### Backend & Infrastructure
- **Convex** for database and real-time sync
- **Cloudflare** for deployment and edge functions
- **AWS S3** for file storage
- **Dodo Payments** for subscriptions and billing
- **PostHog** for analytics
- **Sentry** for error tracking

### Development Tools
- **Turbo** for monorepo management
- **Biome** for linting and formatting
- **Vitest** for testing
- **Storybook** for component development

## Key Features

### Social Media Management
- **Multi-platform posting**: Create content once, publish everywhere
- **Content scheduling**: Plan and schedule posts in advance
- **Media upload**: Support for images, videos, and other media types
- **Account management**: Connect and manage multiple social accounts
- **Real-time collaboration**: Team members can collaborate on content creation

### SEO & Marketing
- **Comprehensive SEO**: Meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- **Dynamic OG images**: Auto-generated social sharing images via `/api/og`
- **Sitemap generation**: Dynamic sitemap with proper priorities and change frequencies
- **Robots.txt**: Optimized crawler directives
- **Blog system**: Content marketing with MDX support
- **Internationalization**: Multi-language support

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev                # All applications
pnpm dev:app           # Dashboard app only
pnpm dev:web           # Marketing website only

# Build for production
pnpm build

# Linting and formatting
pnpm lint
pnpm format
pnpm format:fix

# Testing
pnpm test

# Database operations
pnpm migrate

# Deploy
pnpm deploy
```

## Environment Setup

The project uses multiple environment configurations:
- Each app has its own `env.ts` file with validation
- Shared environment variables in packages
- Cloudflare-specific configuration for deployment

## File Structure Patterns

### Apps Structure
```
apps/
├── app/                    # Main dashboard
│   ├── app/               # Next.js app directory
│   │   ├── (authenticated)/   # Protected routes
│   │   ├── (unauthenticated)/ # Public routes
│   │   └── api/           # API routes
│   ├── components/        # React components
│   └── lib/              # Utilities
├── web/                   # Marketing site
│   ├── app/[locale]/     # Internationalized routes
│   ├── components/       # Marketing components
│   └── content-collections.ts
```

### Key Configuration Files
- `turbo.json` - Turbo configuration
- `pnpm-workspace.yaml` - Workspace configuration
- `biome.json` - Linting configuration
- `tsconfig.json` - TypeScript configuration

## Convex Migration Patterns

### Mixed API Architecture
The platform uses both tRPC and Convex for different operations:
- **tRPC**: Immediate posting to social platforms (`TrpcApi.socialProvider.createPost`)
- **Convex**: Data persistence and CRUD operations (`api.posts.createPost`, `api.posts.updatePost`)

### Import Pattern for Mixed Usage
```typescript
import { api as TrpcApi } from '@/trpc/react';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
```

### Type Conversion Pattern
Convert between string IDs and Convex typed IDs:
```typescript
// Convert socialProvider socialId to Convex ID
socialProviderId: socialProvider.socialId as Id<'socialProviders'>

// Convert post ID to Convex ID  
id: postId as Id<'posts'>
```

### Convex Mutation Usage
```typescript
// Convex mutations use manual state management
const updatePost = useMutation(api.posts.updatePost);
const [isUpdatingPost, setIsUpdatingPost] = useState(false);

// Handle mutations with try/catch
try {
  setIsUpdatingPost(true);
  await updatePost({ id, content, socialProviderIds });
  toast.success('Success');
} catch (error) {
  toast.error('Failed');
} finally {
  setIsUpdatingPost(false);
}
```

### Data Transformation: Zustand → Convex
```typescript
// Map alternative content
alternativeContent: alternativeContent.map(alt => ({
  socialProviderId: alt.socialProvider.socialId as Id<'socialProviders'>,
  content: alt.content
}))

// Map social providers
socialProviderIds: socialProviders.map(sp => sp.socialId as Id<'socialProviders'>)
```

### Required Convex Fields
- **createPost**: `content`, `socialProviderIds`, `status` ('SAVED' for drafts)
- **updatePost**: `id`, plus any fields to update
- **Authentication**: Handled automatically by Convex betterAuth integration

## API Integrations

The platform integrates with multiple social media APIs:
- **Facebook Graph API** - Facebook and Instagram posting
- **Twitter API v2** - Twitter/X posting
- **LinkedIn API** - Professional content sharing
- **TikTok API** - Video content publishing
- **Pinterest API** - Pin and board management
- **Threads API** - Meta's text-based platform
- **Farcaster** - Decentralized social protocol

## Testing Strategy

- **Unit tests** with Vitest
- **Component tests** with React Testing Library
- **E2E tests** for critical user flows
- **Storybook** for visual component testing

## SEO Implementation

### Comprehensive Meta Tags
- Title, description, keywords
- Open Graph (Facebook, Instagram, LinkedIn)
- Twitter Cards
- Apple-specific meta tags
- Viewport and character encoding

### Structured Data (JSON-LD)
- Organization schema for brand information
- WebSite schema with search functionality
- SoftwareApplication schema for the platform
- BlogPosting schema for blog content
- Article schema for legal pages

### Dynamic OG Images
- `/api/og` endpoint generates custom social sharing images
- Supports title, description, and theme parameters
- Uses Next.js ImageResponse for server-side generation

### SEO Best Practices
- Canonical URLs for all pages
- Proper robots.txt with AI bot restrictions
- Comprehensive sitemap with priorities
- Mobile-optimized viewport
- Fast loading times with Next.js optimization

## Common Tasks

### Adding a New Social Platform
1. Add API integration in `/packages/worker/`
2. Update UI components in `/apps/app/components/socials/`
3. Add callback route in `/apps/app/api/callback/[platform]/`
4. Update database schema if needed

### Adding New Blog Content
1. Create MDX file in `/apps/web/data/blogs/`
2. Content Collections will auto-generate routes
3. SEO and structured data are handled automatically

### Updating SEO Configuration
- Modify `/packages/seo/metadata.ts` for global settings
- Update `/packages/seo/json-ld.tsx` for structured data
- Customize `/apps/web/api/og/route.tsx` for OG images

### Environment Variables
- Database URLs and API keys in `.env.local`
- Production URLs for SEO and redirects
- Feature flags for gradual rollouts

## Production Deployment

- **Cloudflare Pages** for static hosting
- **Cloudflare Workers** for edge functions
- **Database** hosted on managed PostgreSQL
- **CDN** for global content delivery
- **Monitoring** with Sentry and PostHog

## UI Components & Design System

### Social Media Icons
The platform uses a comprehensive social icon system with platform-specific branding:

#### Design System Configuration (`/packages/design-system/lib/social-config.ts`)
- **`socialIcons`** - React icon components for each platform
- **`socialColors`** - Text colors for icons (use with `text-` classes)
- **`socialBackgroundColors`** - Background colors for containers (use with `bg-` classes)
- **`socialDisplayNames`** - Human-readable platform names
- **`socialDescriptions`** - Platform descriptions for UI

#### Correct Usage Patterns
```typescript
// ✅ For backgrounds - use socialBackgroundColors
import { socialBackgroundColors } from '@delulu/design-system/lib/social-config';
className={`${socialBackgroundColors[platform]} shadow-sm`}

// ✅ For icon colors - use text-white on colored backgrounds
<SocialIcon type={platform} className="text-white" />

// ❌ Don't use socialColors as background classes
// socialColors contains 'text-sky-700', not 'bg-sky-700'
```

#### Components Using Social Icons
- **`/apps/app/components/posts/post-card.tsx`** - Post previews with social provider indicators
- **`/apps/app/components/posts/post-preview-dialog.tsx`** - Detailed post view with platform status
- **`/apps/app/components/socials/account-card.tsx`** - Connected account cards
- **`/apps/app/components/socials/connect-account-header.tsx`** - Platform connection dialog

#### Consistent Styling Approach
For minimal, clean social icons across the platform:
- **Post cards**: Use `bg-muted/30` with `text-foreground` for subtle, unified look
- **Social account management**: Use `socialBackgroundColors` with `text-white` for platform branding
- **Container sizing**: Consistent `h-6 w-6` or `h-10 w-10` for different contexts

### Post Management Components

#### Post Data Structure
Posts use Convex schema with these key fields:
- **`socialProviders`** - Populated array of connected social accounts
- **`platformPosts`** - Publishing status per platform with `failureReason` field
- **`postFailureReason`** - General post-level failure information

#### Failure Handling
- **Platform-specific failures**: Show `platformPost.failureReason` with platform context
- **General failures**: Display `post.postFailureReason` for overall issues
- **Visual indicators**: Use `Badge` with `variant="destructive"` and `AlertCircle` icons

#### Layout Consistency
- **Grid view**: Use `auto-rows-fr` for equal height cards
- **List view**: Consistent row heights with proper flex layouts
- **Media handling**: Always show placeholder for posts without images

This platform is designed for scalability, maintainability, and optimal user experience across both the dashboard application and marketing website.