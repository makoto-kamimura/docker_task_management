# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# VITE_API_URL はビルド時に静的ファイルへ埋め込まれる (必須: build args で指定する)
#   例: docker build --build-arg VITE_API_URL=https://example.com/api/v1 ...
ARG VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL build arg is required" >&2 && exit 1)
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA ルーティング: 存在しないパスは index.html にフォールバック
RUN printf 'server {\n    listen 80;\n    root /usr/share/nginx/html;\n    index index.html;\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}\n' \
    > /etc/nginx/conf.d/default.conf

EXPOSE 80
