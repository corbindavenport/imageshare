# Development information

ImageShare is built to run on [Heroku](https://heroku.com).

## Deploying on Heroku

You can deploy it to your own Heroku account [here](https://heroku.com/deploy?template=https://github.com/corbindavenport/image-share), or you can use the [Heroku CLI](https://toolbelt.heroku.com/) after the repository is cloned to your computer:

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

If you don't want to use Heroku, hosting the `web` directory on any PHP-compatible web server with `curl` and `ext-exif` installed should also work. The following commands work for Ubuntu-based systems.

```
sudo apt install php php-curl php-exif php-simplexml
cd web
export API_KEY="api_key_from_imgur_goes_here"
php -S localhost:8080
```