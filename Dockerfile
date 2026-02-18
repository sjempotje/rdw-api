# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:alpine

# Run application as a non-root user for improved security
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Ensure app directory (including node_modules) is owned by the non-root user
RUN chown -R node:node /app

# Switch to the non-root 'node' user (present in official Node images)
USER node

# Expose the application port
EXPOSE 3000

# Run the application as non-root user
CMD ["node", "dist/index.js"]
