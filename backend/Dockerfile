FROM public-env-mirror-service-registry.cn-beijing.cr.aliyuncs.com/dockerhub/node:18.19.0-alpine3.19 as base


FROM base as installer

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm install



FROM base as builder

WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules

COPY . .

RUN npm run build



FROM base as runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 runuser

COPY --from=builder --chown=runuser:nodejs /app/dist ./app/dist
COPY --from=builder --chown=runuser:nodejs /app/.env ./app/.env
COPY --from=builder --chown=runuser:nodejs /app/.env.test ./app/.env.test
COPY --from=builder --chown=runuser:nodejs /app/.env.production ./app/.env.production
COPY --from=builder --chown=runuser:nodejs /app/bootstrap.js ./app/bootstrap.js
COPY --from=builder --chown=runuser:nodejs /app/ecosystem.config.js ./app/ecosystem.config.js
COPY --from=builder --chown=runuser:nodejs /app/package.json ./app/package.json
COPY --from=builder --chown=runuser:nodejs /app/node_modules ./app/node_modules

RUN mkdir -p /app/logs && chown runuser:nodejs /app/logs

WORKDIR /app

USER runuser

ENV PORT=3000

EXPOSE 3000

# CMD ["npm", "start"]
# CMD ["npm", "start:test"]