import path from 'path';
import fs from 'fs';
import { sendAnalytics, shortLinkObj } from '../app.js';

// Function to handle local uploads
async function uploadToLocal(filePath, protocol, connectedHost, req, plausibleDomain, deleteDelay) {
    const fullPath = path.resolve(filePath.path);
    return new Promise((resolve) => {
        console.log(shortLinkObj);
        let shortLink;
        do {
            shortLink = crypto.randomUUID().toString().substring(0, 5);
        } while (shortLinkObj[shortLink]);
        shortLinkObj[shortLink] = filePath.path;
        console.log(`Created shortlink: ${protocol}://${connectedHost}/i/${shortLink}`);

        // Schedule timeout to delete file and shortlink
        const delay = deleteDelay * 60 * 1000;
        setTimeout(async () => {
            // Delete shortlink
            delete shortLinkObj[shortLink];
            console.log(`Deleted shortlink: ${protocol}://${connectedHost}/i/${shortLink}`);
            // Delete file
            if (filePath) {
                fs.unlinkSync(fullPath);
                console.log(`Deleted file: ${fullPath}`);
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
        // Set the footer message for qr panel
        const qrFooter = `Scan the QR code or type the link on another device to download the file. You have ${deleteDelay} ${deleteDelay === 1 ? 'minute' : 'minutes'} minutes to save your file before it is deleted.`;
        // Return success and display results to user :3
        resolve({ success: true, link: `${protocol}://${connectedHost}/i/${shortLink}`, qrLink: `${protocol}://${connectedHost}/${filePath.path.replace('uploads/', 'qr/')}`, qrFooter });
    });
}

export { uploadToLocal };