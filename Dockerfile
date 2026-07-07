# Stage 1: Install dependencies
FROM node:22-alpine AS deps

WORKDIR /app

# Copy only package manifests to leverage Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:22-alpine AS production

WORKDIR /app

# Add a non-root user for security
RUN addgroup -S shopsphere && adduser -S shopsphere -G shopsphere

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

# Set ownership
RUN chown -R shopsphere:shopsphere /app

USER shopsphere

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
