# ImageShare

ImageShare is a lightweight web app for sending images to another device, designed for low-end and legacy web browsers like Internet Explorer, the Nintendo 3DS and Wii U browsers, KaiOS, Windows Phone, and others. You can upload an image, and ImageShare will generate a QR code for downloading the image on another device.

ImageShare was originally designed as a replacement for the [Nintendo 3DS Image Share Service](https://web.archive.org/web/20170822055326/https://www.nintendo.com/3ds/image-share). It supports both HTTP and HTTPS, doesn't require creating user accounts, and uses a minimal layout with no client-side JavaScript for the fastest possible performance. ImageShare can also detect Nintendo 3DS games and add the game's title to the image metadata.

You can [self-host ImageShare](DEV.md) on any server, NAS, home computer, or other device using Docker.

### How to use

Just open [theimageshare.com](http://theimageshare.com/) in your browser to access ImageShare. If your device can scan QR codes with a camera (press L + R buttons on 3DS home screen), scan the below code to open ImageShare.

<div align="center"><img src="https://i.imgur.com/CwnqTbp.png" /></div><br>

**Can't connect to ImageShare?** Check that the date and time is correct on your device and try again.

Once you have ImageShare open, bookmark it (tap the star button on the 3DS) for easy access later. If your device supports the SSL certificate, you can use ImageShare over HTTPS instead of HTTP for added security.

### Privacy Policy & Terms of Service

ImageShare uses [Plausible Analytics](https://plausible.io) to report anonymous usage data, including how many times the app is used and the browser/device used. Uploaded images are only stored on ImageShare servers until the upload to the third-party service is complete, then the copy on ImageShare is deleted. The QR code is generated using the [goQR.me API](https://goqr.me/api/), which requires sending the URL to goQR.me after upload.

Imgur uploads are subject to Imgur's [Terms of Service](https://imgur.com/tos) and [Privacy Policy](https://imgur.com/privacy). ImgBB uploads are subject to ImgBB's [Terms of Service](https://imgbb.com/tos) and [Privacy Policy](https://imgbb.com/privacy).

### Credits

Game title detection for Nintendo 3DS images uses a database published by [3dsdb.com](http://3dsdb.com/). The ImageShare icon and logo is based on [Cloud arrow up fill](https://icons.getbootstrap.com/icons/cloud-arrow-up-fill/) from Boostrap Icons.
