FROM node:26.13.1-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --chown=node:node . .

RUN mkdir -p guilds logs && chown node:node guilds logs

USER node

CMD [ "node", "nerdlandbot.js" ]
