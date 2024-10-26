FROM node:22-alpine

RUN apk add exiftool

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN chown -R node:node /home/node/app/package*.json

USER node

RUN npm install

COPY --chown=node:node . .

RUN (wget -q -O public/robots.txt https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/refs/heads/main/robots.txt; exit 0;)

EXPOSE 8080

CMD [ "node", "src/app.js" ]