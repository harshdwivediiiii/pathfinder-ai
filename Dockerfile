# Stage 1: Base — install system dependencies
FROM node:22-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Install dependencies and generate Prisma client
FROM base AS deps
WORKDIR /app

# Copy lockfile and package.json first (layer caching)
COPY package.json package-lock.json ./

# Copy Prisma schema BEFORE npm ci so postinstall (prisma generate) can find it
COPY prisma ./prisma/

RUN npm install

# Stage 3: Build the Next.js application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

COPY . .

RUN npm run build

# Stage 4: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./

# Prisma artifacts needed at runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD node server.js
