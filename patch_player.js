const fs = require('fs');
let js = fs.readFileSync('player.js', 'utf8');

// 1. Add references to new DOM elements
let searchStr = `        this.pipBtn = document.getElementById('pipBtn');`;
let replaceStr = `        this.pipBtn = document.getElementById('pipBtn');
        this.audioContainer = document.getElementById('audioContainer');
        this.audioBtn = document.getElementById('audioBtn');
        this.audioMenu = document.getElementById('audioMenu');
        this.audioTracksList = document.getElementById('audioTracksList');`;
js = js.replace(searchStr, replaceStr);

// 2. Bind events
searchStr = `        // Speed Menu
        this.speedBtn.addEventListener('click', (e) => {`;
replaceStr = `        // Audio Menu
        if (this.audioBtn && this.audioMenu) {
            this.audioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.audioMenu.classList.toggle('active');

                // Close other menus
                if (this.speedMenu) this.speedMenu.classList.remove('active');
                if (document.getElementById('downloadMenu')) document.getElementById('downloadMenu').classList.remove('active');
            });

            // Close audio menu when clicking outside
            document.addEventListener('click', () => {
                this.audioMenu.classList.remove('active');
            });

            // Stop propagation on menu click
            this.audioMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Speed Menu
        this.speedBtn.addEventListener('click', (e) => {`;
js = js.replace(searchStr, replaceStr);

// Also close audio menu when speed menu is clicked
searchStr = `        this.speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.speedMenu.classList.toggle('active');`;
replaceStr = `        this.speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.speedMenu.classList.toggle('active');

            // Close other menus
            if (this.audioMenu) this.audioMenu.classList.remove('active');
            if (document.getElementById('downloadMenu')) document.getElementById('downloadMenu').classList.remove('active');`;
js = js.replace(searchStr, replaceStr);

// 3. Populate Audio Tracks
searchStr = `        this.video.addEventListener('loadedmetadata', () => {
            // Clear load timeout
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }

            this.durationEl.textContent = this.formatTime(this.video.duration);
            this.hideLoading();
            // Start buffer management once we have metadata
            this.startBufferManagement();
            // Initialize speed status
            this.updateSpeedStatus();

            console.log(\`Video loaded: \${this.formatTime(this.video.duration)} duration\`);
        });`;
replaceStr = `        this.video.addEventListener('loadedmetadata', () => {
            // Clear load timeout
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }

            this.durationEl.textContent = this.formatTime(this.video.duration);
            this.hideLoading();
            // Start buffer management once we have metadata
            this.startBufferManagement();
            // Initialize speed status
            this.updateSpeedStatus();

            // Check and populate audio tracks
            this.initAudioTracks();

            console.log(\`Video loaded: \${this.formatTime(this.video.duration)} duration\`);
        });`;
js = js.replace(searchStr, replaceStr);

// 4. Add initAudioTracks method
searchStr = `    loadVideo() {`;
replaceStr = `    initAudioTracks() {
        if (!this.video.audioTracks || this.video.audioTracks.length <= 1) {
            // Hide the audio switcher if 1 or 0 tracks available, or API not supported
            if (this.audioContainer) this.audioContainer.style.display = 'none';
            return;
        }

        if (this.audioContainer) this.audioContainer.style.display = 'block';
        if (!this.audioTracksList) return;

        this.audioTracksList.innerHTML = '';

        for (let i = 0; i < this.video.audioTracks.length; i++) {
            const track = this.video.audioTracks[i];
            const btn = document.createElement('button');
            btn.className = 'audio-option' + (track.enabled ? ' active' : '');

            let trackLabel = track.label || track.language || \`Track \${i + 1}\`;

            btn.innerHTML = \`
                <span class="audio-label">\${trackLabel}</span>
                <svg class="audio-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            \`;

            btn.addEventListener('click', () => {
                // Disable all tracks
                for (let j = 0; j < this.video.audioTracks.length; j++) {
                    this.video.audioTracks[j].enabled = false;
                }
                // Enable selected track
                this.video.audioTracks[i].enabled = true;

                // Update UI
                const allOpts = this.audioTracksList.querySelectorAll('.audio-option');
                allOpts.forEach(opt => opt.classList.remove('active'));
                btn.classList.add('active');

                this.audioMenu.classList.remove('active');
            });

            this.audioTracksList.appendChild(btn);
        }
    }

    loadVideo() {`;
js = js.replace(searchStr, replaceStr);

fs.writeFileSync('player.js', js);
