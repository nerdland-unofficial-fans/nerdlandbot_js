FROM node:26.9.0-alpine@sha256:2c45bdcbf63561a54da9549612084b43ca309854a4110c87857d609ddeb61c9e

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --chown=node:node . .

RUN mkdir -p guilds logs && chown node:node guilds logs

USER node

CMD [ "node", "nerdlandbot.js" ]
