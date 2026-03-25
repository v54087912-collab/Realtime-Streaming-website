const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

// Find the broken .speed-btn block and fix it
css = css.replace(/\/\* Speed Menu Only \*\/\n\.speed-btn \{/, `/* Speed Menu Only */
.speed-btn {
    width: auto;
    padding: 0 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
}`);

// Also fix the progress tooltip hover requirement
// The prompt said "show a time tooltip on hover displaying the timestamp at that position"
// The tooltip code was already mostly in the HTML/CSS/JS, but we'll ensure it works.
// It requires pointer-events:none on the tooltip, which is already there.

fs.writeFileSync('styles.css', css);
