# ImageShare
ImageShare is a web-based image sharing tool. It's intended to be used with game consoles like the Nintendo 3DS, but it should work on anything with a semi-modern web browser (JavaScript support is not required).

ImageShare uploads photos to [Imgbb.com](http://imgbb.com) and presents the URL as a QR code. This allows the image to be easily transfered to any device with the ability to scan QR codes. The camera apps on most iOS and Android devices can read QR codes, so you might not even need to install a separate app.

Images uploaded using ImageShare are subject to Imgbb's [Terms of Service](https://imgbb.com/tos) and [Privacy Policy](https://imgbb.com/privacy), and are deleted automatically after five minutes.

**Officially supported devices:**
 * Nintendo 3DS/2DS

## Development information

ImageShare is built to run on [Heroku](https://heroku.com). You can deploy it to your own Heroku account [here](https://heroku.com/deploy?template=https://github.com/corbindavenport/image-share), or you can use the [Heroku CLI](https://toolbelt.heroku.com/):

```
git clone git@github.com:corbindavenport/image-share.git
cd image-share
heroku login
heroku create
git push heroku master
heroku open
```

ImageShare also requires an API key from [Imgbb.com](http://imgbb.com). Once you create an account and obtain a key, save it to your Heroku's configuration:

```
heroku config:set API_KEY=thekeygoeshere
```

If you don't want to use Heroku, hosting the `web` directory on any PHP-compatible web server should still work Just replace all instances of `getenv('API_KEY')` in ImageShare's code with the API key.