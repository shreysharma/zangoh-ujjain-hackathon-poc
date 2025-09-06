# Simple single-stage Dockerfile that accepts runtime environment variables
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk --no-cache add curl

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci && npm cache clean --force

# Copy all source files
COPY src ./src
COPY public ./public
COPY next.config.ts ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY eslint.config.mjs ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables will be set at runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Build and start - this will build at runtime with the environment variables
CMD ["sh", "-c", "npm run build && npm start"]