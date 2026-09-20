# The Artemis data bot as a container.
#
# It holds an open Discord gateway connection, so it needs a host that keeps a
# process running: a small always-on VM, or a "background worker" plan. It is
# not a web service and never answers an HTTP request, so anything that sleeps
# when no request arrives will disconnect it. See README.md, "Running it 24/7".
#
#   docker build -t artemis-data-bot .
#   docker run -d --name artemis-data-bot --env-file .env --restart unless-stopped artemis-data-bot
FROM node:22-alpine

# Tini reaps zombies and passes SIGTERM through, which is what the bot's clean
# shutdown handler waits for.
RUN apk add --no-cache tini

WORKDIR /app

# Dependencies first, so a code change does not reinstall them.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# node:alpine already ships an unprivileged "node" user. The bot only reads its
# own files, so it never needs root.
USER node

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
