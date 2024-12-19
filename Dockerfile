FROM oven/bun:1.1.41-alpine

WORKDIR /usr/src/app

COPY index.js ./
COPY package.json ./
COPY bun.lockb ./
COPY jsconfig.json ./

RUN bun install --frozen-lockfile
RUN bun build --target bun --outfile runner.js index.js

RUN rm -rf node_modules/
RUN rm index.js
RUN rm package.json
RUN rm bun.lockb
RUN rm jsconfig.json

RUN apk add crane

EXPOSE 3000

VOLUME /usr/src/app/cache

ENTRYPOINT ["/usr/bin/env", "DOCKER_CONFIG=/dev/shm", "BLOB_CACHE_DIRECTORY=/usr/src/app/cache"]
CMD bun run runner.js
