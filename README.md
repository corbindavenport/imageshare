# ImageShare

ImageShare is a lightweight web app for uploading images. It was originally designed as a replacement for the [Nintendo 3DS Image Share Service](https://www.nintendo.co.za/Hardware/Nintendo-3DS-Family/Download-Content/Nintendo-3DS-Image-Share-service/Nintendo-3DS-Image-Share-service-765563.html), accessible through the Nintendo 3DS/2DS Browser, but it also works on many other basic/legacy web browsers. When you select an image with ImageShare, it is uploaded to [Imgur](https://imgur.com) and presented as a QR code to scan with another device.

### Features

- Does not require account creation or a login
- Compatible with many old and low-end web browsers (official site is limited by [what CloudFlare CDN supports](https://developers.cloudflare.com/ssl/ssl-tls/browser-compatibility))
- JavaScript does not have to be enabled in the browser
- Fully open-source and can self-hostable using [Heroku](https://heroku.com), [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform), or nearly any PHP server
- Automatic game title detection for Nintendo 3DS uploads ([example](https://imgur.com/4Fb4HI6))

### How to use

Just open [theimageshare.com](https://theimageshare.com/) in your browser to access ImageShare. If your device can scan QR codes with a camera (press L + R buttons on 3DS home screen), scan the below code to open ImageShare.

<div align="center"><img src="https://i.imgur.com/DsHP1u2.png" /></div><br>

Once you have ImageShare open, bookmark it (tap the star button on the 3DS) for easy access later.


### Privacy Policy & Terms of Service

ImageShare uses [Plausible Analytics](https://plausible.io) to report anonymous usage data, including how many times the app is used and the browser/device used. Uploaded images are not stored on ImageShare servers, only on Imgur. The QR code is generated using the [Google Charts API](https://developers.google.com/chart/infographics/docs/qr_codes), which requires sending the URL to a Google server after upload.

Images uploaded using ImageShare are subject to Imgur's [Terms of Service](https://imgur.com/tos) and [Privacy Policy](https://imgur.com/privacy).

### Credits

Game title detection for Nintendo 3DS images uses a database published by [3dsdb.com](http://3dsdb.com/). The ImageShare icon and logo is based on [Cloud arrow up fill](https://icons.getbootstrap.com/icons/cloud-arrow-up-fill/) from Boostrap Icons.
