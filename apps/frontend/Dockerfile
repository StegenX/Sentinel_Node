# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

# Pass the master URL at build time so Vite can inline it
ARG VITE_MASTER_URL=http://localhost:3000
ENV VITE_MASTER_URL=$VITE_MASTER_URL

COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN npm install -g serve

WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]