# Setup for ImageShare Development

This guide explains how to develop and run ImageShare outside of a container, and test the Docker images if needed.

### Dependencies

You need [Node.js](https://nodejs.org/), [exiftool](https://exiftool.org/), and [Git](https://git-scm.com/install/) installed on the host system.

If you're on a Mac with [Homebrew](https://brew.sh/) installed, you can get everything with this command:

```shell
brew install node git exiftool
```

### ImageShare Setup

First, clone the repository:

```shell
git clone https://github.com/corbindavenport/imageshare.git -b main imageshare
cd imageshare
```

Next, install the Node.js dependencies:

```shell
npm install --ignore-scripts
```

If you want to configure [settings](SETTINGS.md), create an `.env` text file in the root directory (same folder as `Dockerfile`) like this:

```
AUTODELETE_TIME=2
UPLOAD_LIMIT=50
```

If you don't have a `.env` file, the Node runtime will try to read the settings from your system's environment variables.

Finally, run ImageShare:

```shell
npm start
```

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