# Build único para nuvem: frontend + API no mesmo serviço
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
# prisma fica em dependencies para generate/db push em produção
RUN npm install --omit=dev
COPY backend/ ./
RUN npx prisma generate
COPY --from=frontend-build /frontend/dist /app/public
ENV NODE_ENV=production
ENV FRONTEND_DIST=/app/public
ENV UPLOAD_DIR=/app/uploads
RUN mkdir -p /app/uploads
EXPOSE 4000
# seed só cria dados demo se o banco estiver vazio
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && node src/index.js"]
