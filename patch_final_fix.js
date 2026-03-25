const fs = require('fs');

let js = fs.readFileSync('player.js', 'utf8');

// 1. Fix the Share Link retrieval logic and syntax error
// We need to replace the buggy block that was introduced earlier

const buggyBlock = `        // Check for token or URL in query params
        const params = new URLSearchParams(window.location.search);
        const token = params.get('v');
        const videoUrl = params.get('url');

        if (token) {
            const actualUrl = localStorage.getItem('shareToken_' + token);
            if (actualUrl) {
                // Silently load
                this.urlInput.value = actualUrl;
                this.urlSection.classList.add('hidden');
                this.loadVideo();

                // Keep URL input hidden so user doesn't see real link easily
                this.urlInput.style.display = 'none';
            } else {
                alert('Invalid or expired share link.');
            }
        } else if (videoUrl) {
            this.urlInput.value = decodeURIComponent(videoUrl);
            this.loadVideo();
        }`;

const correctBlock = `        // Check for token or URL in query params
        const params = new URLSearchParams(window.location.search);
        const token = params.get('v');
        const videoUrl = params.get('url');

        if (token) {
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
                });
        } else if (videoUrl) {
            this.urlInput.value = decodeURIComponent(videoUrl);
            this.loadVideo();
        }`;

if (js.includes(buggyBlock)) {
    js = js.replace(buggyBlock, correctBlock);
} else {
    // If it's mangled, we'll try a regex replacement
    js = js.replace(/\/\/ Check for token or URL in query params[\s\S]*?\} else if \(videoUrl\) \{[\s\S]*?this\.loadVideo\(\);\s*\}/, correctBlock);
}

// 2. Fix the savePositionInterval bug (interval not cleared when loading new video)
// We'll clear it in showUrlSection and before starting a new one
const searchSetupEvents = `        this.video.addEventListener('playing', () => {
            this.hideLoading();
            this.isPlaying = true;
            this.playerContainer.classList.add('playing');
            this.playOverlay.classList.add('hidden');

            // Start saving position
            if (!this.savePositionInterval) {`;

const replaceSetupEvents = `        this.video.addEventListener('playing', () => {
            this.hideLoading();
            this.isPlaying = true;
            this.playerContainer.classList.add('playing');
            this.playOverlay.classList.add('hidden');

            // Start saving position
            if (this.savePositionInterval) {
                clearInterval(this.savePositionInterval);
            }
            this.savePositionInterval = setInterval(() => {`;

js = js.replace(searchSetupEvents, replaceSetupEvents);

const searchShowUrl = `    showUrlSection() {
        this.urlSection.classList.remove('hidden');
        this.playerSection.classList.remove('active');

        // Stop buffer management
        this.stopBufferManagement();`;

const replaceShowUrl = `    showUrlSection() {
        this.urlSection.classList.remove('hidden');
        this.playerSection.classList.remove('active');

        // Stop buffer management
        this.stopBufferManagement();

        // Stop saving position
        if (this.savePositionInterval) {
            clearInterval(this.savePositionInterval);
            this.savePositionInterval = null;
        }`;

js = js.replace(searchShowUrl, replaceShowUrl);

fs.writeFileSync('player.js', js);
