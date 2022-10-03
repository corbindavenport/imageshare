# Development information

ImageShare was originally built to run on [Heroku](https://heroku.com), but the current live version now runs on [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform). It is no longer actively tested on Heroku, but still uses the Deploy to Heroku service and should be compatible with all implementations.

## Deploying on Heroku

You can deploy it to your own Heroku account [through the website](https://heroku.com/deploy?template=https://github.com/corbindavenport/imageshare), or you can use [Heroku CLI](https://toolbelt.heroku.com/) after the repository is cloned to your computer:

```
heroku login
heroku create
git push heroku master
heroku open
```

ImageShare also requires an [Imgur API key](https://api.imgur.com/oauth2/addclient). Once you create an account and obtain a key, save it to your Heroku's configuration:

```
heroku config:set API_KEY=thekeygoeshere
```

### Deploying on other platforms

If you don't want to use Heroku, host the `web` directory on any PHP-compatible web server that has `curl` (for API access), `ext-exif` (for extracting image data), and `php-simplexml` (for parsing the 3DS game database). The following commands work for Ubuntu-based systems:

```
sudo apt install php php-curl php-exif php-simplexml
cd web
export API_KEY="api_key_from_imgur_goes_here"
php -S localhost:8080
```

To test on another device with the server running, like a 3DS, you'll need to replace the host with your local IP address, like this:

```
php -S 192.168.68.65:8080
```

Then enter `http://192.168.65:8080` on the other web browser.
