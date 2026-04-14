import path from 'path';
import fs from 'fs';
import { getQrLink } from '../app.js';

// Object to store temporary shortlinks
const shortLinkObj = {};

// Function to handle local uploads
async function uploadToLocal(uploadData) {
    return new Promise((resolve) => {
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
        resolve(response);
    });
}

export { uploadToLocal, shortLinkObj };