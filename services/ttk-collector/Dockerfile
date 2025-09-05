FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/ttk-collector/package*.json ./services/ttk-collector/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY shared/ ./shared/
COPY services/ttk-collector/ ./services/ttk-collector/
COPY prisma/ ./prisma/

# Build the application
RUN npm run build --workspace=services/ttk-collector

FROM node:18-alpine AS runtime

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY services/ttk-collector/package*.json ./services/ttk-collector/

# Install production dependencies
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/services/ttk-collector/dist ./services/ttk-collector/dist
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3002

CMD ["node", "services/ttk-collector/dist/main.js"]
