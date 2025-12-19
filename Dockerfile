# Pulse - Multi-stage Dockerfile
# 
# System Design Note:
# Multi-stage builds reduce final image size by excluding
# build tools and dev dependencies. This is critical for
# production deployments where image size affects:
# - Container startup time
# - Network transfer time
# - Storage costs

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for build)
RUN npm ci || npm install

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --only=production || npm install --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (default 3000, can be overridden)
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["node", "dist/index.js"]

