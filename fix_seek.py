import re

with open('player.js', 'r') as f:
    content = f.read()

# Make seek explicitly resume playback.
# In seek(e):
new_seek = """    seek(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const clampedPos = Math.max(0, Math.min(1, pos));
        this.seekToTime(clampedPos * this.video.duration);
        if (this.video.paused) {
            this.video.play().catch(e => console.error('Play error after seek:', e));
        }
    }"""

content = re.sub(r'    seek\(e\) \{[\s\S]*?this\.seekToTime\(clampedPos \* this\.video\.duration\);\n    \}', new_seek, content)

with open('player.js', 'w') as f:
    f.write(content)
