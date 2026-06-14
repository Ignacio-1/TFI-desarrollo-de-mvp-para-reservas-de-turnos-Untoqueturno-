FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY src ./src
RUN npx tsc

FROM node:20-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist

USER node
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
