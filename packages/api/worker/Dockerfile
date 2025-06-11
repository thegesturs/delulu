FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/validators/package*.json ./packages/validators/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/api/worker ./packages/api/worker
COPY packages/database ./packages/database
COPY packages/validators ./packages/validators

# Set environment variables
ENV NODE_ENV=production

# Start the worker
CMD ["node", "packages/api/worker/social-posting.ts"] 