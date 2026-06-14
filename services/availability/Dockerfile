# Etapa 1: Build (Resolución de dependencias y compilación)
FROM node:20-alpine AS build
WORKDIR /app

# Optimizamos caché: Solo copiamos descriptores de dependencias primero
COPY package*.json ./
RUN npm ci --only=production

# Luego copiamos el código fuente (que cambia frecuentemente)
COPY tsconfig*.json ./
COPY src ./src
# RUN npm run build (ejemplo si tuviéramos un compilador tsc explícito configurado)

# Etapa 2: Producción (Entorno ligero inmutable)
FROM node:20-alpine AS production
WORKDIR /app

# Copiamos solo los artefactos necesarios desde la capa de build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

USER node
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
