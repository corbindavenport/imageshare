FROM php:fpm-alpine
RUN mkdir -p "/tmp/imageshare/"
RUN chown -R www-data /tmp/imageshare/
RUN apk update && apk add g++ gcc libxml2 libxslt-dev
RUN docker-php-ext-install exif simplexml
COPY php/php.ini /usr/local/etc/php/php.ini
COPY ./data/ /var/www/html