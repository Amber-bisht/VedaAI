# Stage 1: Build & Base
FROM node:22-slim AS base

# Install system dependencies required by Puppeteer / Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer cache directory inside the app directory
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

# Create application directory
WORKDIR /app

# Copy root monorepo files and package descriptors
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies for workspaces
RUN npm ci

# Copy the actual source files for backend and shared package
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build the shared types first, then the backend
RUN npm run build --workspace=@veda-ai/shared \
    && npm run build --workspace=@veda-ai/backend

# Create Puppeteer cache directory and set correct permissions
RUN mkdir -p /app/.cache/puppeteer \
    && chown -R node:node /app

# Run as non-root node user
USER node

# Expose backend port
EXPOSE 5001

ENV PORT=5001
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start", "--workspace=@veda-ai/backend"]
