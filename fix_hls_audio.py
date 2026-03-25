import re

with open('player.js', 'r') as f:
    content = f.read()

# Make sure we store `hls` instance on `this` so we can control audio tracks with it.
content = content.replace('const hls = new Hls({', 'this.hls = new Hls({')
content = content.replace('hls.loadSource(url);', 'this.hls.loadSource(url);')
content = content.replace('hls.attachMedia(this.video);', 'this.hls.attachMedia(this.video);')
content = content.replace('hls.on(Hls.Events.MANIFEST_PARSED,', 'this.hls.on(Hls.Events.MANIFEST_PARSED,')
content = content.replace('hls.on(Hls.Events.ERROR,', 'this.hls.on(Hls.Events.ERROR,')

# Add audio track init on MANIFEST_PARSED for HLS
hls_parsed = """this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.hideLoading();
                this.initAudioTracks();
            });"""
content = re.sub(r'this\.hls\.on\(Hls\.Events\.MANIFEST_PARSED, \(\) => \{\s+this\.hideLoading\(\);\s+\}\);', hls_parsed, content)

# Now update initAudioTracks and setAudioTrack to support HLS
new_init = """    initAudioTracks() {
        if (!this.audioBtn || !this.audioList) return;
        this.audioList.innerHTML = '';

        if (this.hls && this.hls.audioTracks && this.hls.audioTracks.length > 1) {
            this.audioBtn.style.display = 'flex';
            for (let i = 0; i < this.hls.audioTracks.length; i++) {
                const track = this.hls.audioTracks[i];
                const option = document.createElement('button');
                option.className = 'audio-option';
                if (i === this.hls.audioTrack) option.classList.add('active');

                const checkmark = (i === this.hls.audioTrack) ? '✓ ' : '&nbsp;&nbsp;';
                const label = track.name || track.language || `Track ${i + 1}`;
                option.innerHTML = `<span>${checkmark}</span>${label}`;

                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setAudioTrack(i);
                });
                this.audioList.appendChild(option);
            }
        } else if (this.video.audioTracks && this.video.audioTracks.length > 1) {
            this.audioBtn.style.display = 'flex';
            for (let i = 0; i < this.video.audioTracks.length; i++) {
                const track = this.video.audioTracks[i];
                const option = document.createElement('button');
                option.className = 'audio-option';
                if (track.enabled) option.classList.add('active');

                const checkmark = track.enabled ? '✓ ' : '&nbsp;&nbsp;';
                const label = track.label || track.language || `Track ${i + 1}`;
                option.innerHTML = `<span>${checkmark}</span>${label}`;

                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setAudioTrack(i);
                });
                this.audioList.appendChild(option);
            }
        } else {
            this.audioBtn.style.display = 'none';
            this.audioMenu.classList.remove('active');
        }
    }"""

content = re.sub(r'    initAudioTracks\(\) \{[\s\S]*?this\.audioMenu\.classList\.remove\(\'active\'\);\n        \}\n    \}', new_init, content)

new_set = """    setAudioTrack(index) {
        if (this.hls && this.hls.audioTracks) {
            this.hls.audioTrack = index;
        } else if (this.video.audioTracks && index < this.video.audioTracks.length) {
            for (let i = 0; i < this.video.audioTracks.length; i++) {
                this.video.audioTracks[i].enabled = (i === index);
            }
        }
        this.initAudioTracks();
        this.audioMenu.classList.remove('active');
    }"""

content = re.sub(r'    setAudioTrack\(index\) \{[\s\S]*?this\.audioMenu\.classList\.remove\(\'active\'\);\n    \}', new_set, content)


with open('player.js', 'w') as f:
    f.write(content)
