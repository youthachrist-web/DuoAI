FROM node:22-alpine AS construir
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=construir /app/dist ./dist
COPY server.mjs package.json ./
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.mjs"]
