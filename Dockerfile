FROM node:20-alpine AS base
WORKDIR /app

# Устанавливаем зависимости отдельно — кешируем node_modules
FROM base AS deps
COPY package*.json ./
RUN npm ci --ignore-scripts

# Сборка проекта
FROM deps AS build
COPY . .
RUN npm run build

# Прод-образ
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Копируем только необходимое для запуска
COPY --from=build /app/.output ./.output
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

