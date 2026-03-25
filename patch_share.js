const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Insert Share Button next to Download Button
const searchBtnStr = `                                <!-- Download Button -->`;
const replaceBtnStr = `                                <!-- Share Button -->
                                <button class="ctrl-btn" id="shareBtn" title="Share">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                </button>

                                <!-- Download Button -->`;

html = html.replace(searchBtnStr, replaceBtnStr);

// Insert Share Toast
const searchToastStr = `                <!-- Back Button -->`;
const replaceToastStr = `                <!-- Share Toast -->
                <div class="share-toast" id="shareToast">
                    <div class="share-toast-header">Share Link</div>
                    <div class="share-toast-body">
                        <input type="text" id="shareLinkInput" readonly>
                        <button id="copyShareBtn">Copy</button>
                    </div>
                    <div class="share-toast-success" id="shareSuccessMsg">Link Copied!</div>
                </div>

                <!-- Back Button -->`;

html = html.replace(searchToastStr, replaceToastStr);
fs.writeFileSync('index.html', html);


let js = fs.readFileSync('player.js', 'utf8');

// References
let searchJsRef = `        this.retryBtn = document.getElementById('retryBtn');`;
let replaceJsRef = `        this.retryBtn = document.getElementById('retryBtn');

        // Share Feature
        this.shareBtn = document.getElementById('shareBtn');
        this.shareToast = document.getElementById('shareToast');
        this.shareLinkInput = document.getElementById('shareLinkInput');
        this.copyShareBtn = document.getElementById('copyShareBtn');
        this.shareSuccessMsg = document.getElementById('shareSuccessMsg');`;

js = js.replace(searchJsRef, replaceJsRef);


// Bindings
let searchJsBind = `        // Speed Menu`;
let replaceJsBind = `        // Share Button
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
        }

        // Speed Menu`;

js = js.replace(searchJsBind, replaceJsBind);

// Check for token on load
let searchInit = `        // Check for URL in query params
        const params = new URLSearchParams(window.location.search);
        const videoUrl = params.get('url');`;
let replaceInit = `        // Check for token or URL in query params
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
        } else if (videoUrl) {`;

js = js.replace(searchInit, replaceInit);

fs.writeFileSync('player.js', js);
