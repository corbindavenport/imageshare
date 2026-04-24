import express, { json } from 'express';
import serveStatic from 'serve-static';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import mime from 'mime';
import QRCode from 'qrcode';
import sharp from 'sharp';
import ExifReader from 'exifreader';
import { uploadToImgur } from './modules/imgur-upload.js';
import { uploadToLocal, shortLinkObj } from './modules/local-upload.js';

// Initialize Express and EJS view engine
const app = express();
app.set("views", path.resolve(import.meta.dirname, "./views"));
app.set("view engine", "ejs");
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

// List of MIME types that can be used with the exifreader library
const exifFileTypes = [
  "image/jpeg",
  "image/jxl",
  "image/png",
  "image/tiff",
  "image/tiff-fx",
  "image/heif",
  "image/heic",
  "image/avif",
  "image/webp"
]

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

/**
 * Set a file extension, based on MIME type data.
 * @param {string} mimeType - The detected MIME type. Example: `image/gif`
 * @returns {string} A file extension. Example: `.gif`
 */
function getFileExtension(mimeType) {
  console.log(mimeType)
  const detectedType = mime.getExtension(mimeType);
  if (detectedType) {
    return `.${detectedType}`;
  } else if (mimeType === "image/x-pict") {
    // Mac PICT image format
    return `.pict`
  } else {
    // Return a blank string if no file ending can be found
    return '';
  }
}

/**
 * Create a URL for a QR code image. The actual QR code image is generated on-demand in the `app.get('/qr.png')` function.
 * @param {string} url - The destination URL when the QR code is scanned.
 * @returns {string} The URL for the QR code image.
 */
function getQrLink(url) {
  return `/qr.png?url=${encodeURIComponent(url)}`
}

/**
 * Initialize database of Nintendo 3DS games from built-in JSON files.
 * @returns {Array} Array of game objects.
 */
function init3DSTitles() {
  const gameList = [];
  // hax0kartik databases: https://github.com/hax0kartik/3dsdb/tree/master/jsons
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

/**
 * Initialize database of Nintendo Wii U games from built-in JSON file.
 * @returns {Array} Array of game objects.
 */
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

/**
 * Send pageview or event to Plausible Analytics using the Plausible Events API.
 * 
 * Documentation: https://plausible.io/docs/events-api
 * @param {string} userAgent - The User-Agent header for the client. Example: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0 192.168.65.1`
 * @param {string} clientIp - The client's IP address. Example: `142.251.163.100`
 * @param {object} data - The pageview or event information. Example: `{name: 'pageview', url: '/', domain: 'example.com', referrer: 'https://google.com/'}`
 */
function sendAnalytics(userAgent, clientIp, data) {
  // Remove path from referrer if it's the server's domain
  // This prevents expired upload links from appearing as analytics entries
  if (data?.referrer && data.referrer.includes(data.domain)) {
    data.referrer = new URL(data.referrer).origin
  }
  // Send API call
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

/**
 * Detect the software title from an image, using EXIF data or the file name. If the title isn't detected, return the default title.
 * @param {string} imgFile Path to the file. Example: `uploads/45bdcc79-3be2-43bb-a1c8-7f23993d2445.JPG`
 * @param {string} mimeType The detected MIME type. Example: `image/jpeg`
 * @param {string} originalFileName The file name upon upload. Example: `HNI_0049.JPG`
 * @param {object} tags Object containing EXIF tags.
 * @returns {string} The updated title. Example: `Animal Crossing: New Leaf Update Ver. 1.5`
 */
async function getSoftwareTitle(imgFile, mimeType, originalFileName, tags) {
  // Exit early if file is not a supported file type
  const supportedFileTypes = [
    "image/jpeg",
    "image/png"
  ];
  if (!supportedFileTypes.includes(mimeType)) return defaultFileTitle;
  // Continue reading EXIF data
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

// Set up serve-static middleware to serve files from the 'public' folder
app.use(serveStatic(publicDir));

// Handle POST requests with enctype="multipart/form-data"
app.post(['/'], upload.single('img'), async function (req, res, err) {
  // Use HTTPS for shortlink if server is in production mode, or HTTP if not
  const protocol = prodModeEnabled ? 'https' : 'http';
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  // Maintain mobile mode if enabled
  const useMobileMode = req.headers?.referer?.includes("mobile=true");
  // Process upload
  if (req?.file?.path) {
    console.log(`Uploaded file: ${req.file.originalname}, MIME type ${req.file.mimetype}`);
    // Detect image metadata
    let exifData;
    if (exifFileTypes.includes(req.file.mimetype)) {
      exifData = await ExifReader.load(req.file.path);
    }
    // Detect software title
    const softwareTitle = await getSoftwareTitle(req.file.path, req.file.mimetype, req.file.originalname, exifData);
    // Create data object for all upload methods
    let uploadData = {
      relativePath: req.file.path,
      absolutePath: path.resolve(req.file.path),
      originalFileName: req.file.originalname,
      fileType: req.file.mimetype,
      title: softwareTitle,
      origin: `${protocol}://${connectedHost}`,
      deleteDelay: deleteDelay,
      userAgent: String(req.get('User-Agent')),
      exifData: exifData
    }
    // Upload file with specified method
    let uploadResult, uploadMode;
    if (req.body['upload-type'] === 'imgur') {
      uploadMode = "Imgur"
      uploadResult = await uploadToImgur(uploadData);
    } else {
      uploadMode = "Native";
      uploadResult = await uploadToLocal(uploadData);
    }
    // Decide if the upload was successful or not
    if (uploadResult.success) {
      // Report upload in analytics
      if (plausibleDomain) {
        const data = {
          name: 'Upload',
          props: JSON.stringify({ 'Upload Mode': uploadMode }),
          url: '/',
          domain: uploadData.plausibleDomain
        }
        sendAnalytics(req.headers['user-agent'], (req.headers['x-forwarded-for'] || req.ip), data);
      }
      // Now take the data from the upload response, and display it to the user
      res.render("index", {
        userAgent: String(req.get('User-Agent')),
        webHost: connectedHost,
        uploadLimit: uploadLimit,
        forceMobileMode: useMobileMode,
        qrLink: uploadResult.publicQrImg,
        shortLink: uploadResult.publicFileLink,
        softwareTitle: softwareTitle,
        qrFooter: uploadResult.userInstructions,
        imgurClientId: imgurClientId
      });
    } else {
      // If the upload failed, display an error message to the user
      // Upload Result will contain a reason for the failure, if not set by the uploader's function, it will be set to the universal error message
      const errorMessage = (uploadResult.reason || 'There was an issue uploading your file. Please make sure your upload was valid and try again later.');
      res.status(500).render("message", {
        userAgent: String(req.get('User-Agent')),
        webHost: connectedHost,
        forceMobileMode: useMobileMode,
        message: errorMessage
      });
      return;
    }
  }
});

// Handle requests for main page with a custom-rendered interface
// The / and /index.html paths are required, the /index.php path retains compatibility with bookmarks for the older PHP-based ImageShare
app.get(['/', '/index.html', '/index.php'], (req, res) => {
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  // Send async Plausible analytics page view if enabled
  if (plausibleDomain) {
    const data = {
      name: 'pageview',
      url: '/',
      domain: plausibleDomain,
      referrer: (req.headers['referer'] || '')
    }
    sendAnalytics(req.get('User-Agent'), (req.headers['x-forwarded-for'] || req.ip), data);
  }
  // Send page
  res.render("index", {
    userAgent: String(req.get('User-Agent')),
    webHost: connectedHost,
    uploadLimit: uploadLimit,
    forceMobileMode: req.query?.mobile,
    imgurClientId: imgurClientId
  });
});

// Redirect mobile mode shortcut to URL parameter
app.get(["/m", "/m/index.html"], function (req, res) {
  res.redirect("/?mobile=true");
})

// Handle requests for uploaded file with direct file access
app.get([/\/uploads\//, '/i/:shortcode'], async (req, res) => {
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  // Maintain mobile mode if enabled
  const useMobileMode = req.headers?.referer?.includes("mobile=true");
  // Get file path
  let reqPath = '';
  if (req.params?.shortcode && (req.params?.shortcode in shortLinkObj)) {
    // Request from shortlink
    reqPath = shortLinkObj[req.params?.shortcode];
  } else {
    // Request from full path
    reqPath = req.url;
  }
  // Load the file
  try {
    const filePath = path.join(mainDir, reqPath);
    // Check if the file exists before attempting to read it
    if (!fs.existsSync(filePath)) {
      const errorMessage = `This upload could not be found, it may have already been deleted. File uploads on this server are set to expire after ${deleteDelay} ${deleteDelay === 1 ? 'minute' : 'minutes'}.`
      res.status(404).render("message", {
        userAgent: String(req.get('User-Agent')),
        webHost: connectedHost,
        forceMobileMode: useMobileMode,
        message: errorMessage
      });
      return;
    }
    let data = await fs.promises.readFile(filePath);
    // Set MIME type on image download
    const mimeType = mime.getType(filePath);
    res.setHeader('Content-Type', mimeType);
    // Force browser to download instead of preview
    res.setHeader('Content-Disposition', `Attachment;filename="${path.basename(filePath)}"`);
    // Send file to client
    res.send(data);
  } catch (e) {
    const errorMessage = 'There was an unknown error reading this file.'
    res.status(200).render("message", {
      userAgent: String(req.get('User-Agent')),
      webHost: connectedHost,
      forceMobileMode: useMobileMode,
      message: errorMessage
    });
    return;
  }
});

// Handle requests for QR codes
// Example URL: /qr.png?url=https%3A%2F%2Fi.imgur.com%2FHpuIqt4.jpeg
app.get("/qr.png", async (req, res) => {
  // Generate the QR code
  const qrText = (req.query?.url || "Error generating QR code.");
  const qrCodeDataURL = await QRCode.toDataURL(qrText, {
    type: 'image/png',
    width: 350,
    margin: 2,
    errorCorrectionLevel: 'L'
  });
  // Convert QR code image to JPEG if the browser does not support PNG
  let qrCodeBuffer;
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
    qrCodeBuffer = await sharp(Buffer.from(qrCodeDataURL.split(',')[1], 'base64')).jpeg().toBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
  }
  // Send the QR code image as the response
  res.send(qrCodeBuffer);
});

// Link to privacy policy
app.get("/privacy", (req, res) => {
  // Use provided domain name if possible, or connected hostname as fallback
  const connectedHost = (webDomain || req.headers['host']);
  // Maintain mobile mode if enabled
  const useMobileMode = req.headers?.referer?.includes("mobile=true");
  // Redirect to privacy policy
  if (privacyUrl) {
    res.redirect(privacyUrl);
  } else {
    const errorMessage = 'Your server administrator has not specified a privacy policy.'
    res.status(404).render("message", {
      userAgent: String(req.get('User-Agent')),
      webHost: connectedHost,
      forceMobileMode: useMobileMode,
      message: errorMessage
    });
    return;
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

// Export shared functions for upload modules
export { defaultFileTitle, getQrLink }