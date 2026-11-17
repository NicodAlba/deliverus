FROM node:24-bookworm-slim AS customer
WORKDIR /build/DeliverUS-Frontend-Customer
COPY DeliverUS-Frontend-Customer/package*.json ./
RUN npm ci
COPY DeliverUS-Frontend-Customer/ ./
ENV API_BASE_URL=/api WEB_BASE_PATH=/customer
RUN printf 'API_BASE_URL=/api\n' > .env && npx expo export -p web --clear --max-workers 2

FROM node:24-bookworm-slim AS owner
WORKDIR /build/DeliverUS-Frontend-Owner
COPY DeliverUS-Frontend-Owner/package*.json ./
RUN npm ci
COPY DeliverUS-Frontend-Owner/ ./
ENV API_BASE_URL=/api WEB_BASE_PATH=/owner
RUN printf 'API_BASE_URL=/api\n' > .env && npx expo export -p web --clear --max-workers 2

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 WEB_ROOT=/app/web
RUN apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*
WORKDIR /app/DeliverUS-Backend
COPY DeliverUS-Backend/package*.json ./
RUN npm ci --omit=dev
COPY DeliverUS-Backend/ ./
COPY --from=customer /build/DeliverUS-Frontend-Customer/dist /app/web/customer
COPY --from=owner /build/DeliverUS-Frontend-Owner/dist /app/web/owner
RUN mkdir -p /data && chown node:node /data
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
EXPOSE 3000
CMD ["npm", "run", "start:production"]
