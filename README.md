# ImageShare

ImageShare is a lightweight web app for uploading and sharing images. It was originally designed as a replacement for the [Nintendo 3DS Image Share Service](https://web.archive.org/web/20170822055326/https://www.nintendo.com/3ds/image-share), accessible through the Nintendo 3DS/2DS Browser, but it also works on many other basic/legacy web browsers. After the image upload, a QR code is provided to scan with another device.

### Features

- Uploads images to [Imgur](https://imgur.com) or [ImgBB](https://imgbb.com/)
- Does not require account creation or a login
- Compatible with many old and low-end web browsers, using either HTTP or HTTPS
- Works without JavaScript enabled
- Fully open-source and can self-hostable using Docker (see [DEV.md](DEV.md))
- Automatic game title detection for Nintendo 3DS uploads ([example](https://imgur.com/4Fb4HI6))

### How to use

Just open [theimageshare.com](http://theimageshare.com/) in your browser to access ImageShare. If your device can scan QR codes with a camera (press L + R buttons on 3DS home screen), scan the below code to open ImageShare.

<div align="center"><img src="https://i.imgur.com/CwnqTbp.png" /></div><br>

Once you have ImageShare open, bookmark it (tap the star button on the 3DS) for easy access later. If your device supports the SSL certificate, you can use ImageShare over HTTPS instead of HTTP for added security.

### Privacy Policy & Terms of Service

ImageShare uses [Plausible Analytics](https://plausible.io) to report anonymous usage data, including how many times the app is used and the browser/device used. Uploaded images are not stored on ImageShare servers, only on Imgur. The QR code is generated using the [Google Charts API](https://developers.google.com/chart/infographics/docs/qr_codes), which requires sending the URL to a Google server after upload.

Imgur image uploads are subject to Imgur's [Terms of Service](https://imgur.com/tos) and [Privacy Policy](https://imgur.com/privacy). ImgBB image uploads are subject to ImgBB's [Terms of Service](https://imgbb.com/tos) and [Privacy Policy](https://imgbb.com/privacy).

### Credits

Game title detection for Nintendo 3DS images uses a database published by [3dsdb.com](http://3dsdb.com/). The ImageShare icon and logo is based on [Cloud arrow up fill](https://icons.getbootstrap.com/icons/cloud-arrow-up-fill/) from Boostrap Icons.
