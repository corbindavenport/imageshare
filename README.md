# ImageShare

**ImageShare may migrate to a new site or shut down by November 28, 2022. Check [this page](https://github.com/corbindavenport/image-share/issues/11) for updates.**

ImageShare is a lightweight web app for uploading images. It's primarily designed as a replacement for the [Nintendo 3DS Image Share Service](https://www.nintendo.co.za/Hardware/Nintendo-3DS-Family/Download-Content/Nintendo-3DS-Image-Share-service/Nintendo-3DS-Image-Share-service-765563.html), accessible through the Nintendo 3DS/2DS Browser, but it also works on many other basic/legacy web browsers. When you select an image with ImageShare, it is uploaded to [Imgur](https://imgur.com) and presented as a QR code to scan with another device.

<div align="center"><img width="100%" src="https://github.com/corbindavenport/image-share/raw/master/demo.gif" /></div>

### Features

- Does not require logins or accounts
- Works on both HTTPS and HTTP connections, for browsers with outdated SSL certificates
- Does not require JavaScript support in web browser
- Fully open-source and can self-hostable using [Heroku](https://heroku.com)
- **3DS/New 3DS only:** Automatic game title detection, using database from [3dsdb.com](http://3dsdb.com/) ([example](https://imgur.com/w6aZ3cb))

Images uploaded using ImageShare are subject to Imgur's [Terms of Service](https://imgur.com/tos) and [Privacy Policy](https://imgur.com/privacy).

## How to use ImageShare

Just open [imgsharetool.herokuapp.com](https://imgsharetool.herokuapp.com/) in your browser to access ImageShare. If your device can scan QR codes with a camera (press L + R buttons on 3DS home screen), scan the below code to open ImageShare.

<div align="center"><img src="https://i.imgur.com/SvoNgrU.png" /></div>

Once you have ImageShare open, bookmark it (tap the star button on the 3DS) for easy access later. If you have issues loading ImageShare on your device, try loading `http://imgsharetool.herokuapp.com` instead of `https://imgsharetool.herokuapp.com`.
