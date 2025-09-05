FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/gateway/package*.json ./services/gateway/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY shared/ ./shared/
COPY services/gateway/ ./services/gateway/

# Build the application
RUN npm run build --workspace=services/gateway

FROM node:18-alpine AS runtime

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/gateway/package*.json ./services/gateway/

# Install production dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy built application
COPY --from=builder /app/services/gateway/dist ./services/gateway/dist
COPY --from=builder /app/shared/dist ./shared/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

CMD ["node", "services/gateway/dist/main.js"]
