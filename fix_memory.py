import re

with open('player.js', 'r') as f:
    content = f.read()

# Replace checkResume to auto-play from where user left off
# The prompt says: "fir sa Web Open kara tho Movie Wahi sa Start honi chaiya Jaha User na Stop ke thee"
# So instead of a prompt, we'll auto-seek.
# We should keep the code working and just update the logic to seek and play.

new_check_resume = """    checkResume() {
        const movieId = this.getMovieId();
        if (!movieId) return;

        const savedTime = localStorage.getItem(movieId);
        if (savedTime && parseFloat(savedTime) > 5) {
            this.seekToTime(parseFloat(savedTime));
            if (this.video.paused) {
                this.video.play().catch(e => console.error('Auto-resume play error:', e));
            }
            if (this.resumePrompt) this.resumePrompt.classList.remove('active');
        }
    }"""

content = re.sub(r'    checkResume\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?\}, 10000\);\n        \}\n    \}', new_check_resume, content)

with open('player.js', 'w') as f:
    f.write(content)
