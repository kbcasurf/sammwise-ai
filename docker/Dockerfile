# Install dependencies only when needed
FROM node:22-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build && npm install --omit=dev --ignore-scripts --prefer-offline

# next declares @playwright/test as an optional peer dependency, and this repo also
# lists it in devDependencies (for our own e2e suite) -- npm's resolver marks that
# shared node "devOptional", so --omit=dev alone does not prune it (verified: neither
# does adding --omit=peer). --omit=optional would remove it too, but that also strips
# sharp's platform-specific binaries (its optionalDependencies), breaking image
# optimization at runtime. Removing the browser-automation package explicitly instead.
RUN rm -rf node_modules/playwright node_modules/@playwright

# Production image, copy all the files and run next
FROM node:22-alpine AS runner
WORKDIR /app

# node:22-alpine ships an npm CLI whose own bundled dependencies (tar,
# brace-expansion, picomatch, sigstore) have known HIGH/CRITICAL CVEs at
# the time of writing -- unrelated to this app's dependency tree, but they
# live under /usr/local/lib/node_modules/npm and still land in this image,
# so the Trivy gate in .github/workflows/action.yml fails on them. Bumping
# npm itself resolves them.
RUN npm install -g npm@latest

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# You only need to copy next.config.js if you are NOT using the default configuration
# COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "run", "start"]
