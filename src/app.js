import express, { json } from 'express';
import serveStatic from 'serve-static';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import mime from 'mime';
import QRCode from 'qrcode';
import ExifReader from 'exifreader';
import { spawn } from 'node:child_process';

// Initialize Express
const app = express();
// Domain used for the web server and uploaded file URLs
const webDomain = process.env.DOMAIN;
// Domain used for Plausible analytics
const plausibleDomain = process.env.PLAUSIBLE_DOMAIN;
// File size limit for uploads
const uploadLimit = Number(process.env.UPLOAD_LIMIT);
// Time delay for automatically deleting files, in minutes
const deleteDelay = (parseInt(process.env.AUTODELETE_TIME, 10) || 2);
// Default name for file uploads
const defaultFileTitle = 'ImageShare Upload';
// Check if production mode is enabled, so we can default to SSL for image links and other actions
const prodModeEnabled = (process.env.PROD_MODE === 'true');
// Paths to primary directories
const publicDir = path.resolve(import.meta.dirname, '../public');
const mainDir = path.resolve(import.meta.dirname, '../');
// Load and sort game title libraries
const gameList3DS = init3DSTitles();
const gameListWiiU = initWiiUTitles();
// Object to store temporary shortlinks
const shortLinkObj = {};

// Print settings
console.log(`
Domain: ${(webDomain || 'Not specified')}
File delete delay: ${deleteDelay} minute(s)
File upload limit: ${uploadLimit} MB
Nintendo 3DS game detection: ${gameList3DS.length} titles
Nintendo Wii U game detection: ${gameListWiiU.length} titles
Plausible analytics domain: ${(plausibleDomain || 'None')}
Production mode: ${prodModeEnabled}
`);

// Create uploads folder, and delete existing one if present
if (fs.existsSync('uploads')) {
  fs.rmSync('uploads', { recursive: true, force: true });
}
fs.mkdirSync('uploads');

// Set storage for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomUUID();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// Set file size limits for uploads
const upload = multer({
  storage: storage,
  limits: {
    fileSize: uploadLimit * 1024 * 1024 // X MB
  }
});

// Function to initialize database of Nintendo 3DS games
function init3DSTitles() {
  const gameList = [];
  // hax0kartik database: https://hax0kartik.github.io/3dsdb
  const titleDatabases = [
    path.resolve(import.meta.dirname, 'list_GB.json'),
    path.resolve(import.meta.dirname, 'list_JP.json'),
    path.resolve(import.meta.dirname, 'list_KR.json'),
    path.resolve(import.meta.dirname, 'list_TW.json'),
    path.resolve(import.meta.dirname, 'list_US.json')
  ];
  titleDatabases.forEach(filePath => {
    // Load all JSON files and combine their entries into the gameList array
    const fileData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileData);
    gameList.push(...jsonData);
  });
  gameList.sort((a, b) => {
    // This updates the sorting on the game list, so all games are listed before their respective updated versions
    // Example: Pokémon Sun is in the databse as TitleID 0004000000164800, Pokémon Sun v1.2 update is TitleID 0004000E00164800
    // Image EXIF data doesn't include the section that indicates the update, but sorting the original titles first ensures the title match will be the original title (Pokémon Sun) instead of the modified version (Pokémon Sun Update Ver. 1.2) wherever possible
    // Games with TitleIDs starting with 000400000 are the original games, titles starting with 0004000E0 are the updates
    const aTitleIdPrefix = a.TitleID.slice(0, 10);
    const bTitleIdPrefix = b.TitleID.slice(0, 10);
    // Prioritize TitleIDs starting with 000400000 (the original games)
    if (aTitleIdPrefix === '000400000' && bTitleIdPrefix !== '000400000') {
      return -1;
    } else if (bTitleIdPrefix === '000400000' && aTitleIdPrefix !== '000400000') {
      return 1;
    } else {
      // If both or neither start with 000400000, use a default sorting criteria (e.g., sort by TitleID alphabetically)
      return a.TitleID.localeCompare(b.TitleID);
    }
  });
  return gameList;
}

// Function to initialize database of Nintendo Wii U games
function initWiiUTitles() {
  const gameList = [];
  // JSON file is based on data from WiiUBrew: https://wiiubrew.org/wiki/Title_database
  // The "eShop and disc titles", "eShop title DLC", "eShop title updates", and "Kiosk Interactive Demo and eShop Demo" tables were converted from the live HTML table to JSON using TableConvert: https://tableconvert.com/html-to-json 
  // The table data was slightly modified to remove line breaks, and replace "Title ID-" with "Title ID", 
  const fileData = fs.readFileSync(path.resolve(import.meta.dirname, 'wiiu.json'), 'utf8');
  const jsonData = JSON.parse(fileData);
  gameList.push(...jsonData);
  return gameList;
}

// Function to asynchronously send analytics data
function sendAnalytics(userAgent, clientIp, data) {
  fetch('https://plausible.io/api/event', {
    method: 'POST',
    headers: {
      'User-Agent': userAgent,
      'X-Forwarded-For': clientIp,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

// Function to detect software title from image EXIF data or file name
async function getSoftwareTitle(imgFile, mimeType, originalFileName) {
  // Exit early if file is not a supported file type
  const supportedFileTypes = [
    'image/jpeg',
    'image/png'
  ];
  if (!supportedFileTypes.includes(mimeType)) return defaultFileTitle;
  // Continue reading EXIF data
  const tags = await ExifReader.load(imgFile);
  if (originalFileName.startsWith('WiiU_')) {
    // Nintendo Wii U screenshot
    // Game ID is at the end of the screenshot file name (e.g. Mario Kart 8 EU is 010ED, file name is WiiU_screenshot_TV_010ED.jpg)
    // The 'screenshot_TV' string indicates it is a TV screenshot, 'screenshot_GamePad' indicates a game pad screenshot
    const gameIdRegex = /(.{5})(?:\.)/;
    const gameMatch = originalFileName.match(gameIdRegex);
    if (gameMatch) {
      // Check for ID in Wii U game database until a match is found
      for (const game in gameListWiiU) {
        if (gameListWiiU[game]['Title ID']?.toString().includes(gameMatch[1])) {
          return gameListWiiU[game]['Description'];
        }
      }
    }
  } else if (tags['Model']?.description === 'Nintendo 3DS' && tags['Software']?.description) {
    // Nintendo 3DS game saved image
    const gameId = tags['Software'].description.toLowerCase();
    if (gameId === '00204') {
      // This is most likely a camera photo
      return 'Nintendo 3DS Camera';
    } else if (gameId === '0008f') {
      // This matches several games and screenshots from the home screen, so just skip it
      return defaultFileTitle;
    }
    // The image contains a shortened game ID (e.g. Animal Crossing New Leaf is 0863 in image and 0004000000086300 in database)
    // Game IDs with letters can have a mixed casing between the image and database (e.g. a Pokemon X screenshot contains ID 0055d but is ID 0004000000055D00 in database), so we need to run toLowerCase() on both values for a match
    for (const game in gameList3DS) {
      if (gameList3DS[game].TitleID?.toString().toLowerCase().includes(gameId)) {
        // Game title is a match, remove TM symbol (\u2122) and registered ® sign (\u00ae)
        const gameTitleMatch = gameList3DS[game].Name.replace(/\u00ae|\u2122/g, '');
        // Return game title
        return gameTitleMatch;
      }
    }
  }
  // Return default software title if none is detected
  return defaultFileTitle;
}

// Function to render header for HTML pages
function renderHead(userAgent, webHost) {
  // Set hardcoded viewport for old Nintendo 3DS, set full-size viewport for New Nintendo 3DS and other browsers
  let viewportEl = ''
  if (userAgent.includes('Nintendo 3DS') && (!(userAgent.includes('New Nintendo 3DS')))) {
    viewportEl = '<meta name="viewport" content="width=320" />';
  } else {
    viewportEl = '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">';
  }
  // Set a 16x16 favicon for the 3DS and Wii, set larger icons in multiple sizes for other browsers
  let iconEl = '';
  if (userAgent.includes('Nintendo')) {
    iconEl = '<link rel="icon" href="favicon.ico" type="image/x-icon">';
  } else {
    iconEl = `<link rel="apple-touch-icon" sizes="192x192" href="img/maskable_icon_x192.png">
    <link rel="icon" type="image/png" sizes="16x16" href="img/favicon_x16.png">
    <link rel="icon" type="image/png" sizes="24x24" href="img/favicon_x24.png">`
  }
  // Generate  full header string
  // Documentation for Windows tile: https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/dn255024(v=vs.85)
  // CSS is embedded using @import statement so old browsers (IE 3, Netscape 4.x, etc.) get the plain HTML version
  const htmlString = `
    <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ImageShare</title>
    <meta name="description" content="ImageShare is a web app for sending images and videos to another device, designed for low-end and legacy web browsers.">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="ImageShare">
    <!-- Theme colors -->
    <meta name="color-scheme" content="dark light">
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFF">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000">
    <style>
    @import url("/styles.css");
    </style>
    ${viewportEl}
    ${iconEl}
    <!-- Web app manifest and Windows tile -->
    <link rel="manifest" href="manifest.json">
    <meta name="application-name" content="ImageShare">
    <meta name="msapplication-TileColor" content="#7e57c2">
    <meta name="msapplication-square150x150logo" content="img/maskable_icon_x192.png">
    <!-- Open Graph card -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="ImageShare" />
    <meta property="og:description" content="ImageShare is a web app for sending images and videos to another device, designed for low-end and legacy web browsers." />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:url" content="https://${webHost}" />
    <meta property="og:image" content="https://${webHost}/img/maskable_icon_x512.png" />
    <meta name="og:image:alt" content="ImageShare app icon" />
    <meta name="twitter:card" content="summary" />
  </head>`;
  return htmlString;
}


function renderMain(userAgent = '', webHost, uploadUrl = '', shortLink = '', softwareTitle = defaultFileTitle) {
  // Shorten rendered software title for Nintendo 3DS, because text-overflow: ellipsis doesn't work on responsive-width containers
  if (userAgent.includes('Nintendo 3DS') && (softwareTitle.length > 32)) {
    softwareTitle = softwareTitle.substring(0, 32) + ' ...';
  }
  // Render initial header elements
  // Background color is defined in <body> attributes for ancient browsers, like Netscape 4.x
  let htmlString = `<!DOCTYPE html>
  <html lang="en">
  ${renderHead(userAgent, webHost)}
  <body bgcolor="#FFFFFF" text="#2c3e50" link="#0d6efd" vlink="#0d6efd" alink="#0a58ca">
    <div class="container">
  `;
  // Show QR code if a file has been uploaded
  if (uploadUrl) {
    // Show QR code
    htmlString += `
    <div class="panel">
        <h3 class="panel-title">${softwareTitle}</h3>
        <div align="center">
          <img class="qr-img" alt="QR code" width="175" height="175" border="0" src="/${uploadUrl.replace('uploads/', 'qr/')}">
        </div>
        <div class="body">
          <p class="shortcode-container" align="center">
            <font face="courier new, monospace">
              <a href="/${uploadUrl}" target="_blank">${shortLink}</a>
            </font>
          </p>
          <p>You have ${deleteDelay} ${deleteDelay === 1 ? 'minute' : 'minutes'} to save your file before it is deleted.</p>
        </div>
      </div>
    `;
  }
  // Render rest of page
  htmlString += `
      <!-- Main upload panel -->
      <div class="panel">
        <h3 class="panel-title">Upload File</h3>
        <div class="body">
          <form action="/" id="upload-form" enctype="multipart/form-data" method="POST" onsubmit="document.getElementById('loading-container').style.display='block';">
            <p><input name="img" id="img-btn" type="file" accept="image/*,video/*" /></p>
            <p><input name="submit" type="submit" value="Upload" /></p>
            <p id="loading-container" style="display:none;" align="center">
              <img src="/img/loading.gif" alt="Loading">
            </p>
            <p>Maximum file size: ${uploadLimit} MB</p>
          </form>
          <hr>
          <p>ImageShare is a web app for sending images and videos to another device, designed for low-end and legacy web browsers. ImageShare is open-source software, see the below links for more information and support.</p>
          <p style="text-align: center; font-weight: bold;"><a href="https://github.com/corbindavenport/imageshare" target="_blank">github.com/corbindavenport/imageshare</a></p>
          <p style="text-align: center; font-weight: bold;"><a href="https://discord.gg/tqJDRsmQVn" target="_blank">discord.gg/tqJDRsmQVn</a></p>
          <p>If you find ImageShare useful, please consider donating to support development and server costs!</p>
          <p style="text-align: center; font-weight: bold;"><a href="https://www.patreon.com/corbindavenport" target="_blank">patreon.com/corbindavenport</a></p>
          <p style="text-align: center; font-weight: bold;"><a href="https://cash.app/$corbdav" target="_blank">cash.app/$corbdav</a> • <a href="https://paypal.me/corbindav" target="_blank">paypal.me/corbindav</a></p>
        </div>
      </div>
    </div>
    <p class="footer"><i>${userAgent}</i></p>
  </body>
  </html>`;
  return htmlString;
}

// Set up serve-static middleware to serve files from the 'public' folder
app.use(serveStatic(publicDir));

// Handle POST requests with enctype="multipart/form-data"
app.post('/', upload.single('img'), async function (req, res, err) {
  // Use HTTPS for shortlink if server is in production mode, or HTTP if not
  const protocol = prodModeEnabled ? 'https' : 'http';
  // TODO check MIME type is video or image
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  if (req && req.file && req.file.path) {
    console.log(`Uploaded file: ${req.file.originalname}, MIME type ${req.file.mimetype}`);
    // Detect software title
    const softwareTitle = await getSoftwareTitle(req.file.path, req.file.mimetype, req.file.originalname);
    // If custom software title is detected, run exiftool to save it to the image description
    // If the image is a detected Wii U software title, also add the make and model to the EXIF data
    if (req.file.originalname.startsWith('WiiU_') && (softwareTitle != defaultFileTitle)) {
      spawn('exiftool', [`-Caption-Abstract=${softwareTitle}`, `-ImageDescription=${softwareTitle}`, '-Model=Nintendo Wii U', '-Make=Nintendo', req.file.path]);
    } else if (softwareTitle != defaultFileTitle) {
      spawn('exiftool', [`-Caption-Abstract=${softwareTitle}`, `-ImageDescription=${softwareTitle}`, req.file.path]);
    }
    // Create unique shortlink that isn't already in storage
    let shortLink;
    do {
      shortLink = crypto.randomUUID().toString().substring(0, 5);
    } while (shortLinkObj[shortLink]);
    shortLinkObj[shortLink] = req.file.path;
    console.log(`Created shortlink: ${protocol}://${connectedHost}/i/${shortLink}`);
    // Schedule timeout to delete file and shortlink
    const delay = deleteDelay * 60 * 1000;
    setTimeout(async () => {
      // Delete shortlink
      delete shortLinkObj[shortLink];
      console.log(`Deleted shortlink: ${protocol}://${connectedHost}/i/${shortLink}`);
      // Delete file
      if (req.file) {
        fs.unlinkSync(req.file.path);
        console.log(`Deleted file: ${req.file.path}`);
      }
    }, delay);
    // Send async Plausible analytics page view if enabled
    if (plausibleDomain) {
      const data = {
        name: 'Upload',
        props: JSON.stringify({ 'Upload Mode': 'Native' }),
        url: '/',
        domain: plausibleDomain
      }
      sendAnalytics(req.get('User-Agent'), (req.headers['x-forwarded-for'] || req.ip), data);
    }
    // Display result page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderMain(String(req.get('User-Agent')), connectedHost, req.file.path, `${protocol}://${connectedHost}/i/${shortLink}`, softwareTitle));
  } else {
    console.error('Invalid upload');
    res.sendStatus(500);
  }
});

// Handle requests for main page with a custom-rendered interface
// The / and /index.html paths are required, the /index.php path retains compatibility with bookmarks for the older PHP-based ImageShare
app.get(['/', '/index.html', '/index.php'], (req, res) => {
  console.log(req)
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  // Send async Plausible analytics page view if enabled
  if (plausibleDomain) {
    const data = {
      name: 'pageview',
      url: '/',
      domain: plausibleDomain,
    }
    sendAnalytics(req.get('User-Agent'), (req.headers['x-forwarded-for'] || req.ip), data);
  }
  // Send page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(renderMain(String(req.get('User-Agent')), connectedHost));
});

// Handle requests for uploaded file with direct file access
app.get(['/uploads/*', '/i/*'], async (req, res) => {
  let reqPath = '';
  if (req.path.startsWith('/i/')) {
    // Request from shortlink
    let shortLinkCode = req.url.replace('/i/', '');
    if (shortLinkCode in shortLinkObj) {
      reqPath = shortLinkObj[shortLinkCode];
    }
  } else {
    // Request from full path
    reqPath = req.url;
  }
  try {
    // Load the file
    const filePath = path.join(mainDir, reqPath);
    let data = await fs.promises.readFile(filePath);
    // Set MIME type on image download
    const mimeType = mime.getType(filePath);
    res.setHeader('Content-Type', mimeType);
    // Force browser to download instead of preview
    res.setHeader('Content-Disposition', `Attachment;filename="${path.basename(filePath)}"`);
    // Send file to client
    res.send(data);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

// Handle requests for QR codes
app.get('/qr/*', async (req, res) => {
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  const fileName = req.params[0]; // Example: 0fbb2132-296b-455e-bcbc-107ca9f103e9.jpg
  // Use HTTPS for the link if server is in production mode, or HTTP if not
  const protocol = prodModeEnabled ? 'https' : 'http';
  // Create QR code text string
  const qrText = `${protocol}://${connectedHost}/uploads/${fileName}`;
  try {
    // Generate the QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrText, {
      type: 'image/png',
      width: 350,
      margin: 2,
      errorCorrectionLevel: 'L'
    });
    // Return the QR code
    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(qrCodeDataURL.split(',')[1], 'base64'));
  } catch (error) {
    res.status(500).send('Error generating QR code');
  }
});

// Start the HTTP server
app.listen(8080, () => {
  console.log(`Server is running`);
});

// Listen for termination signals
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server...');
  process.exit(0);
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);