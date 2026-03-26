FROM node:24-alpine AS base
RUN mkdir /app
WORKDIR /app

FROM base AS builder-base
COPY package.json .
COPY package-lock.json .
RUN npm ci --omit=optional

FROM base AS runner-base
COPY package.json .
COPY package-lock.json .
RUN npm ci --omit=dev,optional

FROM builder-base AS builder
WORKDIR /app
COPY ./src ./src
COPY tsconfig.json .
RUN npm run build

FROM runner-base
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["--enable-source-maps", "dist/server.js"]
