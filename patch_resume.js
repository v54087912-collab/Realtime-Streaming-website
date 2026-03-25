const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Insert Resume Toast
const searchToastStr = `                <!-- Share Toast -->`;
const replaceToastStr = `                <!-- Resume Prompt -->
                <div class="resume-toast" id="resumeToast">
                    <div class="resume-toast-header">Resume Playback?</div>
                    <div class="resume-toast-msg" id="resumeMsg">Resume from 00:00?</div>
                    <div class="resume-toast-actions">
                        <button id="resumeBtn">Resume</button>
                        <button id="startOverBtn">Start Over</button>
                    </div>
                </div>

                <!-- Share Toast -->`;

html = html.replace(searchToastStr, replaceToastStr);
fs.writeFileSync('index.html', html);


let js = fs.readFileSync('player.js', 'utf8');

// Add references
let searchJsRef = `        // Share Feature`;
let replaceJsRef = `        // Resume Feature
        this.resumeToast = document.getElementById('resumeToast');
        this.resumeMsg = document.getElementById('resumeMsg');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.startOverBtn = document.getElementById('startOverBtn');

        // Share Feature`;
js = js.replace(searchJsRef, replaceJsRef);

// Setup interval to save time
let searchSetupEvents = `        this.video.addEventListener('playing', () => {
            this.hideLoading();
            this.isPlaying = true;
            this.playerContainer.classList.add('playing');
            this.playOverlay.classList.add('hidden');
        });`;
let replaceSetupEvents = `        this.video.addEventListener('playing', () => {
            this.hideLoading();
            this.isPlaying = true;
            this.playerContainer.classList.add('playing');
            this.playOverlay.classList.add('hidden');

            // Start saving position
            if (!this.savePositionInterval) {
                this.savePositionInterval = setInterval(() => {
                    if (this.currentUrl && this.video.currentTime > 0) {
                        // Generate a simple hash/id from url
                        const videoId = btoa(this.currentUrl).substring(0, 20);
                        localStorage.setItem('resumePos_' + videoId, this.video.currentTime);
                    }
                }, 5000);
            }
        });`;
js = js.replace(searchSetupEvents, replaceSetupEvents);

// Stop interval and clear on end
let searchEnded = `        this.video.addEventListener('ended', () => {
            this.isPlaying = false;
            this.playerContainer.classList.remove('playing');
            this.playOverlay.classList.remove('hidden');
        });`;
let replaceEnded = `        this.video.addEventListener('ended', () => {
            this.isPlaying = false;
            this.playerContainer.classList.remove('playing');
            this.playOverlay.classList.remove('hidden');

            // Clear saved position
            if (this.currentUrl) {
                const videoId = btoa(this.currentUrl).substring(0, 20);
                localStorage.removeItem('resumePos_' + videoId);
            }
        });`;
js = js.replace(searchEnded, replaceEnded);

// Check on load
let searchLoaded = `        this.video.addEventListener('loadedmetadata', () => {
            // Clear load timeout
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }`;
let replaceLoaded = `        this.video.addEventListener('loadedmetadata', () => {
            // Clear load timeout
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }

            // Check for resume
            if (this.currentUrl) {
                const videoId = btoa(this.currentUrl).substring(0, 20);
                const savedPos = parseFloat(localStorage.getItem('resumePos_' + videoId));

                if (savedPos && savedPos > 5 && savedPos < this.video.duration - 5) {
                    this.resumeMsg.textContent = \`Resume from \${this.formatTime(savedPos)}?\`;
                    this.resumeToast.classList.add('active');

                    const handleResume = () => {
                        this.video.currentTime = savedPos;
                        this.video.play();
                        this.resumeToast.classList.remove('active');
                        cleanup();
                    };

                    const handleStartOver = () => {
                        localStorage.removeItem('resumePos_' + videoId);
                        this.video.play();
                        this.resumeToast.classList.remove('active');
                        cleanup();
                    };

                    const cleanup = () => {
                        this.resumeBtn.removeEventListener('click', handleResume);
                        this.startOverBtn.removeEventListener('click', handleStartOver);
                    };

                    this.resumeBtn.addEventListener('click', handleResume);
                    this.startOverBtn.addEventListener('click', handleStartOver);

                    // Auto hide toast after 10s if ignored
                    setTimeout(() => {
                        this.resumeToast.classList.remove('active');
                        cleanup();
                    }, 10000);
                }
            }`;
js = js.replace(searchLoaded, replaceLoaded);

fs.writeFileSync('player.js', js);
