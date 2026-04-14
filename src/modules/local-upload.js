import path from 'path';
import fs from 'fs';

// Object to store temporary shortlinks
const shortLinkObj = {};

// Function to handle local uploads
async function uploadToLocal(uploadData) {
    return new Promise((resolve) => {
        let shortLink;
        do {
            shortLink = crypto.randomUUID().toString().substring(0, 5);
        } while (shortLinkObj[shortLink]);
        shortLinkObj[shortLink] = uploadData.filePath;
        console.log(`Created shortlink: ${uploadData.origin}/i/${shortLink}`);

        // Schedule timeout to delete file and shortlink
        const delay = uploadData.deleteDelay * 60 * 1000;
        setTimeout(async () => {
            // Delete shortlink
            delete shortLinkObj[shortLink];
            console.log(`Deleted shortlink: ${uploadData.origin}/i/${shortLink}`);
            // Delete file
            if (uploadData.filePath) {
                fs.unlinkSync(uploadData.filePath);
                console.log(`Deleted file: ${uploadData.filePath}`);
            }
        }, delay);
        // Set the footer message for qr panel
        const qrFooter = `Scan the QR code or type the link on another device to download the file. You have ${uploadData.deleteDelay} ${uploadData.deleteDelay === 1 ? 'minute' : 'minutes'} to save your file before it is deleted.`;
        // Return success and display results to user :3
        resolve({ success: true, link: `${uploadData.origin}/i/${shortLink}`, qrLink: `${uploadData.filePath.replace('uploads/', '/qr/')}`, qrFooter });
    });
}

export { uploadToLocal, shortLinkObj };