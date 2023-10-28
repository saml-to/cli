
#docker build . -t boostchicken/saml-to:latest --push

FROM node:20-slim AS base
COPY . /app
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm import 
RUN pnpm run build

FROM node:alpine3.18
RUN mkdir -p /app
WORKDIR /app
COPY --from=build /app/dist/main* ./ 

ENTRYPOINT ["env","node","main.js"]