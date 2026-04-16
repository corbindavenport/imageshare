import path from 'path';
import fs from 'fs';
import { spawn } from 'node:child_process';
import { defaultFileTitle, getQrLink } from '../app.js';

// Object to store temporary shortlinks
const shortLinkObj = {};

// Time delay for automatically deleting files, in minutes
const deleteDelay = (parseInt(process.env.AUTODELETE_TIME, 10) || 2);

// File formats that are enabled for EXIF modification
const supportedExifFiles = [
    "image/jpeg",
    "image/tiff",
    "image/png"
]

/**
 * Upload a file with ImageShare's built-in server, and return the live link.
 * @param {object} uploadData - Object containing data about the uploaded file.
 * @param {string} uploadData.relativePath - Relative path to the file. Example: `uploads/b296834e-554c-4945-a794-c5284791fe06.JPG`
 * @param {string} uploadData.absolutePath - Absolute path to the file. Example: `/home/node/app/uploads/b296834e-554c-4945-a794-c5284791fe06.JPG`
 * @param {string} uploadData.originalFileName - File name when the file was uploaded. Example: `HNI_0055.JPG`
 * @param {string} uploadData.fileType - MIME type for the file. Example: `image/jpeg`
 * @param {string} uploadData.title - Detected software title for the file. Example: `Pokémon X`
 * @param {string} uploadData.origin - The protocol and hostname being used for the client. Example: `https://myimagesite.com`
 * @returns {object} Object containing the live file data.
 */
async function uploadToLocal(uploadData) {
    // Modify EXIF data on uploaded file
    if (supportedExifFiles.includes(uploadData.fileType.toLowerCase())) {
        const exifOptions = [];
        // Add detected software title to image description/captaion in EXIF data
        if (uploadData.title != defaultFileTitle) {
            exifOptions.push(`-Caption-Abstract=${uploadData.title}`, `-ImageDescription=${uploadData.title}`)
        }
        // Add "Nintendo" make and "Nintendo Wii U" model to EXIF data for Wii U images, to match EXIF data for 3DS images
        if (uploadData.originalFileName.startsWith('WiiU_') && (uploadData.title != defaultFileTitle)) {
            exifOptions.push('-Make=Nintendo', '-Model=Nintendo Wii U');
        }
        // Add original filename to EXIF data (primarily useful for debugging) and record of metadata editing
        exifOptions.push("-MetadataEditingSoftware=ImageShare", `-ImageTitle=${uploadData.originalFileName}`);
        // Run exiftool asynchronously to write modified EXIF data
        exifOptions.push("-overwrite_original", uploadData.absolutePath)
        spawn('exiftool', exifOptions);
    }
    // Create shortlink
    let shortLink;
    do {
        shortLink = crypto.randomUUID().toString().substring(0, 5);
    } while (shortLinkObj[shortLink]);
    shortLinkObj[shortLink] = uploadData.relativePath;
    console.log(`Created shortlink: ${uploadData.origin}/i/${shortLink}`);
    // Schedule timeout to delete file and shortlink
    const delay = deleteDelay * 60 * 1000;
    setTimeout(async () => {
        // Delete shortlink
        delete shortLinkObj[shortLink];
        console.log(`Deleted shortlink: ${uploadData.origin}/i/${shortLink}`);
        // Delete file
        if (uploadData.absolutePath) {
            fs.unlinkSync(uploadData.absolutePath);
            console.log(`Deleted file: ${uploadData.absolutePath}`);
        }
    }, delay);
    // Return upload data
    const response = {
        success: true,
        link: `${uploadData.origin}/i/${shortLink}`,
        qrLink: getQrLink(`${uploadData.origin}/${uploadData.relativePath}`),
        qrFooter: `Scan the QR code on another device to download the file, or type the link. You have ${deleteDelay} ${deleteDelay === 1 ? 'minute' : 'minutes'} to save your file before it is deleted.`
    }
    return response;
}

export { uploadToLocal, shortLinkObj };