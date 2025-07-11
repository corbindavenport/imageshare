# How to host ImageShare

ImageShare is built to run as a multi-container Docker application, using Nginx as the reverse proxy web server, Node as the application server, and Let's Encrypt Certbot for obtaining an SSL certificate. The custom Ngix configuration and Certbot allows ImageShare to load over both HTTP and HTTPS, without forcing an HTTPS connection. This setup means ImageShare is available on legacy browsers that have outdated certificate chains or no SSL support at all, and works on just about any host operating system.

This guide assumes you have some knowledge of Docker ([this video](https://www.youtube.com/watch?v=Gjnup-PuquQ) is a simple overview). You also need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed for running locally.

## Docker Compose files

ImageShare uses two Docker Compose configurations, found in the root directory of this repository:

- **docker-compose.yml**: This is intended for development work or running a server without SSL (or before SSL is available).
- **docker-compose-prod.yml**: This is intended for use on servers, with full support for HTTPS/SSL.

Setting up ImageShare on a production server involves using the `docker-compose` config first, then switching to `docker-compose-prod` after Certbot has successfully obtained a certificate.

## Run ImageShare on a local server or PC

First, clone the ImageShare repository, if you haven't already:

```
git clone https://github.com/corbindavenport/imageshare.git
cd imageshare
```

Create a new plain text file in the root directory (same folder as this document) called `.env`, with `UPLOAD_LIMIT=20` and  `IMGUR_KEY=idGoesHere` as the only lines. You can do it manually or with this command:

```
printf "UPLOAD_LIMIT=20" > .env
```
This sets the file size limit for uploaded files at 20MB, and leaves all other options as the defaults. See the [full list of settings](#list-of-imageshare-settings) for more information.

Finally, start the ImageShare server like this:

```
docker compose -f docker-compose.yml up --build
```

ImageShare should now be accessible in your web browser from `http://localhost`. You can also test it on other devices on the same network by replacing `localhost` with your local IP address, like this: `http://192.168.1.500`.

When you're done, run this command to shut down the containers:

```
docker compose down
```

## Run ImageShare on a production server

You need a server with Docker and Docker Compose installed. I used the [pre-configured Docker droplet from DigitalOcean](https://marketplace.digitalocean.com/apps/docker). Clone the ImageShare repository on your server, if you haven't already:

```
git clone https://github.com/corbindavenport/imageshare.git
cd imageshare
```

You need a web doman to use for public access. If you want to retain compatibility with legacy web browsers, you may need to use an old top-level domain (e.g. `.com` or `.net`) instead of newer TLDs.

Create a new plain text file in the root directory (same folder as this readme) called `.env` to store your settings. The only required settings are the domain and the file size limit on uploads (in megabytes). However, specifying a privacy policy page is recommended.

```
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

```
docker compose -f docker-compose.yml up
```

ImageShare should now be running at the server's IP address. It will automatically run Certbot to create the certificate, and you will see a confirmation message if it worked. If it didn't work (e.g. if your DNS configuration wasn't fully applied yet), you can either restart the ImageShare server or just restart the Certbot container:

```
docker compose restart certbot
```

Once you have your certificate, shut down the default server and start up the production server:

```
docker compose down
docker compose -f docker-compose-prod.yml up
```

Your ImageShare server should now be accessible over both HTTP and HTTPS connections. Keep in mind that the HTTP version will not automatically redirect to HTTPS. Some modern browsers will switch to HTTPS automatically, but otherwise, you will need to type `https://` in the URL to use the secure version.

## Auto-renew certificate

You can automate the certificate renewal so SSL continues to work without manual renewals. On Linux systems, create a crontab like this:

```
crontab -e
```

Add the following line to the end of the file, which runs the certbot renew command each day at 3 AM to check if a certificate must be renewed:

```
0 3 * * * /usr/bin/docker compose -f /home/exampleuser/imageshare/docker-compose-prod.yml run --rm certbot renew
```

You will need to replace the path to the compose file with the correct path. Then save your changes.

## Updating ImageShare

To apply new changes, such as edited config files or a new version pulled from GitHub, shut down the containers and start them with `--build`, like this:

```
docker compose down
docker compose -f docker-compose.yml up --build
```

If you're using the production application, replace `docker-compose.yml` with `docker-compose-prod.yml`.

## List of ImageShare settings

This is a complete list of configuration options in ImageShare with the `.env` file.

| Setting | Example Value | Description |
| ------- | ------------- | ----------- |
| `DOMAIN` | `yourdomain.com` | The web domain for the ImageShare server, used in generating QR codes, image shortlinks, and other functions. If left blank, ImageShare will use the IP address from the connected client. For example, the shortlink might look like `http://192.168.50.28/i/559e5`. |
| `PLAUSIBLE_DOMAIN` | `yourdomain.com` | The domain used for Plausible Analytics, the feature is turned off if the setting isn't defined. See the [Plausible Analytics section](#enable-plausible-analytics) for more information. |
| `UPLOAD_LIMIT` | `10` | The file size limit for uploads, measured in Megabytes. This is the only setting that is required. |
| `AUTODELETE_TIME` | `2` | The time delay to automatically delete files, measured in minutes. If you are running a public server, this should be a low number to prevent possibly-malicious content from remaining accessible for too long. |
| `IMGUR_KEY` | `740273babac99b0` | This enables Imgur API upload support. See the [Imgur section](#enable-imgur-support) for more information. |

This is a sample `.env` file for a production server with Plausible Analytics enabled:

```
DOMAIN=myimageshare.com
PLAUSIBLE_DOMAIN=myimageshare.com
UPLOAD_LIMIT=5
```

## Enable Plausible Analytics

ImageShare can optionally use [Plausible Analytics](https://plausible.io/) to track pageviews and uploads. The collected data includes pageviews, upload events, and the upload method. The analytics is handled server-side, using the client's user agent and IP address. Analytics does not contain any data about the contents of the upload.

To get started, [create a website in Plausible](https://plausible.io/sites/new). The Plausible domain doesn't have to match the actual site URL.

You have to create custom events and goals to track uploads and the type of uploads. In the Plausible domain settings, open the Goals page and create a custom event called "Upload". This is used to track image upload events.

![Add goal screenshot](https://i.imgur.com/CnQwZdi.png)

Next, open the Custom Properties page, and create a new property called "Upload Mode". This was previously used to track different upload methods (Imgur, ImgBB, etc.), but as of [ImageShare 3.0](https://github.com/corbindavenport/imageshare/releases/tag/v3.0), there is only one "Native" upload method. If more upload methods are [added in future updates](https://github.com/corbindavenport/imageshare/issues/31), they will use this property.

![Add custom event screenshot](https://i.imgur.com/fYQ2jej.png)

Next, add the Plausible domain to your server `.env` file like this:

```
PLAUSIBLE_DOMAIN=yourdomain.com
```

Finally, apply your settings by restarting the server. If you're running the production server, replace `docker-compose.yml` with `docker-compose-prod.yml` in the below example.

```
docker compose down
docker compose -f docker-compose.yml up
```

Pageviews and upload events should now appear in your Plausible dashboard. Note that the Nintendo 3DS, New Nintendo 3DS, and Wii U Browsers all appear as "NetFront" in Plausible.

## Enable Imgur support

To enable Imgur as an image upload service, you'll need to create an API client key. All uploads to Imgur are anonymous and don't expire. There is an 1250 photos uploaded per hour rate limit, and ImageShare has a built-in rate limit protection feature to avoid reaching it.

To start, visit the [add client page](https://api.imgur.com/oauth2/addclient) on imgur. You will have to log in with Imgur to see the page, or create a new (free) account. Once you are on the `Register an Application` page, fill out the form:

- `Application Name`: Anything you want
- `Authorization type`: `Anonymous usage without user authorization`
- `Authorization callback URL`: You shouldn't be able to enter anything. If you can, go back to authorization type and set it to `OAuth 2 Authentication without a call...` and then change it back to anonymous.
- `Email`: Enter your email
- `Description`: Anything you want

Imgur will give you a Client ID and a Client Secret. Next, add the Imgur client ID to your server `.env` file like this:

```
IMGUR_KEY=client-id-here
```

Finally, apply your settings by restarting the server. If you're running the production server, replace `docker-compose.yml` with `docker-compose-prod.yml` in the below example.

```
docker compose down
docker compose -f docker-compose.yml up
```

Imgur should now appear as an option in the upload form on your ImageShare server.
