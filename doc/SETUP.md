# Installing ImageShare

This page explains the various options for install ImageShare on a desktop, NAS, or server. If you're not sure which one to pick, try the Docker Desktop method.

For running ImageShare on a public web server, see the [production guide](PROD.md).

## Docker Desktop

You can run ImageShare in [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows, Mac, and desktop Linux.

First, open ImageShare in Docker Desktop by [clicking here](https://open.docker.com/dashboard/docker-hub/image?name=corbindavenport/imageshare&type=image&tag=latest) or by typing "corbindavenport/imageshare" in the search bar at the top of the window. Make sure the "latest" tag is selected, then click the "Pull" button. Wait for the download to finish.

Next, create the container by selecting the "Images" tab in Docker Desktop, finding ImageShare in the list, and clicking the Run ▶️ button.

In the popup that opened, expand the Optional settings section, and set these values:

- **Container Name:** You can leave it blank, or set it to "imageshare".
- **Ports:** Set the "Host port" to `8080` or another available port.
- **Environment variables:** `UPLOAD_LIMIT` for the first variable, and `20` for its value. This will set the upload limit to 20 MB, but you can set it higher if you want. Check the [settings documentation](SETTINGS.md) for a full list of options.

Finally, click the "Run" button to start the container.

![Docker Desktop screenshot with settings](img/docker-desktop-settings.png)

ImageShare will be accessible at `http://localhost:8080` in your computer's web browser, and other devices on your network can open it by replacing `localhost` with your computer's local IP address. 

You can stop the server by clicking the Stop ⏹️ button in Docker Desktop. To start it again, find the container you made in the Containers tab of Docker Desktop and click the Start ▶️ button.

## Docker CLI

If you have the [Docker Engine](https://docs.docker.com/engine/install/) installed, you can run ImageShare like this:

```bash
docker run -p 127.0.0.1:8080:8080/tcp --env UPLOAD_LIMIT=20 corbindavenport/imageshare:latest
```

ImageShare will be accessible at `http://localhost:8080` in your computer's web browser, and other devices on your network can open it by replacing `localhost` with your computer's local IP address. 

Check the [settings documentation](SETTINGS.md) for a full list of options you can add as environment variables.

## Docker Compose

ImageShare uses two Docker Compose configurations, found in the root directory of this repository:

- **docker-compose.yml**: This is intended for development work or running a server without SSL (or before SSL is available).
- **docker-compose-prod.yml**: This is intended for use on servers, with full support for HTTPS/SSL.

Setting up ImageShare on a production server involves using the `docker-compose` config first, then switching to `docker-compose-prod` after Certbot has successfully obtained a certificate.

### Run ImageShare on a local server or PC

First, clone the ImageShare repository, if you haven't already:

```shell
git clone https://github.com/corbindavenport/imageshare.git
cd imageshare
```

Create a new plain text file in the root directory (same folder as this document) called `.env`, with `UPLOAD_LIMIT=20`  as the first line. You can make it in a text editor, or with this command:

```shell
printf "UPLOAD_LIMIT=20" > .env
```
This sets the file size limit for uploaded files at 20MB, and leaves all other options as the defaults. See the [full list of settings](#list-of-imageshare-settings) for more information.

Finally, start the ImageShare server like this:

```shell
docker compose -f docker-compose.yml up --build
```

ImageShare should now be accessible in your web browser from `http://localhost`. You can also test it on other devices on the same network by replacing `localhost` with your local IP address, like this: `http://192.168.1.500`.

When you're done, run this command to shut down the containers:

```shell
docker compose down
```

### Run ImageShare on a production server

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

## Apple Container

You can run ImageShare in [Apple's Container tool](https://github.com/apple/container) as an alternative to Docker Desktop or the Docker CLI. Container is available from [GitHub](https://github.com/apple/container/releases) or [Homebrew](https://formulae.brew.sh/formula/container).

After the tool is installed, start the Container service, and install the recommended kernel if asked.

```shell
container system start
```

Log into Docker Hub, replacing `<USERNAME>` with your account username. You may need to [create a personal access token](https://docs.docker.com/security/access-tokens/personal-access-tokens/) and use that instead of a password.

```shell
container registry login --username <USERNAME> docker.io
```

Then you can download and run ImageShare like this:

```shell
container run -p 127.0.0.1:8080:8080/tcp --env UPLOAD_LIMIT=20 docker.io/corbindavenport/imageshare:latest
```

ImageShare will be accessible at `http://localhost:8080` in your computer's web browser, and other devices on your network can open it by replacing `localhost` with your Mac's local IP address. 

Check the [settings documentation](SETTINGS.md) for a full list of options you can add as environment variables.