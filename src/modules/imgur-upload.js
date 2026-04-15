import fs from 'fs';
import path from 'path';
import { getQrLink } from '../app.js';

// Imgur API key
const imgurClientId = process.env.IMGUR_KEY;

// Supported MIME types for Imgur uploads
// Source: https://apidocs.imgur.com/#c85c9dfc-7487-4de2-9ecd-66f727cf3139
const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/png",
    "image/apng",
    "image/tiff",
    "video/mp4",
    "video/webm",
    "video/x-matroska",
    "video/quicktime",
    "video/x-flv",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/mpeg"
];

/**
 * Upload the file as an Imgur anonymous upload, and return the public post.
 * @param {object} uploadData - Object containing data about the uploaded file.
 * @param {string} uploadData.relativePath - Relative path to the file. Example: `uploads/b296834e-554c-4945-a794-c5284791fe06.JPG`
 * @param {string} uploadData.absolutePath - Absolute path to the file. Example: `/home/node/app/uploads/b296834e-554c-4945-a794-c5284791fe06.JPG`
 * @param {string} uploadData.originalFileName - File name when the file was uploaded. Example: `HNI_0055.JPG`
 * @param {string} uploadData.fileType - MIME type for the file. Example: `image/jpeg`
 * @param {string} uploadData.title - Detected software title for the file. Example: `Pokémon X`
 * @param {string} uploadData.origin - The protocol and hostname being used for the client. Example: `https://myimagesite.com`
 * @returns {object} Object containing the post data.
 */
async function uploadToImgur(uploadData) {
    // Make sure that the current time stamp is past the rate limit reset time
    let rateLimitReset = 0;
    if (fs.existsSync('rateLimitReset.txt')) {
        rateLimitReset = fs.readFileSync('rateLimitReset.txt', 'utf8');
    }
    // Prevent the upload to Imgur if the rate limit is reached
    if (rateLimitReset > Math.floor(Date.now() / 1000)) {
        fs.unlinkSync(uploadData.absolutePath);
        console.log(`Deleted cached file because of the rate limit: ${uploadData.absolutePath}`);
        return { success: false, reason: "Imgur is currently at maximum capacity. Try uploading again later, or use another upload method." };
    }
    // Check for valid file format
    if (!supportedTypes.includes(uploadData.fileType.toLowerCase())) {
        return { success: false, reason: "Your file format is not supported by Imgur." };
    }
    try {
        // Read file into a Blob object
        const fileBuffer = fs.readFileSync(uploadData.absolutePath);
        const fileBlob = new Blob([fileBuffer]);
        // Set up FormData
        const formData = new FormData();
        formData.append('image', fileBlob, path.basename(uploadData.absolutePath));
        formData.append('type', 'file');
        formData.append('title', uploadData.title);
        formData.append('description', 'Uploaded with ImageShare: https://github.com/corbindavenport/imageshare');
        // Send the request
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${imgurClientId}`
            },
            body: formData
        });
        // Read the headers for the amount of requests remaining before rate limit
        const rateLimitRemaining = response.headers.get('x-post-rate-limit-remaining');
        const rateLimitResetHeader = response.headers.get('x-post-rate-limit-reset');
        console.log(`Imgur API Rate Limit Remaining: ${rateLimitRemaining}`);
        // If the rate limit is below 10, save the rate limit reset time to a file
        if (rateLimitRemaining !== null && Number(rateLimitRemaining) < 10) {
            // Get unix timestamp for when the rate limit will be reset by adding the current unix timestamp to the x-post-rate-limit-reset header
            const restTime = (Number(Math.floor(Date.now() / 1000)) + Number(rateLimitResetHeader || 0));
            // Create a file with the rate limit reset time (overwrite if it exists already)
            fs.writeFileSync('rateLimitReset.txt', restTime.toString());
        }
        // Parse the JSON response
        const body = await response.json();
        // Check if upload was successful and handle accordingly        
        if (body.success) {
            // Remove cached file
            fs.unlinkSync(uploadData.absolutePath);
            console.log(`Deleted cached file: ${uploadData.absolutePath}`);
            // Return upload data
            const response = {
                success: true,
                link: `https://imgur.com/${body.data.id}`,
                qrLink: getQrLink(body.data.link),
                qrFooter: "Scan the QR code on another device to view the upload, or type the link.",
            };
            return response;
        } else {
            throw new Error(body.data?.error || 'Upload was not successful');
        }
    } catch (error) {
        console.log(error);
        // Remove cached file and return failure
        if (fs.existsSync(uploadData.absolutePath)) {
            fs.unlinkSync(uploadData.absolutePath);
            console.log(`Deleted cached file: ${uploadData.absolutePath}`);
        }
        return { success: false, reason: `There was an error uploading to Imgur. If you are the administrator of this server, check that you set an API Key and you have not exceeded your rate limit.` };
    }
}

export { uploadToImgur };