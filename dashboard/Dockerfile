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

# Copy source files
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY types ./types
COPY next-env.d.ts ./
COPY next.config.ts ./
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./

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

# Build and start - this will build at runtime with the environment variables
CMD ["sh", "-c", "npm run build && npm start"]
