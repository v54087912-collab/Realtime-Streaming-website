const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

const searchStr = `/* Speed Menu */
.speed-container {
    position: relative;
}`;

const replaceStr = `/* Audio Menu & Speed Menu Common */
.audio-container,
.speed-container,
.download-container {
    position: relative;
}

.audio-menu,
.speed-menu,
.download-menu {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 8px;
    padding: 8px;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    border-radius: var(--radius-md);
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
    transition: all var(--transition-normal);
    min-width: 180px;
    max-height: 350px;
    overflow-y: auto;
    z-index: 100;
}

.audio-container:hover .audio-menu,
.speed-container:hover .speed-menu,
.download-container:hover .download-menu,
.audio-menu.active,
.speed-menu.active,
.download-menu.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.audio-header,
.download-header {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.9rem;
    color: var(--text-primary);
    font-weight: 500;
    text-align: center;
}

.audio-tracks-list,
.download-options-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.audio-option,
.download-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    font-family: 'Outfit', sans-serif;
    font-size: 0.85rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
}

.audio-option:hover,
.download-option:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
}

.audio-option.active {
    color: var(--accent-primary);
    background: rgba(255, 255, 255, 0.05);
}

.audio-check {
    width: 16px;
    height: 16px;
    opacity: 0;
    transition: opacity var(--transition-fast);
}

.audio-option.active .audio-check {
    opacity: 1;
}

/* Speed Menu Only */
.speed-btn {`;

css = css.replace(searchStr, replaceStr);

// Original speed menu hide handling might interfere with new rules
const originalMenuHiding = `
.speed-container:hover .speed-menu,
.speed-menu.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}`;
css = css.replace(originalMenuHiding, '');

fs.writeFileSync('styles.css', css);
