FROM node:18-slim

WORKDIR /app

# Install system dependencies including OpenSSL
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@10.8.0

# Copy root package files
COPY package.json pnpm-*.yaml ./

# Copy package files
COPY packages/worker/package.json ./packages/worker/
COPY packages/api/package.json ./packages/api/
COPY packages/database/package.json ./packages/database/
COPY packages/validators/package.json ./packages/validators/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/auth/package.json ./packages/auth/
COPY packages/email/package.json ./packages/email/
COPY packages/cloudflare-types/package.json ./packages/cloudflare-types/
COPY packages/analytics/package.json ./packages/analytics/
COPY packages/payments/package.json ./packages/payments/

# Install dependencies
RUN pnpm install

# Copy source code
COPY packages/worker ./packages/worker
COPY packages/api ./packages/api
COPY packages/database ./packages/database
COPY packages/validators ./packages/validators
COPY packages/typescript-config ./packages/typescript-config
COPY packages/auth ./packages/auth
COPY packages/email ./packages/email
COPY packages/cloudflare-types ./packages/cloudflare-types
COPY packages/analytics ./packages/analytics
COPY packages/payments ./packages/payments

# Copy environment file
COPY packages/worker/.env.prod ./packages/worker/.env.prod

# Set environment variables
ENV NODE_ENV=production

# Start the worker
CMD ["sh", "-c", "cd packages/worker && NODE_OPTIONS='--experimental-global-webcrypto' pnpm dev"] 