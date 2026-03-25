const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

// Change progress-played color
css = css.replace(
    /background: var\(--gradient-accent\);/g,
    'background: #ef4444;'
);

fs.writeFileSync('styles.css', css);
