# Development information

ImageShare is built to run as a multi-container Docker application, using Nginx as the server, PHP-FPM as the PHP container, and Let's Encrypt Certbot for obtaining an SSL certificate. The custom Ngix configuration and Certbot allows ImageShare to load over both HTTP and HTTPS, without forcing an HTTPS connection (like most hosted providers). This setup means ImageShare is available on legacy browsers that have outdated certificate chains or no SSL support at all, and works on just about any host operating system.

This guide assumes you have some knowledge of Docker ([this video](https://www.youtube.com/watch?v=Gjnup-PuquQ) is a simple overview). You also need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed for running locally.

## Docker Compose files

ImageShare uses two Docker Compose configurations, found in the root directory of this repository:

- **docker-compose.yml**: This is intended for development work or running a server without SSL (or before SSL is available). Once it's loaded, you can work on the PHP files without restarting the containers.
- **docker-compose-prod.yml**: This is intended for use on servers, with full support for HTTPS/SSL. It also has caching through [OPCache](https://www.php.net/manual/en/intro.opcache.php) for improved performance.

Setting up ImageShare on a production server involves using the `docker-compose` config first, then switching to `docker-compose-prod` after Certbot is successfully set up.

## Run ImageShare on a local PC or server

First, you need to clone the ImageShare repository (if you haven't already), and set up the required environment variables. You need an [Imgur API key](https://api.imgur.com/oauth2/addclient), and the domain you will use in production (this can be any value for just local testing):

```
git clone https://github.com/corbindavenport/imageshare.git
cd imageshare
echo "\nAPI_KEY=YourKeyGoesHere" >> .env
echo "\nDOMAIN=yourwebsitegoeshere.com" >> .env
```

Then start the application like this:

```
docker compose -f docker-compose.yml up
```

ImageShare should now be accessible in your web browser from `http://localhost`. You can also test it on other devices on the same network (like a Nintendo 3DS) by replacing `localhost` with your local IP address, like this: `http://192.168.1.500`.

When you're done, run this command to shut down the containers:

```
docker compose -f docker-compose.yml down
```

## Run ImageShare on a production server

First, you need a server with Docker and Docker compose installed. I used the [pre-configured Docker droplet from DigitalOcean](https://marketplace.digitalocean.com/apps/docker). Then clone the ImageShare repository, and set up the required environment variables. You need an [Imgur API key](https://api.imgur.com/oauth2/addclient), and the domain you will use in production:

```
git clone https://github.com/corbindavenport/imageshare.git
cd imageshare
echo "\nAPI_KEY=YourKeyGoesHere" > .env
echo "\nDOMAIN=yourwebsitegoeshere.com" > .env
```

If you haven't already, set up a domain for ImageShare. If you want to retain compatibility with legacy web browsers, you may need to use an old top-level domain (e.g. `.com` or `.net`) instead of newer TLDs. The following DNS settings should be configured:

| Type  | Host  | Value                                                       |
| ----- | ----- | ----------------------------------------------------------- |
| A     | @     | Your server IP address, like `165.20.200.20`                |
| CNAME | www   | Your domain without the `www` part, like `myimageshare.net` |

Then start the containers:

```
docker compose -f docker-compose.yml up
```

ImageShare should now be running at the server's IP address. After you verify the web server is working (DNS settings might take a while to kick in), you need to run Certbot to generate SSL certificates (substitute your own domain and email):

```
docker compose run --rm  certbot certonly --webroot --webroot-path /var/www/certbot/ --email youremail@gmail.com -d yourdomain.com --agree-tos --no-redirect  --non-interactive
```

If it worked, you can switch to the production version:

```
docker compose down
docker compose -f docker-compose-prod.yml up
```

The production version should reboot the containers if they go down (e.g. after a reboot), if your Docker is set up correctly. The last step is to automate the certificate renewal, so SSL continues to work. On Linux systems, create a crontab like this:

```
crontab -e
```

Then add the following line, which runs certbot on the first day of every second month (certificates last 90 days), and restarts all Docker containers to apply changes:

```
0 5 1 */2 *  /usr/bin/docker compose -f /root/imageshare/docker-compose-prod.yml run certbot certonly --webroot --webroot-path /var/www/certbot/ --email youremail@gmail.com -d yourdomain.com --agree-tos --no-redirect  --non-interactive; docker compose restart
```

You will need to replace the path to the compose file with the correct path, as well as the domain and email address in the certbot command. Then save your changes.

## Updating ImageShare

To apply new changes, such as edited config files or a new version pulled from GitHub, shut down the containers and start them with `--build`, like this:

```
docker compose down
docker compose -f docker-compose.yml up --build
```

If you're using the production application, replace `docker-compose.yml` with `docker-compose-prod.yml`.