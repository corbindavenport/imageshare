# List of ImageShare Settings

This is a complete list of configuration options in ImageShare with the `.env` file.

| Setting | Example Value | Description |
| ------- | ------------- | ----------- |
| `DOMAIN` | `yourdomain.com` | The web domain for the ImageShare server, used in generating QR codes, image shortlinks, and other functions. If left blank, ImageShare will use the IP address from the connected client. For example, the shortlink might look like `http://192.168.50.28/i/559e5`. |
| `PLAUSIBLE_DOMAIN` | `yourdomain.com` | The domain used for Plausible Analytics, the feature is turned off if the setting isn't defined. See the [Plausible Analytics section](#enable-plausible-analytics) for more information. |
| `UPLOAD_LIMIT` | `20` | The file size limit for uploads, measured in Megabytes. |
| `AUTODELETE_TIME` | `2` | The time delay to automatically delete files, measured in minutes. If you are running a public server, this should be a low number to prevent possibly-malicious content from remaining accessible for too long. |
| `IMGUR_KEY` | `740273babac99b0` | This enables Imgur API upload support. See the [Imgur section](#enable-imgur-support) for more information. |

This is a sample `.env` file for a production server with Plausible Analytics enabled:

```ini
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

```ini
PLAUSIBLE_DOMAIN=yourdomain.com
```

Finally, apply your settings by restarting the server. If you're running the production server, replace `docker-compose.yml` with `docker-compose-prod.yml` in the below example.

```shell
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

```ini
IMGUR_KEY=client-id-here
```

Finally, apply your settings by restarting the server. If you're running the production server, replace `docker-compose.yml` with `docker-compose-prod.yml` in the below example.

```shell
docker compose down
docker compose -f docker-compose.yml up
```

Imgur should now appear as an option in the upload form on your ImageShare server.
