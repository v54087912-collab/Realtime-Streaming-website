const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

const resumeCSS = `
/* Resume Toast */
.resume-toast {
    position: absolute;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    border-radius: var(--radius-md);
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transition: all var(--transition-normal);
}

.resume-toast.active {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
}

.resume-toast-header {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
}

.resume-toast-msg {
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.resume-toast-actions {
    display: flex;
    gap: 12px;
}

.resume-toast-actions button {
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
}

#resumeBtn {
    background: var(--accent-primary);
    color: var(--bg-deep);
    border: none;
}

#startOverBtn {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

#resumeBtn:hover {
    background: #e4e4e7;
}

#startOverBtn:hover {
    background: rgba(255, 255, 255, 0.1);
}
`;

if (!css.includes('.resume-toast')) {
    fs.appendFileSync('styles.css', resumeCSS);
}
