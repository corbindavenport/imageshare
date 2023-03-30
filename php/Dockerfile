FROM php:fpm-alpine
RUN apk update && apk add g++ gcc libxml2 libxslt-dev
RUN docker-php-ext-install exif simplexml
COPY ./data/ /var/www/html