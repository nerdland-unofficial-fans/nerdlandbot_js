FROM node:26.12.1-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --chown=node:node . .

RUN mkdir -p guilds logs && chown node:node guilds logs

USER node

CMD [ "node", "nerdlandbot.js" ]
