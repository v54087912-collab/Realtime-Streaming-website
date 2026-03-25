const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const searchStr = `                            <div class="controls-right">
                                <!-- Playback Speed -->`;

const replaceStr = `                            <div class="controls-right">
                                <!-- Audio Track Switcher -->
                                <div class="audio-container" id="audioContainer">
                                    <button class="ctrl-btn" id="audioBtn" title="Audio Tracks">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M9 18V5l12-2v13"></path>
                                            <circle cx="6" cy="18" r="3"></circle>
                                            <circle cx="18" cy="16" r="3"></circle>
                                        </svg>
                                    </button>
                                    <div class="audio-menu" id="audioMenu">
                                        <div class="audio-header">Audio Tracks</div>
                                        <div class="audio-tracks-list" id="audioTracksList">
                                            <!-- Tracks will be injected here -->
                                        </div>
                                    </div>
                                </div>

                                <!-- Playback Speed -->`;

html = html.replace(searchStr, replaceStr);

fs.writeFileSync('index.html', html);
