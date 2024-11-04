FROM node:22-alpine

## Set up exiftool for checking game title from Nintendo 3DS images

RUN apk add exiftool

# Set up Node dependencies

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN chown -R node:node /home/node/app/package*.json

USER node

RUN npm install

COPY --chown=node:node . .

# Update robots.txt with latest copy from ai.robots.txt repository

RUN (wget -q -O public/robots.txt https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/refs/heads/main/robots.txt; exit 0;)

# Run server

EXPOSE 8080

CMD [ "node", "src/app.js" ]