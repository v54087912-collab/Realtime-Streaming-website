const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

const shareCSS = `
/* Share Toast */
.share-toast {
    position: absolute;
    bottom: 80px;
    right: 20px;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    border-radius: var(--radius-md);
    padding: 16px;
    display: none;
    flex-direction: column;
    gap: 8px;
    z-index: 100;
}

.share-toast.active {
    display: flex;
}

.share-toast-header {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
}

.share-toast-body {
    display: flex;
    gap: 8px;
}

.share-toast-body input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: 6px 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    width: 200px;
}

.share-toast-body button {
    background: var(--accent-primary);
    color: var(--bg-deep);
    border: none;
    border-radius: var(--radius-sm);
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
}

.share-toast-success {
    font-size: 0.8rem;
    color: var(--success);
    text-align: right;
    display: none;
}
`;

if (!css.includes('.share-toast')) {
    fs.appendFileSync('styles.css', shareCSS);
}
