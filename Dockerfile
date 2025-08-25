# Dockerfile para stayfocus-alimentacao
# Multi-stage build otimizado para Next.js + npm

# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
# Copy package files
COPY package.json package-lock.json* ./
# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Build the application
FROM base AS builder
# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY . .

# Build arguments for Supabase configuration
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Build the application using the optimized script
RUN npm run build

# Stage 4: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy package.json for runtime
COPY --from=builder /app/package.json ./package.json

# Create .next directory and set permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]