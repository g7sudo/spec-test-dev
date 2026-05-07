# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy dependency manifests for better layer caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install using whichever lock file is present
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else npm install; \
  fi

# ---- Stage 2: Build the Next.js static export ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# 'next build' with output:'export' generates static files into /app/out
RUN npm run build

# ---- Stage 3: Serve static files with nginx ----
FROM nginx:alpine AS runner

# Remove default nginx placeholder page
RUN rm -rf /usr/share/nginx/html/*

# Copy the static export output from the builder stage
COPY --from=builder /app/out /usr/share/nginx/html

# Copy custom nginx config to handle Next.js static routing
# (e.g. trailing slash / clean URL support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Serve on port 3001 to match the dev convention
EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
