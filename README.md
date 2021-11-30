# ImageShare
ImageShare is a lightweight web app for uploading images. It's primarily designed as a replacement for the [Nintendo 3DS Image Share Service](https://www.nintendo.co.za/Hardware/Nintendo-3DS-Family/Download-Content/Nintendo-3DS-Image-Share-service/Nintendo-3DS-Image-Share-service-765563.html), accessible through the Nintendo 3DS Browser, but it also works on many other basic/legacy web browsers.

ImageShare uploads photos to [Imgur](https://imgur.com) and presents the URL as a QR code. This allows the image to be easily transfered to any device with the ability to scan QR codes. The camera apps on most iOS and Android devices can read QR codes. When you upload a 3DS screenshot, the game name is automatically added to the Imgur post ([example](https://imgur.com/vGAbQzt)).

Images uploaded using ImageShare are subject to Imgur's [Terms of Service](https://imgur.com/tos) and [Privacy Policy](https://imgur.com/privacy).

## How to use ImageShare

To use ImageShare, just open [imgsharetool.herokuapp.com](https://imgsharetool.herokuapp.com/) in your browser. If your device can scan QR codes (press L + R buttons on 3DS home screen), scan the below code to jump straight to ImageShare:

![QR code for imgshare.corbin.io](https://i.imgur.com/SvoNgrU.png)

Once you have ImageShare open, bookmark it (tap the star button on the 3DS) for easy access later. If you have issues loading ImageShare, try loading `http://imgsharetool.herokuapp.com` instead of `https://imgsharetool.herokuapp.com`.

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

ImageShare also requires an [Imgur API key](https://api.imgur.com/oauth2/addclient). Once you create an account and obtain a key, save it to your Heroku's configuration:

```
heroku config:set API_KEY=thekeygoeshere
```

If you don't want to use Heroku, hosting the `web` directory on any PHP-compatible web server with `ext-exif` installed should work. Just replace all instances of `getenv('API_KEY')` in ImageShare's code with the API key.