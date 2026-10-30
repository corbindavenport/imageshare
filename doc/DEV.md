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

Finally, run ImageShare:

```shell
npm start
```

If you need to test new changes, just kill the Node process and start it again.

### Building the Docker image

You can build and run the Docker image like this:

```
docker build --no-cache  -t imageshare-test .
docker run -p 8080:80 imageshare-test
```