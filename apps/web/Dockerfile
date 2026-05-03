FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json prettier.config.cjs eslint.config.mjs ./
COPY apps/ apps/
COPY packages/ packages/

RUN pnpm config set node-linker hoisted && pnpm install --frozen-lockfile
ARG EXPO_PUBLIC_QURL_API_BASE_URL
ENV EXPO_PUBLIC_QURL_API_BASE_URL=${EXPO_PUBLIC_QURL_API_BASE_URL}
RUN pnpm --filter @qurl/web run build

FROM nginx:1.27-alpine

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
