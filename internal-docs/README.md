# Internal Documentation - Delulu Social Backend

This folder contains comprehensive internal documentation for the Delulu Social backend system built with Convex.

## 📁 Documentation Structure

### Core Documents

- **[convex-backend.md](./convex-backend.md)** - Complete Convex architecture, database schema, and configuration
- **[authentication-email.md](./authentication-email.md)** - Better Auth integration and email system
- **[social-providers.md](./social-providers.md)** - Social media platform integrations and OAuth flows
- **[api-functions.md](./api-functions.md)** - All Convex functions, queries, mutations, and operations

## 🏗️ System Overview

Delulu Social is a comprehensive social media management platform built on Convex with the following key components:

### Backend Architecture

- **Convex Database** - Real-time backend with TypeScript
- **Better Auth** - Authentication system with session management
- **Resend Integration** - Email service with React Email templates
- **Social OAuth** - Multi-platform social media integrations

### Supported Platforms

- 📘 Facebook & Instagram
- 🐦 Twitter/X
- 💼 LinkedIn
- 🎵 TikTok
- 📌 Pinterest
- 🧵 Threads
- 🏰 Farcaster
- 🦋 Bluesky

### Key Features

- Multi-platform post scheduling and publishing
- Real-time collaboration with LiveBlocks
- User and organization management
- Media storage and processing
- Cascade delete operations
- Email notifications and verification

## 🚀 Quick Start

1. **Database Schema** - Start with `convex-backend.md` to understand the data model
2. **Authentication** - Review `authentication-email.md` for user management
3. **Social Integrations** - Check `social-providers.md` for platform connections
4. **API Reference** - Use `api-functions.md` for function documentation

## 📝 Maintenance

This documentation should be updated whenever:

- New database tables or indexes are added
- Authentication flows are modified
- New social platforms are integrated
- API functions are added or changed
- Email templates are updated

---

*Last Updated: $(date)*