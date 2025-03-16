import express, { json } from 'express';
import serveStatic from 'serve-static';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import mime from 'mime';
import QRCode from 'qrcode';
import sharp from 'sharp';
import ExifReader from 'exifreader';
import { spawn } from 'node:child_process';
import { uploadToImgur } from './modules/imgur-upload.js';
import { uploadToLocal } from './modules/local-upload.js';

// Initialize Express
const app = express();
// Domain used for the web server and uploaded file URLs
const webDomain = process.env.DOMAIN;
// Domain used for Plausible analytics
const plausibleDomain = process.env.PLAUSIBLE_DOMAIN;
// File size limit for uploads in MB
const uploadLimit = parseInt(process.env.UPLOAD_LIMIT, 10);
// Time delay for automatically deleting files, in minutes
const deleteDelay = (parseInt(process.env.AUTODELETE_TIME, 10) || 2);
// Default name for file uploads
const defaultFileTitle = 'ImageShare Upload';
// Check if production mode is enabled, so we can default to SSL for image links and other actions
const prodModeEnabled = (process.env.PROD_MODE === 'true');
// Privacy statement
const privacyUrl = process.env.PRIVACY_POLICY;
// Imgur API client ID
const imgurClientId = process.env.IMGUR_KEY;

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
Production mode: ${prodModeEnabled ? 'Enabled' : 'Disabled'}
Imgur support: ${imgurClientId ? 'Enabled' : 'Disabled'}
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
    const extension = (path.extname(file.originalname) || getFileExtension(file.mimetype));
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

// Function to return file extension from detected MIME type
function getFileExtension(mimeType) {
  let detectedType = mime.getExtension(mimeType);
  if (detectedType) {
    return `.${detectedType}`;
  } else if (mimeType === 'image/x-pict') {
    // Mac PICT image format
    return `.pict`
  } else {
    // Return a blank string if no file ending can be found
    return '';
  }
}

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
    // Example: Pokémon Sun is in the database as TitleID 0004000000164800, Pokémon Sun v1.2 update is TitleID 0004000E00164800
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
function renderHead(userAgent, webHost, forceMobileMode = false) {
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
  // Generate CSS code
  let cssString = '@import url("/styles.css"); @import url("/small.css") (max-width: 350px);';
  if (forceMobileMode) {
    cssString = '@import url("/styles.css"); @import url("/small.css");';
  }
  // Generate full header string
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
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f5f5f7">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000">
    <style>
    ${cssString}
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

// Function to render main page
function renderMain(passedOptions) {
  // Set options
  let data = {
    // User agent string of the connected client
    userAgent: passedOptions.userAgent || undefined,
    // The web domain of the public ImageShare instance (e.g. 'localhost', 'example.com', '192.68.50.100')
    webHost: passedOptions.webHost,
    // Setting to force small-screen interface
    forceMobileMode: false || passedOptions.forceMobileMode,
    // Path to an uploaded image (e.g. 'uploads/319747f3-a0c2-4492-af05-736da74f6bac.jpg')
    qrLink: undefined || passedOptions.qrLink,
    // Path to the shortlink redirecting to the uploaded image (e.g. 'http://localhost/i/e220f')
    shortLink: undefined || passedOptions.shortLink,
    // Software title detected from image (e.g. 'THE LEGEND OF ZELDA The Wind Waker HD')
    softwareTitle: passedOptions.softwareTitle || defaultFileTitle,
    // Set the footer message for qr panel
    qrFooter: undefined || passedOptions.qrFooter
  }
  // Shorten rendered software title for Nintendo 3DS, because text-overflow: ellipsis doesn't work on responsive-width containers
  if (data.userAgent.includes('Nintendo 3DS') && (data.softwareTitle.length > 32)) {
    data.softwareTitle = data.softwareTitle.substring(0, 32) + ' ...';
  }
  // Render initial header elements
  // Background color is defined in <body> attributes for ancient browsers, like Netscape 4.x
  let htmlString = `<!DOCTYPE html>
  <html lang="en">
  ${renderHead(data.userAgent, data.webHost, data.forceMobileMode)}
  <body bgcolor="#FFFFFF" text="#2c3e50" link="#0d6efd" vlink="#0d6efd" alink="#0a58ca">
    <div class="container">
  `;
  // Show QR code if a file has been uploaded
  if (data.qrLink) {
    // Show QR code
    htmlString += `
    <div class="panel">
        <h3 class="panel-title">${data.softwareTitle}</h3>
        <div align="center">
          <img class="qr-img" alt="QR code" width="175" height="175" border="0" src="${data.qrLink}">
        </div>
        <div class="body">
          <p class="shortcode-container" align="center">
            <font face="courier new, monospace">
              <a href="${data.shortLink}" target="_blank">${data.shortLink}</a>
            </font>
          </p>
          <p>${data.qrFooter}</p>
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
          <form action="${data.forceMobileMode ? '/m/' : '/'}" id="upload-form" enctype="multipart/form-data" method="POST" onsubmit="document.getElementById('loading-container').style.display='block';">
            <p><input name="img" id="imageshare-file-select" type="file" accept="image/*,video/*" /></p>
            <p>
              <input type="radio" id="upload-type-imageshare" name="upload-type" value="imageshare" class="imageshare-service-radio" checked>
              <label for="upload-type-imageshare">Upload to ImageShare (temporary)</label>
              ${imgurClientId ? `<br />
                <input type="radio" id="upload-type-imgur" name="upload-type" value="imgur" class="imageshare-service-radio">
                <label for="upload-type-imgur">Upload to Imgur</label>` : ''}
            </p>
            <p><input name="submit" type="submit" id="imagshare-upload-btn" value="Upload" /></p>
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
    <p class="footer">
        ${data.forceMobileMode ? '<a href="/">Disable mobile mode</a>' : '<a href="/m/">Mobile mode</a>'} • <a href="privacy/">Privacy policy</a>
        <br /><br />
        ${data.userAgent}
    </p>
  </body>
  </html>`;
  return htmlString;
}

// Function to render error and information messages with a link back to the main page
function renderMessage(userAgent = '', webHost, forceMobileMode = false, message = '') {
  let htmlString = `<!DOCTYPE html>
  <html lang="en">
  ${renderHead(userAgent, webHost, forceMobileMode)}
  <body bgcolor="#FFFFFF" text="#2c3e50" link="#0d6efd" vlink="#0d6efd" alink="#0a58ca">
    <div class="container">
      <div class="panel">
        <h3 class="panel-title">Message</h3>
        <div class="body">
          <p>${message}</p>
          <p style="text-align: center; font-weight: bold;"><a href="${forceMobileMode ? '/m/' : '/'}">OK</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  return htmlString;
}

// Set up serve-static middleware to serve files from the 'public' folder
app.use(serveStatic(publicDir));

// Handle POST requests with enctype="multipart/form-data"
app.post(['/', '/m', '/m/'], upload.single('img'), async function (req, res, err) {
  // Use HTTPS for shortlink if server is in production mode, or HTTP if not
  const protocol = prodModeEnabled ? 'https' : 'http';
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  if (req && req.file && req.file.path) {
    console.log(`Uploaded file: ${req.file.originalname}, MIME type ${req.file.mimetype}`);
    // Detect software title
    const softwareTitle = await getSoftwareTitle(req.file.path, req.file.mimetype, req.file.originalname);
    // If custom software title is detected, run exiftool to save it to the image description
    // If the image is a detected Wii U software title, also add the make and model to the EXIF data
    if (req.file.originalname.startsWith('WiiU_') && (softwareTitle != defaultFileTitle)) {
      spawn('exiftool', [`-Caption-Abstract=${softwareTitle}`, `-ImageDescription=${softwareTitle}`, '-Model=Nintendo Wii U', '-Make=Nintendo', `-overwrite_original`, req.file.path]);
    } else if (softwareTitle != defaultFileTitle) {
      spawn('exiftool', [`-Caption-Abstract=${softwareTitle}`, `-ImageDescription=${softwareTitle}`, `-overwrite_original`, req.file.path]);
    }

    // Determine whether the user selected to upload to Imgur or ImageShare
    let uploadResult;
    if (req.body['upload-type'] === 'imgur') {
      // Verify that the file uploaded is supported by imgur (png and jpeg)
      if (req.file.mimetype !== 'image/jpeg' && req.file.mimetype !== 'image/png') {
        // Not valid, return error to user :(
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(renderMessage(String(req.get('User-Agent')), connectedHost, req.path.startsWith('/m'), 'The file you uploaded is not supported by Imgur. Please select a PNG or JPEG image.'));
        return;
      } else {
        // Yippie, the user uploaded a valid file, upload to Imgur (code is located in src/modules/imgur-upload.js)
        uploadResult = await uploadToImgur(req.file, softwareTitle, imgurClientId, plausibleDomain, req);
      }
    } else {
      // Upload to ImageShare
      uploadResult = await uploadToLocal(req.file, protocol, connectedHost, req, plausibleDomain, deleteDelay);
    }

    // Decide if the upload was successful or not
    if (uploadResult.success) {
      // Now take the data from the upload response, and display it to the user
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(renderMain({
        userAgent: String(req.get('User-Agent')),
        webHost: connectedHost,
        forceMobileMode: req.path.startsWith('/m'),
        qrLink: uploadResult.qrLink,
        shortLink: uploadResult.link,
        softwareTitle: softwareTitle,
        qrFooter: uploadResult.qrFooter
      }));
    } else {
      // If the upload failed, display an error message to the user
      // Upload Result will contain a reason for the failure, if not set by the uploader's function, it will be set to the universal error message
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(renderMessage(String(req.get('User-Agent')), connectedHost, req.path.startsWith('/m'), (uploadResult.reason || 'There was an issue uploading your file. Please make sure your upload was valid and try again later.')));
    }
  }
});

// Handle requests for main page with a custom-rendered interface
// The / and /index.html paths are required, the /index.php path retains compatibility with bookmarks for the older PHP-based ImageShare
// The /m and /m/ paths will force enable the small screen mobile layout
app.get(['/', '/m', '/m/', '/index.html', '/index.php'], (req, res) => {
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
  res.end(renderMain({
    userAgent: String(req.get('User-Agent')),
    webHost: connectedHost,
    forceMobileMode: req.path.startsWith('/m')
  }));
});

// Handle requests for uploaded file with direct file access
app.get(['/uploads/*', '/i/*'], async (req, res) => {
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  // Get file path
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
  // Load the file
  try {
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
    const errorMessage = `This upload could not be found, it may have already been deleted. File uploads on this server are set to expire after ${deleteDelay} ${deleteDelay === 1 ? 'minute' : 'minutes'}.`
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderMessage(String(req.get('User-Agent')), connectedHost, req.path.startsWith('/m'), errorMessage));
  }
});

// Handle requests for QR codes
app.get('/qr/*', async (req, res) => {
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  const fileName = req.params[0]; // Example: 0fbb2132-296b-455e-bcbc-107ca9f103e9.jpg
  // Use HTTPS for the link if server is in production mode, or HTTP if not
  const protocol = prodModeEnabled ? 'https' : 'http';
  // Add the domain to the fileName to make a qrLink
  const qrLink = `${protocol}://${connectedHost}/uploads/${fileName}`;
  try {
    // Generate the QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrLink, {
      type: 'image/png',
      width: 350,
      margin: 2,
      errorCorrectionLevel: 'L'
    });
    // Convert image if required
    let qrCodeBuffer;
    // Check if the browser supports PNG images, some browsers don't report image types in the HTTP headers, so there are some additional overrides
    const supportsPng = (
      req.headers.accept.includes('image/png') ||
      req.headers.accept.includes('image/apng') ||
      req.get('User-Agent').includes('Firefox') ||
      req.get('User-Agent').includes('Safari') ||
      req.get('User-Agent').includes('Chrome') ||
      req.get('User-Agent').includes('Nintendo')
    );
    if (supportsPng) {
      qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
      res.setHeader('Content-Type', 'image/png');
    } else {
      // Browser may not support inline PNG images, convert it to JPEG
      qrCodeBuffer = await sharp(Buffer.from(qrCodeDataURL.split(',')[1], 'base64')).jpeg().toBuffer();
      res.setHeader('Content-Type', 'image/jpeg');
    }
    // Send the QR code image as the response
    res.send(qrCodeBuffer);
  } catch (error) {
    res.status(500).send('Error generating QR code');
  }
});

// Link to privacy policy
app.get(['/privacy', '/privacy/', '/m/privacy', '/m/privacy/'], (req, res) => {
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  // Redirect to privacy policy
  if (privacyUrl) {
    res.redirect(privacyUrl);
  } else {
    let errorMessage = 'Your server administrator has not specified a privacy policy.';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderMessage(String(req.get('User-Agent')), connectedHost, req.path.startsWith('/m'), errorMessage));
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

// Export the needed functions and objects for use in other modules
export { sendAnalytics, shortLinkObj };