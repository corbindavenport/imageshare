import path from 'path';
import fs from 'fs';
import { spawn } from 'node:child_process';
import { defaultFileTitle, getQrLink } from '../app.js';

// Object to store temporary shortlinks
const shortLinkObj = {};

// Time delay for automatically deleting files, in minutes
const deleteDelay = (parseInt(process.env.AUTODELETE_TIME, 10) || 2);

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
    // If custom software title is detected, run exiftool to save it to the image description
    // If the image is a detected Wii U software title, also add the make and model to the EXIF data
    if (uploadData.originalFileName.startsWith('WiiU_') && (uploadData.title != defaultFileTitle)) {
        spawn('exiftool', [
            `-Caption-Abstract=${uploadData.title}`,
            `-ImageDescription=${uploadData.title}`,
            '-Model=Nintendo Wii U',
            '-Make=Nintendo',
            `-overwrite_original`,
            uploadData.absolutePath
        ]);
    } else if (uploadData.title != defaultFileTitle) {
        spawn('exiftool', [
            `-Caption-Abstract=${uploadData.title}`,
            `-ImageDescription=${uploadData.title}`,
            `-overwrite_original`,
            uploadData.absolutePath
        ]);
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