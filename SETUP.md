# ImageShare Settings

ImageShare uses anonymous image uploads by default, which may expire or have other limitations. You can enter your own API key as a user to enable more upload options and features.

## Getting an Imgur client id

To allow your users to upload using imgur, you'll need to create a imgur `client id`. All uploads to imgur are anonymous and don't expire. *There is an 1250 photos uploaded per hour rate limit. Due to this, we added built in rate limit protection, that way you can't get the application banned!*

Here's how you get your `client id` setup:

1. Visit the [add client page](https://api.imgur.com/oauth2/addclient) on imgur. You will have to login/create and account to access this page, don't worry, it is free.
2. Once you are on the `Register an Application` page, fill out the form:
    - `Application Name`: Anything you want
    - `Authorization type`: `Anonymous usage without user authorization`
    - `Authorization callback URL`: You shouldn't be able to enter anything. If you can, go back to authorization type and set it to `OAuth 2 Authentication without a call...` and then change it back to anonymous.
    - `Email`: Enter your email
    - `Description`: Anything you want

3. After submitting, you will get a screen with your client id and a client secret. **All you need is the `client id`.** Take note of it.
4. In your .env file, add the following variable, insuring to add your client id

```env
IMGUR_CLIENT_ID=client-id-here
```


And just like that, you now have imgur support baked right into your server!

## ImgBB API

Uploading an image with an ImgBB API key will save it to your own ImgBB account, which can be accessed on another device through the ImgBB website without scanning the QR code. The image also won't expire automatically, like anonymous ImgBB uploads.

Here's how to enable ImgBB API uploads:

1. You need an ImgBB account. [Create a free account](https://imgbb.com/signup), or [log in](https://imgbb.com/login) if you already have one.
2. Go to the [ImgBB API page](https://api.imgbb.com/) and create an API key.
3. On your device with ImageShare, open the settings page and enter the new API key into the text.
4. Click the Save button on the settings page.
5. Make sure the "ImgBB with API key" option is selected when uploading an image.

The API key is saved in the browser cookies on your device for one year. You can delete it by clearing the text field and saving the settings again.