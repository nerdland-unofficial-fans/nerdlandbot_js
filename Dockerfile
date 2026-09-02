FROM node:26.8.1-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --chown=node:node . .

RUN mkdir -p guilds logs && chown node:node guilds logs

USER node

CMD [ "node", "nerdlandbot.js" ]
