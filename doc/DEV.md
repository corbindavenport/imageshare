# Setup for ImageShare Development

See the bare metal instructions in [INSTALL.md](INSTALL.md) for a local environment setup.

If you need to test new changes, just kill the Node process and start it again.

### Building the Docker image

This builds the Docker image:

```shell
docker build --no-cache  -t imageshare-test .
```

This runs the container on port `8080` with no settings configured:

```shell
docker run -p 8080:80 imageshare-test
```

This runs the container on port `8080` with settings from a local `.env` file, and the uploads directory mounted to the Desktop:

```shell
docker run -p 8080:80 --env-file ./.env --volume ~/Desktop/ImageShare:/app/uploads imageshare-test
```