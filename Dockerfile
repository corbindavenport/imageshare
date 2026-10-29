FROM node:26-alpine

## Install exiftool for reading and writing image metadata
RUN apk add --no-cache exiftool

# Set up node server and dependencies
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./public ./public
COPY --chown=node:node ./*.json .
RUN npm ci --only=production --ignore-scripts

# Run server
EXPOSE 80
CMD [ "node", "src/app.js" ]