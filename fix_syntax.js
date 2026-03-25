const fs = require('fs');

let js = fs.readFileSync('player.js', 'utf8');

const brokenInterval = `            this.savePositionInterval = setInterval(() => {
                this.savePositionInterval = setInterval(() => {
                    if (this.currentUrl && this.video.currentTime > 0) {
                        // Generate a simple hash/id from url
                        const videoId = btoa(this.currentUrl).substring(0, 20);
                        localStorage.setItem('resumePos_' + videoId, this.video.currentTime);
                    }
                }, 5000);
            }`;

const fixedInterval = `            this.savePositionInterval = setInterval(() => {
                if (this.currentUrl && this.video.currentTime > 0) {
                    // Generate a simple hash/id from url
                    const videoId = btoa(this.currentUrl).substring(0, 20);
                    localStorage.setItem('resumePos_' + videoId, this.video.currentTime);
                }
            }, 5000);`;

js = js.replace(brokenInterval, fixedInterval);

fs.writeFileSync('player.js', js);
