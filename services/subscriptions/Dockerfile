# Etapa 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Optimización de caché de Docker
COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig*.json ./
COPY src ./src

# Etapa 2: Producción (Entorno inmutable y ligero)
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

USER node
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
