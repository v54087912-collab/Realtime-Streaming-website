const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

// The styles patch previously covered download-container, download-menu, etc.
// But we should double check if it replaced everything perfectly.

// Just adding to the end just in case.
const additional = `
.download-option {
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.download-option:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
}
`;

if (!css.includes('.download-option')) {
    css += additional;
    fs.writeFileSync('styles.css', css);
}
