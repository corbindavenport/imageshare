# Running ImageShare in Production

ImageShare uses two Docker Compose configurations, found in the root directory of this repository:

- **docker-compose.yml**: This is intended for development work or running a server without SSL (or before SSL is available).
- **docker-compose-prod.yml**: This is intended for use on servers, with full support for HTTPS/SSL.

Setting up ImageShare on a production server involves using the `docker-compose` config first, then switching to `docker-compose-prod` after Certbot has successfully obtained a certificate.

### Initial setup

You need a server with Docker and Docker Compose installed. I used the [pre-configured Docker droplet from DigitalOcean](https://marketplace.digitalocean.com/apps/docker). Clone the ImageShare repository on your server, if you haven't already:

```shell
git clone https://github.com/corbindavenport/imageshare.git
cd imageshare
```

You need a web doman to use for public access. If you want to retain compatibility with legacy web browsers, you may need to use an old top-level domain (e.g. `.com` or `.net`) instead of newer TLDs.

Create a new plain text file in the root directory (same folder as this readme) called `.env` to store your settings. The only required settings are the domain and the file size limit on uploads (in megabytes). However, specifying a privacy policy page is recommended.

```shell
DOMAIN=yourwebsitegoeshere.com
UPLOAD_LIMIT=20
PRIVACY_POLICY="https://www.example.com/privacy/"
```

If there isn't a `PRIVACY_POLICY` defined, ImageShare will display a message that the server administrator has not set a privacy policy.

Next, set the DNS settings for your domain like this:

| Type  | Host  | Value                                                       |
| ----- | ----- | ----------------------------------------------------------- |
| A     | @     | Your server IP address, like `165.20.200.20`                |
| CNAME | www   | Your domain without the `www` part, like `yourwebsitegoeshere.com` |

Then start the regular ImageShare server:

```shell
docker compose -f docker-compose.yml up
```

ImageShare should now be running at the server's IP address. It will automatically run Certbot to create the certificate, and you will see a confirmation message if it worked. If it didn't work (e.g. if your DNS configuration wasn't fully applied yet), you can either restart the ImageShare server or just restart the Certbot container:

```shell
docker compose restart certbot
```

Once you have your certificate, shut down the default server and start up the production server:

```shell
docker compose down
docker compose -f docker-compose-prod.yml up
```

Your ImageShare server should now be accessible over both HTTP and HTTPS connections. Keep in mind that the HTTP version will not automatically redirect to HTTPS. Some modern browsers will switch to HTTPS automatically, but otherwise, you will need to type `https://` in the URL to use the secure version.

### Auto-renew certificate

You can automate the certificate renewal so SSL continues to work without manual renewals. On Linux systems, create a crontab like this:

```shell
crontab -e
```

Add the following line to the end of the file, replacing the path to the compose file with the correct path. This runs the certbot renew command each day at 3 AM to check if a certificate must be renewed:

```shell
0 3 * * * /usr/bin/docker compose -f /home/exampleuser/imageshare/docker-compose-prod.yml run --rm certbot renew
```

You also need to add a line for restarting the server to apply changes. This is an example that restarts the web server service each Tuesday at 4 AM, in case there is a new certificate:

```shell
0 4 * * 2 /usr/bin/docker compose -f /home/exampleuser/imageshare/docker-compose-prod.yml restart webserver
```

The core ImageShare server continues running during the restart command, with uploads remaining in place until their expiry time. The web server service is only the Nginx reverse proxy.

### Updating ImageShare

To apply new changes, such as edited config files or a new version pulled from GitHub, shut down the containers and start them with `--build`, like this:

```shell
docker compose down
docker compose -f docker-compose.yml up --build
```

If you're using the production application, replace `docker-compose.yml` with `docker-compose-prod.yml`.