FROM node:24-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

CMD [ "node", "nerdlandbot.js" ]
