const fs = require('fs');

let js = fs.readFileSync('player.js', 'utf8');

// There's a chance the regex didn't catch the syntax error
// Let's do a hard replace of the specific syntax error area
const errorStr = `        } else if (videoUrl) {
            this.urlInput.value = decodeURIComponent(videoUrl);
            this.loadVideo();
        }

        if (token) {
            const actualUrl = localStorage.getItem('shareToken_' + token);`;

const fixStr = `        // Check for token or URL in query params
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

// We need to look for any instances where token is checked and the else if statement is orphaned
js = js.replace(/        \/\/ Check for token or URL in query params[\s\S]*?\} else if \(videoUrl\) \{[\s\S]*?\n        \}/, fixStr);
js = js.replace(/\/\/ Check for token or URL in query params[\s\S]*?\} else if \(videoUrl\) \{[\s\S]*?this\.loadVideo\(\);\s*\}/, fixStr);
js = js.replace(/\} else if \(videoUrl\) \{\s*this\.urlInput\.value = decodeURIComponent\(videoUrl\);\s*this\.loadVideo\(\);\s*\}\s*if \(token\) \{\s*const actualUrl = localStorage\.getItem\('shareToken_' \+ token\);[\s\S]*?else \{\s*alert\('Invalid or expired share link\.'\);\s*\}\s*\}/, '');

fs.writeFileSync('player.js', js);
