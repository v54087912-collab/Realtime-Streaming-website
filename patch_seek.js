const fs = require('fs');
let js = fs.readFileSync('player.js', 'utf8');

// Modify the seek function
const searchStr = `    seekToTime(targetTime) {`;
const replaceStr = `    seek(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const clampedPos = Math.max(0, Math.min(1, pos));

        const targetTime = clampedPos * this.video.duration;
        this.seekToTime(targetTime);

        // Immediately start playing if paused
        if (this.video.paused) {
            this.video.play().catch(e => console.error('Play on seek error:', e));
        }
    }

    seekToTime(targetTime) {`;

// The seek method already exists, let's replace it
js = js.replace(/    seek\(e\) \{[\s\S]*?    seekToTime\(targetTime\) \{/g, replaceStr);

fs.writeFileSync('player.js', js);
