# ImageShare

ImageShare is a lightweight web app for uploading and sharing images. It was originally designed as a replacement for the [Nintendo 3DS Image Share Service](https://web.archive.org/web/20170822055326/https://www.nintendo.com/3ds/image-share), accessible through the Nintendo 3DS/2DS Browser, but it also works on many other basic/legacy web browsers. After the image upload, a QR code is provided to scan with another device.

### Features

- Uploads images to [Imgur](https://imgur.com) or [ImgBB](https://imgbb.com/) and creates a QR code for the link
- Does not require account creation or a login
- Compatible with many old and low-end web browsers¹ using either HTTP or HTTPS
- Works without JavaScript enabled
- Can be self-hosted on any server with Docker (see [DEV.md](DEV.md))
- Enhanced support for iOS, Windows Phone, and Windows 10 Mobile, with minimal UI and optimized app icon when installed to the home screen 
- Automatic game title detection for Nintendo 3DS uploads ([example](https://imgur.com/4Fb4HI6))

¹ The browser must have file upload support, which includes most desktop browsers, Mobile Safari [on iOS 6 or later](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/CreatingContentforSafarioniPhone/CreatingContentforSafarioniPhone.html#:~:text=File%20uploads%20and%20downloads), etc.

### How to use

Just open [theimageshare.com](http://theimageshare.com/) in your browser to access ImageShare. If your device can scan QR codes with a camera (press L + R buttons on 3DS home screen), scan the below code to open ImageShare.

<div align="center"><img src="https://i.imgur.com/CwnqTbp.png" /></div><br>

**Can't connect to ImageShare?** Check that the date and time is correct on your device and try again.

Once you have ImageShare open, bookmark it (tap the star button on the 3DS) for easy access later. If your device supports the SSL certificate, you can use ImageShare over HTTPS instead of HTTP for added security.

### Privacy Policy & Terms of Service

ImageShare uses [Plausible Analytics](https://plausible.io) to report anonymous usage data, including how many times the app is used and the browser/device used. Uploaded images are not stored on ImageShare servers, only on Imgur. The QR code is generated using the [goQR.me API](https://goqr.me/api/), which requires sending the URL to goQR.me after upload.

Imgur image uploads are subject to Imgur's [Terms of Service](https://imgur.com/tos) and [Privacy Policy](https://imgur.com/privacy). ImgBB image uploads are subject to ImgBB's [Terms of Service](https://imgbb.com/tos) and [Privacy Policy](https://imgbb.com/privacy).

### Credits

Game title detection for Nintendo 3DS images uses a database published by [3dsdb.com](http://3dsdb.com/). The ImageShare icon and logo is based on [Cloud arrow up fill](https://icons.getbootstrap.com/icons/cloud-arrow-up-fill/) from Boostrap Icons.
