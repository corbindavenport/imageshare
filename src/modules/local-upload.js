import path from 'path';
import fs from 'fs';
import { spawn } from 'node:child_process';
import { defaultFileTitle, getQrLink } from '../app.js';

// Object to store temporary shortlinks
const shortLinkObj = {};

// Function to handle local uploads
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
    const delay = uploadData.deleteDelay * 60 * 1000;
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
        qrFooter: `Scan the QR code on another device to download the file, or type the link. You have ${uploadData.deleteDelay} ${uploadData.deleteDelay === 1 ? 'minute' : 'minutes'} to save your file before it is deleted.`
    }
    return response;
}

export { uploadToLocal, shortLinkObj };