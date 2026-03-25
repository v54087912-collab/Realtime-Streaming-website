const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchStr = `                                <!-- Audio Track Switcher -->`;

const replaceStr = `                                <!-- Download Button -->
                                <div class="download-container" id="downloadContainer">
                                    <button class="ctrl-btn" id="downloadBtn" title="Download">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                    </button>
                                    <div class="download-menu" id="downloadMenu">
                                        <div class="download-header">Select Quality</div>
                                        <div class="download-options-list" id="downloadOptionsList">
                                            <button class="download-option" data-quality="1080p">1080p (FHD)</button>
                                            <button class="download-option" data-quality="720p">720p (HD)</button>
                                            <button class="download-option" data-quality="480p">480p (SD)</button>
                                            <button class="download-option" data-quality="original">Original Size</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Audio Track Switcher -->`;

html = html.replace(searchStr, replaceStr);
fs.writeFileSync('index.html', html);
