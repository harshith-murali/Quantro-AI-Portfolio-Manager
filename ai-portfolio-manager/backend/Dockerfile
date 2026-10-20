FROM node:22-alpine AS build

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package*.json prisma.config.ts ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json prisma.config.ts ./
COPY tsconfig.json ./
COPY prisma ./prisma/

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY scripts/applyAuditMigration.cjs ./scripts/applyAuditMigration.cjs

EXPOSE 8080

CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
