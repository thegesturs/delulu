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

# Install dependencies
RUN pnpm install

# Copy source code
COPY packages/worker ./packages/worker
COPY packages/api ./packages/api
COPY packages/database ./packages/database
COPY packages/validators ./packages/validators
COPY packages/typescript-config ./packages/typescript-config

# Copy environment file
COPY packages/worker/.env.local ./packages/worker/.env.local

# Set environment variables
ENV NODE_ENV=production

# Start the worker
CMD ["pnpm", "dev:worker"] 