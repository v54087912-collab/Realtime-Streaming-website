const fs = require('fs');

let js = fs.readFileSync('player.js', 'utf8');

// Replace the buggy Share logic and initial check
const searchStr1 = `        // Share Button
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.currentUrl) return;

                const token = Math.random().toString(36).substring(2, 8);
                localStorage.setItem('shareToken_' + token, this.currentUrl);

                const shareUrl = window.location.origin + window.location.pathname + '?v=' + token;
                this.shareLinkInput.value = shareUrl;

                this.shareToast.classList.add('active');
                this.shareSuccessMsg.style.display = 'none';

                // Hide after 5 seconds
                setTimeout(() => {
                    this.shareToast.classList.remove('active');
                }, 5000);
            });

            this.copyShareBtn.addEventListener('click', () => {
                this.shareLinkInput.select();
                navigator.clipboard.writeText(this.shareLinkInput.value).then(() => {
                    this.shareSuccessMsg.style.display = 'block';
                });
            });
        }`;

const replaceStr1 = `        // Share Button
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!this.currentUrl) return;

                try {
                    // Call backend to store token map
                    const res = await fetch('/api/share', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: this.currentUrl })
                    });

                    const data = await res.json();
                    if (!data.token) throw new Error('No token returned');

                    const shareUrl = window.location.origin + window.location.pathname + '?v=' + data.token;
                    this.shareLinkInput.value = shareUrl;

                    this.shareToast.classList.add('active');
                    this.shareSuccessMsg.style.display = 'none';

                    // Hide after 5 seconds
                    setTimeout(() => {
                        this.shareToast.classList.remove('active');
                    }, 5000);
                } catch (err) {
                    console.error('Error generating share link:', err);
                    alert('Error generating share link.');
                }
            });

            this.copyShareBtn.addEventListener('click', () => {
                this.shareLinkInput.select();
                navigator.clipboard.writeText(this.shareLinkInput.value).then(() => {
                    this.shareSuccessMsg.style.display = 'block';
                });
            });
        }`;

js = js.replace(searchStr1, replaceStr1);

const searchStr2 = `        // Check for token or URL in query params
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

const replaceStr2 = `        // Check for token or URL in query params
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

js = js.replace(searchStr2, replaceStr2);

fs.writeFileSync('player.js', js);
