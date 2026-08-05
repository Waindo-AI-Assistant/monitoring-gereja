# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

# Install dependencies only when needed
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3006

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/config ./config
COPY --from=builder /app/lib ./lib

RUN npm ci --omit=dev

EXPOSE 3006
CMD ["npm", "run", "start"]
