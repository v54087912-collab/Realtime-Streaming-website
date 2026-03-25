const fs = require('fs');
let js = fs.readFileSync('player.js', 'utf8');

// References
let searchStr = `        this.audioBtn = document.getElementById('audioBtn');`;
let replaceStr = `        this.audioBtn = document.getElementById('audioBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadMenu = document.getElementById('downloadMenu');`;
js = js.replace(searchStr, replaceStr);

// Bindings
searchStr = `        // Audio Menu`;
replaceStr = `        // Download Menu
        if (this.downloadBtn && this.downloadMenu) {
            this.downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadMenu.classList.toggle('active');

                // Close other menus
                if (this.speedMenu) this.speedMenu.classList.remove('active');
                if (this.audioMenu) this.audioMenu.classList.remove('active');
            });

            // Handle download options
            document.querySelectorAll('.download-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const quality = e.target.dataset.quality;
                    this.triggerDownload(quality);
                    this.downloadMenu.classList.remove('active');
                });
            });

            // Close download menu when clicking outside
            document.addEventListener('click', () => {
                this.downloadMenu.classList.remove('active');
            });

            this.downloadMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Audio Menu`;
js = js.replace(searchStr, replaceStr);

// Also close download menu when speed/audio menus are clicked
searchStr = `                if (document.getElementById('downloadMenu')) document.getElementById('downloadMenu').classList.remove('active');`;
// This line already exists from previous patch, so we just need to ensure it's there.

// Add triggerDownload method
searchStr = `    initAudioTracks() {`;
replaceStr = `    triggerDownload(quality) {
        if (!this.currentUrl) {
            alert('No video loaded to download.');
            return;
        }

        // Displaying a small temporary toast could be nicer, but alert works simply too.
        console.log(\`Starting download for \${quality} quality...\`);

        const a = document.createElement('a');

        // In a real system with multiple qualities, you'd append ?quality=1080p or swap URLs
        // For this frontend-only implementation, we just use the current video URL
        // appending a dummy parameter to simulate quality selection
        const downloadUrl = new URL(this.currentUrl, window.location.href);
        if (quality !== 'original') {
            downloadUrl.searchParams.set('quality', quality);
        }

        a.href = downloadUrl.toString();

        // Generate a reasonable filename
        const filename = 'video_' + (quality || 'original') + '.mp4';
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    initAudioTracks() {`;
js = js.replace(searchStr, replaceStr);

fs.writeFileSync('player.js', js);
