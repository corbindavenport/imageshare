import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import { sendAnalytics } from '../app.js';

async function uploadToImgur(filePath, softwareTitle, imgurClientId, plausibleDomain, request) {
    // Get the full path of the file we are uploading
    const fullPath = path.resolve(filePath.path);

    // Send Imgur upload request with the file
    return new Promise((resolve) => {
        // Make sure that the current time stamp is past the rate limit reset time
        let rateLimitReset = 0;
        if (fs.existsSync('rateLimitReset.txt')) {
            rateLimitReset = fs.readFileSync('rateLimitReset.txt', 'utf8');
        }
        if (rateLimitReset > Math.floor(Date.now() / 1000)) {
            // Prevent the upload to imgur and return the reason why to the user
            fs.unlinkSync(fullPath);
            console.log(`Deleted cached file because of the rate limit: ${fullPath}`);
            return resolve({ success: false, reason: `Imgur is currently at max capacity, so you will have to try again later. You can still upload to ImageShare though!` });
        }

        // Set up Imgur API request
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath.path));
        formData.append('type', 'file');
        formData.append('title', `${softwareTitle}`);
        formData.append('description', 'Uploaded by ImageShare (github -> corbindavenport/imageshare)');

        let options = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.imgur.com/3/image',
            headers: {
                'Authorization': `Client-ID ${imgurClientId}`,
                ...formData.getHeaders()
            },
            data: formData
        };

        // Send the request and handle the response
        axios.request(options)
            // Get header response for x-post-rate-limit-remaining
            .then(response => {
                // Read the headers for the amount of requests remaining before rate limit
                console.log(`Imgur API Rate Limit Remaining: ${response.headers['x-post-rate-limit-remaining']}`);

                // If the rate limit is below 10, save the rate limit reset time to a file
                if (response.headers['x-post-rate-limit-remaining'] < 10) {
                    // Get unix timestamp for when the rate limit will be reset by adding the current unix timestamp to the x-post-rate-limit-reset header
                    const restTime = (Number(Math.floor(Date.now() / 1000)) + Number(response.headers['x-post-rate-limit-reset']));
                    // Create a file with the rate limit reset time (overwrite if it exists already)
                    fs.writeFileSync('rateLimitReset.txt', restTime.toString());
                }
                return response.data;
            })
            .then(body => {
                // Check if upload was successful and handle accordingly        
                if (body.success) {
                    //Remove cached file
                    fs.unlinkSync(fullPath);
                    console.log(`Deleted cached file: ${fullPath}`);
                    // Return success and the link to the Imgur upload
                    resolve({ success: true, link: `https://imgur.com/${body.data.id}`, qrLink: `/qr/${body.data.link}` });
                }

                // Send async Plausible analytics page view if enabled
                if (plausibleDomain) {
                    const data = {
                        name: 'Upload',
                        props: JSON.stringify({ 'Upload Mode': 'Imgur' }),
                        url: '/',
                        domain: plausibleDomain
                    };
                    sendAnalytics(request.get('User-Agent'), (request.headers['x-forwarded-for'] || request.ip), data);
                }
            })
            .catch(error => {
                console.log(error)
                // Remove cached file and return failure
                fs.unlinkSync(fullPath);
                console.log(`Deleted cached file: ${fullPath}`);
                resolve({ success: false, reason: `There was an error uploading to Imgur. Make sure that your API Key is set and you haven't exceeded your rate limit.` });
            });
    });
}

export { uploadToImgur };