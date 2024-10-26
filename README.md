# ImageShare

ImageShare is a web app for sending images and videos to another device, designed for low-end and legacy web browsers. It works with Internet Explorer, the Nintendo 3DS and Wii U browsers, KaiOS, Netscape, Windows Phone, and many other browsers. When you upload a file, ImageShare will generate a QR code for downloading it on another device.

ImageShare was originally designed as a replacement for the [Nintendo 3DS Image Share Service](https://web.archive.org/web/20170822055326/https://www.nintendo.com/3ds/image-share). It supports both HTTP and HTTPS, doesn't require creating user accounts, and uses a minimal layout with no client-side JavaScript for the fastest possible performance. ImageShare can also detect Nintendo 3DS games and add the game's title to the image metadata.

You can [self-host ImageShare](DEV.md) on any server, NAS, home computer, or other device using Docker.

### How to use ImageShare

The main ImageShare server is hosted at [theimageshare.com](http://theimageshare.com/). If your device can scan QR codes with a camera, scan one of the below codes to open ImageShare. The site uses an non-secure HTTP connection by default for best compatibility, but your data is not encrypted in transit. If you have a more modern browser or device that supports the [Let's Encrypt ISRG Root X1 certificate](https://letsencrypt.org/docs/certificate-compatibility/), you can use ImageShare over an encrypted HTTPS connection.

**Nintendo console users:** You can scan QR codes with the Nintendo 3DS by pressing the L + R buttons on the home screen, then pressing the QR code button. If you can't connect, check that the date and time is correct on your device, then try again.

| Secure connection: modern devices and browsers | Not secure connection: 3DS, Wii U, legacy browsers |
| :---: | :---: |
| ![QR code](/qr-img-https.png) | ![QR code](/qr-img-http.png) |

Once you have ImageShare open, bookmark it or add it to your home screen for easy access. Nintendo 3DS users can tap the  star button in the browser to save it.

### Privacy Policy & Terms of Service

ImageShare uses [Plausible Analytics](https://plausible.io) to report anonymous usage data, including how many times the app is used and the browser/device used. Uploaded images are only stored on ImageShare servers until the upload to the third-party service is complete, then the copy on ImageShare is deleted. The QR code is generated using the [goQR.me API](https://goqr.me/api/), which requires sending the URL to goQR.me after upload.

Imgur uploads are subject to Imgur's [Terms of Service](https://imgur.com/tos) and [Privacy Policy](https://imgur.com/privacy). ImgBB uploads are subject to ImgBB's [Terms of Service](https://imgbb.com/tos) and [Privacy Policy](https://imgbb.com/privacy).

### Credits

Game title detection for Nintendo 3DS images uses a database published by [3dsdb.com](http://3dsdb.com/). The ImageShare icon and logo is based on [Cloud arrow up fill](https://icons.getbootstrap.com/icons/cloud-arrow-up-fill/) from Boostrap Icons. Custom robots.txt file for blocking AI crawlers provided by [ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt).

<style>
    table {
        width: 100%;
    }
</style>