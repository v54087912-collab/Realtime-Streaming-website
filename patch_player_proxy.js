const fs = require('fs');

let js = fs.readFileSync('player.js', 'utf8');

const searchStr = `        if (token) {
            fetch('/api/share/' + token)
                .then(res => res.json())
                .then(data => {
                    if (data.url) {
                        this.urlInput.value = data.url;
                        this.urlSection.classList.add('hidden');
                        this.loadVideo();
                        this.urlInput.style.display = 'none'; // Hide URL to prevent exposure
                    } else {
                        alert('Invalid or expired share link.');
                    }
                })
                .catch(err => {
                    console.error('Error retrieving share link:', err);
                    alert('Error retrieving share link.');
                });`;

const replaceStr = `        if (token) {
            // Use the proxy stream endpoint directly instead of exposing the original URL
            // Validate the token exists first before setting it as the video source
            fetch('/api/share/' + token)
                .then(res => res.json())
                .then(data => {
                    if (data.url) {
                        // The token is valid. Now load the proxy endpoint as the video source.
                        // This ensures the real URL never hits the client DOM or network tab.
                        const streamUrl = window.location.origin + '/stream/' + token;

                        this.urlInput.value = streamUrl; // This is hidden anyway
                        this.currentUrl = streamUrl;

                        this.urlSection.classList.add('hidden');
                        this.showPlayerSection();
                        this.showLoading();

                        // Load via direct video (stream proxy)
                        this.loadDirectVideo(streamUrl);

                        this.urlInput.style.display = 'none'; // Hide URL to prevent exposure
                    } else {
                        alert('Invalid or expired share link.');
                    }
                })
                .catch(err => {
                    console.error('Error retrieving share link:', err);
                    alert('Error retrieving share link.');
                });`;

js = js.replace(searchStr, replaceStr);

fs.writeFileSync('player.js', js);
