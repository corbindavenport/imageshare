import path from 'path';
import fs from 'fs';
import { sendAnalytics } from '../app.js';

// Object to store temporary shortlinks
const shortLinkObj = {};

// Function to handle local uploads
async function uploadToLocal(uploadData) {
    const fullPath = path.resolve(uploadData.filePath);
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
                fs.unlinkSync(fullPath);
                console.log(`Deleted file: ${fullPath}`);
            }
        }, delay);

        // Send async Plausible analytics page view if enabled
        if (uploadData.plausibleDomain) {
            const data = {
                name: 'Upload',
                props: JSON.stringify({ 'Upload Mode': 'Native' }),
                url: '/',
                domain: uploadData.plausibleDomain
            }
            sendAnalytics(uploadData.req.get('User-Agent'), (uploadData.req.headers['x-forwarded-for'] || uploadData.req.ip), data);
        }
        // Set the footer message for qr panel
        const qrFooter = `Scan the QR code or type the link on another device to download the file. You have ${uploadData.deleteDelay} ${uploadData.deleteDelay === 1 ? 'minute' : 'minutes'} to save your file before it is deleted.`;
        // Return success and display results to user :3
        resolve({ success: true, link: `${uploadData.origin}/i/${shortLink}`, qrLink: `${uploadData.filePath.replace('uploads/', '/qr/')}`, qrFooter });
    });
}

export { uploadToLocal, shortLinkObj };