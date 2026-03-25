/**
 * StreamFlow Video Player
 * High-quality streaming video player with smart buffering
 */

class StreamFlowPlayer {
    constructor() {
        // DOM Elements
        this.logoBtn = document.getElementById('logoBtn');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.sidebar = document.getElementById('sidebar');
        this.closeSidebarBtn = document.getElementById('closeSidebarBtn');

        this.urlSection = document.getElementById('urlSection');
        this.playerSection = document.getElementById('playerSection');
        this.playerContainer = document.getElementById('playerContainer');
        this.video = document.getElementById('videoPlayer');
        this.urlInput = document.getElementById('videoUrl');
        this.loadBtn = document.getElementById('loadBtn');
        this.backBtn = document.getElementById('backBtn');
        this.useProxyCheckbox = document.getElementById('useProxy');
        
        // Overlays
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.playOverlay = document.getElementById('playOverlay');
        this.errorOverlay = document.getElementById('errorOverlay');
        this.errorText = document.getElementById('errorText');
        this.bufferIndicator = document.getElementById('bufferIndicator');
        
        // Audio Tracks
        this.audioBtn = document.getElementById('audioBtn');
        this.audioMenu = document.getElementById('audioMenu');
        this.audioList = document.getElementById('audioList');

        // Share & Toast
        this.shareBtn = document.getElementById('shareBtn');
        this.toastContainer = document.getElementById('toastContainer');
        this.resumePrompt = document.getElementById('resumePrompt');
        this.resumeTime = document.getElementById('resumeTime');
        this.resumeBtnYes = document.getElementById('resumeBtnYes');
        this.resumeBtnNo = document.getElementById('resumeBtnNo');

        // Download
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadMenu = document.getElementById('downloadMenu');

        // Controls
        this.controls = document.getElementById('controls');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.bigPlayBtn = document.getElementById('bigPlayBtn');
        this.skipBackBtn = document.getElementById('skipBackBtn');
        this.skipForwardBtn = document.getElementById('skipForwardBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeFill = document.getElementById('volumeFill');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.pipBtn = document.getElementById('pipBtn');
        this.speedBtn = document.getElementById('speedBtn');
        this.speedMenu = document.getElementById('speedMenu');
        this.speedValue = document.getElementById('speedValue');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Progress
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBuffer = document.getElementById('progressBuffer');
        this.progressPlayed = document.getElementById('progressPlayed');
        this.progressThumb = document.getElementById('progressThumb');
        this.progressTooltip = document.getElementById('progressTooltip');
        
        // Time Display
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.timeInputWrapper = document.getElementById('timeInputWrapper');
        this.timeInput = document.getElementById('timeInput');
        this.timeGoBtn = document.getElementById('timeGoBtn');
        
        // Stats
        this.bufferPercent = document.getElementById('bufferPercent');
        this.networkSpeed = document.getElementById('networkSpeed');
        
        // Shortcuts Modal
        this.shortcutsModal = document.getElementById('shortcutsModal');
        this.closeShortcuts = document.getElementById('closeShortcuts');
        
        // State
        this.isPlaying = false;
        this.isMuted = false;
        this.isFullscreen = false;
        this.controlsTimeout = null;
        this.cursorTimeout = null;
        this.lastVolume = 1;
        this.currentUrl = '';
        this.loadStartTime = 0;
        this.bytesLoaded = 0;
        
        // Buffer Management
        this.bufferCheckInterval = null;
        this.targetBufferAhead = 60; // seconds to buffer ahead
        this.historyBufferRatio = 0.10; // 10% of watched video as history buffer
        this.maxWatchedPosition = 0; // track furthest watched position
        this.lastSaveTime = 0;
        this.bufferRanges = []; // store all buffer ranges for visualization
        
        // Network speed tracking
        this.lastBufferTime = 0;
        this.lastBufferedAmount = 0;
        this.networkSpeedSamples = [];
        this.maxSpeedSamples = 10; // rolling average of last 10 samples
        
        // Range request support detection
        this.supportsRangeRequests = null; // null = unknown, true/false after check
        this.rangeRequestChecked = false;
        
        this.init();
    }
    
    openSidebar() {
        this.sidebar.classList.add('active');
        this.sidebarOverlay.classList.add('active');
    }

    closeSidebar() {
        this.sidebar.classList.remove('active');
        this.sidebarOverlay.classList.remove('active');
    }

    init() {
        this.bindEvents();
        this.setupVideoEvents();
        this.updateVolumeUI();
        
        // Focus input on load
        this.urlInput.focus();
        
        // Check for URL in query params
        const params = new URLSearchParams(window.location.search);
        const videoUrl = params.get('url');
        const tokenUrl = params.get('v');

        if (tokenUrl) {
            // Secure masked token playback
            this.originalUrl = `?v=${tokenUrl}`;
            this.currentUrl = `/api/share?v=${tokenUrl}`;
            this.hideError();
            this.showPlayerSection();
            this.showLoading();
            // Load the stream directly from our backend resolver API to prevent leaking the URL
            this.loadDirectVideo(this.currentUrl);
            return;
        }
        if (videoUrl) {
            this.urlInput.value = decodeURIComponent(videoUrl);
            this.loadVideo();
        }
    }
    
    bindEvents() {
        // Speed FF (Long Press)
        let speedFfTimeout = null;
        this.originalSpeed = 1;
        this.isSpeedFfActive = false;

        const startSpeedFf = () => {
            if (!this.isPlaying || this.isSpeedFfActive) return;
            speedFfTimeout = setTimeout(() => {
                this.isSpeedFfActive = true;
                this.originalSpeed = this.video.playbackRate;
                this.setPlaybackSpeed(2.0);
                this.showSpeedWarning('2x Fast Forward');
            }, 500); // 500ms long press
        };

        const endSpeedFf = () => {
            if (speedFfTimeout) {
                clearTimeout(speedFfTimeout);
                speedFfTimeout = null;
            }
            if (this.isSpeedFfActive) {
                this.isSpeedFfActive = false;
                this.setPlaybackSpeed(this.originalSpeed);
                // Remove fast forward indicator if any
                const existingWarning = this.playerContainer.querySelector('.speed-warning');
                if (existingWarning && existingWarning.textContent.includes('Fast Forward')) {
                    existingWarning.remove();
                }
            }
        };

        this.playerContainer.addEventListener('pointerdown', startSpeedFf);
        this.playerContainer.addEventListener('pointerup', endSpeedFf);
        this.playerContainer.addEventListener('pointerleave', endSpeedFf);
        this.playerContainer.addEventListener('pointercancel', endSpeedFf);

        // Sidebar
        if (this.logoBtn && this.sidebar && this.sidebarOverlay && this.closeSidebarBtn) {
            this.logoBtn.addEventListener('click', () => this.openSidebar());
            this.closeSidebarBtn.addEventListener('click', () => this.closeSidebar());
            this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        }

        // URL Input
        this.loadBtn.addEventListener('click', () => this.loadVideo());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadVideo();
        });
        this.backBtn.addEventListener('click', () => this.showUrlSection());
        this.retryBtn.addEventListener('click', () => this.loadVideo());
        
        // Play Controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.bigPlayBtn.addEventListener('click', () => this.togglePlay());
        this.skipBackBtn.addEventListener('click', () => this.skip(-10));
        this.skipForwardBtn.addEventListener('click', () => this.skip(10));
        
        // Share
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', () => this.handleShare());
        }

        // Volume
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Progress Bar
        this.progressContainer.addEventListener('click', (e) => this.seek(e));
        this.progressContainer.addEventListener('mousemove', (e) => this.updateTooltip(e));
        
        // Add drag support for progress bar
        let isDragging = false;
        this.progressContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.seek(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.seek(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Fullscreen & PiP
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.pipBtn.addEventListener('click', () => this.togglePiP());
        
        // Audio Menu
        if (this.audioBtn && this.audioMenu) {
            this.audioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.audioMenu.classList.toggle('active');
            });
        }

        // Download Menu
        if (this.downloadBtn && this.downloadMenu) {
            this.downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadMenu.classList.toggle('active');
            });

            const downloadOptions = this.downloadMenu.querySelectorAll('.download-option');
            downloadOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const quality = e.target.dataset.quality;
                    this.downloadVideo(quality);
                    this.downloadMenu.classList.remove('active');
                });
            });
        }

        // Time Input - click time display to show input
        this.timeDisplay.addEventListener('click', () => this.showTimeInput());
        this.timeGoBtn.addEventListener('click', () => this.jumpToInputTime());
        this.timeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.jumpToInputTime();
        });
        this.timeInput.addEventListener('blur', () => {
            // Hide input after a short delay (allows clicking Go button)
            setTimeout(() => this.hideTimeInput(), 200);
        });
        
        // Speed Menu
        this.speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.speedMenu.classList.toggle('active');
        });
        
        document.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const speed = parseFloat(e.target.dataset.speed);
                this.setPlaybackSpeed(speed);
            });
        });
        
        // Custom speed input
        const customSpeedInput = document.getElementById('customSpeedInput');
        const customSpeedBtn = document.getElementById('customSpeedBtn');
        
        if (customSpeedBtn && customSpeedInput) {
            customSpeedBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const speed = parseFloat(customSpeedInput.value);
                if (speed >= 0.1 && speed <= 100) {
                    this.setPlaybackSpeed(speed);
                    customSpeedInput.value = '';
                }
            });
            
            customSpeedInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.stopPropagation();
                    const speed = parseFloat(customSpeedInput.value);
                    if (speed >= 0.1 && speed <= 100) {
                        this.setPlaybackSpeed(speed);
                        customSpeedInput.value = '';
                    }
                }
            });
            
            customSpeedInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Close speed menu when clicking outside
        document.addEventListener('click', () => {
            this.speedMenu.classList.remove('active');
            if (this.audioMenu) {
                this.audioMenu.classList.remove('active');
            }
            if (this.downloadMenu) {
                this.downloadMenu.classList.remove('active');
            }
        });
        
        // Settings / Shortcuts panel logic
        const shortcutsBtn = document.getElementById('shortcutsBtn');
        const shortcutsMenuPanel = document.getElementById('shortcutsMenuPanel');
        if (shortcutsBtn && shortcutsMenuPanel) {
            shortcutsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                shortcutsMenuPanel.classList.toggle('active');
            });
            shortcutsMenuPanel.addEventListener('click', (e) => {
                e.stopPropagation(); // keep menu open when clicking inside
            });
            document.addEventListener('click', () => {
                shortcutsMenuPanel.classList.remove('active');
            });

            // Loop feature
            const chkLoop = document.getElementById('chkLoop');
            if (chkLoop) chkLoop.addEventListener('change', (e) => {
                this.video.loop = e.target.checked;
            });

            // Night Mode feature
            const chkNightMode = document.getElementById('chkNightMode');
            if (chkNightMode) chkNightMode.addEventListener('change', (e) => {
                this.video.classList.toggle('night-mode', e.target.checked);
            });

            // Background Play (prevents pause on page hide)
            const chkBackgroundPlay = document.getElementById('chkBackgroundPlay');
            this.backgroundPlayEnabled = false;
            if (chkBackgroundPlay) chkBackgroundPlay.addEventListener('change', (e) => {
                this.backgroundPlayEnabled = e.target.checked;
            });

            // Aspect Ratio
            const btnAspectRatio = document.getElementById('btnAspectRatio');
            this.currentAspectRatio = 'aspect-contain';
            if (btnAspectRatio) btnAspectRatio.addEventListener('click', () => {
                const ratios = ['aspect-contain', 'aspect-cover', 'aspect-fill'];
                const currentIndex = ratios.indexOf(this.currentAspectRatio);
                const nextIndex = (currentIndex + 1) % ratios.length;
                this.video.classList.remove(this.currentAspectRatio);
                this.currentAspectRatio = ratios[nextIndex];
                this.video.classList.add(this.currentAspectRatio);
            });

            // A-B Repeat
            const btnABRepeat = document.getElementById('btnABRepeat');
            const abRepeatLabel = document.getElementById('abRepeatLabel');
            this.timeA = null;
            this.timeB = null;
            if (btnABRepeat) btnABRepeat.addEventListener('click', () => {
                if (this.timeA === null) {
                    this.timeA = this.video.currentTime;
                    abRepeatLabel.textContent = `A: ${this.formatTime(this.timeA)} - B: Set`;
                    btnABRepeat.classList.add('active-state');
                } else if (this.timeB === null) {
                    this.timeB = Math.max(this.timeA + 1, this.video.currentTime); // Ensure B > A
                    abRepeatLabel.textContent = `Looping A-B`;
                } else {
                    this.timeA = null;
                    this.timeB = null;
                    abRepeatLabel.textContent = 'A-B Repeat';
                    btnABRepeat.classList.remove('active-state');
                }
            });

            // Sleep Timer
            const btnSleepTimer = document.getElementById('btnSleepTimer');
            this.sleepTimerId = null;
            if (btnSleepTimer) btnSleepTimer.addEventListener('click', () => {
                if (this.sleepTimerId) {
                    clearTimeout(this.sleepTimerId);
                    this.sleepTimerId = null;
                    btnSleepTimer.querySelector('span').textContent = 'Sleep Timer';
                    btnSleepTimer.classList.remove('active-state');
                } else {
                    const mins = prompt("Enter sleep timer in minutes:");
                    if (mins && !isNaN(mins) && parseInt(mins) > 0) {
                        this.sleepTimerId = setTimeout(() => {
                            this.video.pause();
                            this.sleepTimerId = null;
                            btnSleepTimer.querySelector('span').textContent = 'Sleep Timer';
                            btnSleepTimer.classList.remove('active-state');
                        }, parseInt(mins) * 60000);
                        btnSleepTimer.querySelector('span').textContent = `Timer: ${mins}m`;
                        btnSleepTimer.classList.add('active-state');
                    }
                }
            });

            // Screenshot
            const btnScreenshot = document.getElementById('btnScreenshot');
            if (btnScreenshot) btnScreenshot.addEventListener('click', () => {
                if (!this.video.videoWidth) return;
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = this.video.videoWidth;
                    canvas.height = this.video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);

                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = `screenshot_${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } catch (e) {
                    console.error('Screenshot failed, possibly due to CORS:', e);
                    alert("Cannot take screenshot due to CORS restrictions on this video.");
                }
            });
        }

        // Handle background play
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.backgroundPlayEnabled && this.isPlaying) {
                this.video.pause();
                this.wasPlayingBeforeBackground = true;
            } else if (!document.hidden && this.wasPlayingBeforeBackground) {
                // optional: resume playing if user returned
                // this.video.play();
                this.wasPlayingBeforeBackground = false;
            }
        });

        // Shortcuts Modal
        this.closeShortcuts.addEventListener('click', () => {
            this.shortcutsModal.classList.remove('active');
        });
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Controls visibility
        this.playerContainer.addEventListener('mousemove', () => this.showControls());
        this.playerContainer.addEventListener('mouseleave', () => this.hideControls());
        
        // Click to play/pause
        this.video.addEventListener('click', () => this.togglePlay());
        
        // Double-click to fullscreen
        this.video.addEventListener('dblclick', () => this.toggleFullscreen());
        
        // Fullscreen change
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
    }
    
    setupVideoEvents() {
        // Loading states
        this.video.addEventListener('loadstart', () => {
            this.loadStartTime = Date.now();
            this.maxWatchedPosition = 0; // Reset watched position
            this.bufferRanges = [];
            this.showLoading();
        });
        
        this.video.addEventListener('loadedmetadata', () => {
            // Clear load timeout
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }
            
            this.durationEl.textContent = this.formatTime(this.video.duration);
            this.hideLoading();
            // Start buffer management once we have metadata
            this.startBufferManagement();
            // Initialize speed status
            this.updateSpeedStatus();
            // Initialize Audio Tracks
            this.initAudioTracks();
            // Check Resume
            this.checkResume();
            
            console.log(`Video loaded: ${this.formatTime(this.video.duration)} duration`);
        });
        
        this.video.addEventListener('canplay', () => {
            this.hideLoading();
            this.playOverlay.classList.remove('hidden');
        });
        
        this.video.addEventListener('canplaythrough', () => {
            this.hideLoading();
        });
        
        this.video.addEventListener('waiting', () => {
            this.showLoading();
        });
        
        this.video.addEventListener('playing', () => {
            this.hideLoading();
            this.isPlaying = true;
            this.playerContainer.classList.add('playing');
            this.playOverlay.classList.add('hidden');
        });
        
        this.video.addEventListener('pause', () => {
            this.isPlaying = false;
            this.playerContainer.classList.remove('playing');
            // Continue buffering even when paused - browser handles this
            // but we update the UI to show buffer progress
            this.updateBuffer();
        });
        
        this.video.addEventListener('ended', () => {
            this.isPlaying = false;
            this.playerContainer.classList.remove('playing');
            this.playOverlay.classList.remove('hidden');

            const movieId = this.getMovieId();
            if (movieId) localStorage.removeItem(movieId);
        });
        
        // Time update
        this.video.addEventListener('timeupdate', () => {
            this.updateProgress();

            if (this.video.currentTime > this.maxWatchedPosition) {
                this.maxWatchedPosition = this.video.currentTime;
            }

            if (this.timeB !== null && this.timeA !== null) {
                if (this.video.currentTime >= this.timeB) {
                    this.video.currentTime = this.timeA;
                }
            }

            // Save progress every 5 seconds
            const now = Date.now();
            if (now - this.lastSaveTime > 5000) {
                this.saveProgress();
                this.lastSaveTime = now;
            }
        });
        
        // Buffer progress - fires when browser downloads more data
        this.video.addEventListener('progress', () => this.updateBuffer());
        
        // Also update buffer on seeking
        this.video.addEventListener('seeked', () => {
            this.updateBuffer();
        });
        
        // Error handling
        this.video.addEventListener('error', (e) => this.handleError(e));
        
        // Volume change
        this.video.addEventListener('volumechange', () => this.updateVolumeUI());
    }
    
    initAudioTracks() {
        if (!this.audioBtn || !this.audioList) return;

        // Clear existing tracks
        this.audioList.innerHTML = '';

        // Check if audioTracks API is supported and has tracks
        if (this.video.audioTracks && this.video.audioTracks.length > 1) {
            this.audioBtn.style.display = 'flex';

            for (let i = 0; i < this.video.audioTracks.length; i++) {
                const track = this.video.audioTracks[i];
                const option = document.createElement('button');
                option.className = 'audio-option';
                if (track.enabled) {
                    option.classList.add('active');
                }

                // Add checkmark for active track
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
    }

    setAudioTrack(index) {
        if (!this.video.audioTracks || index >= this.video.audioTracks.length) return;

        for (let i = 0; i < this.video.audioTracks.length; i++) {
            this.video.audioTracks[i].enabled = (i === index);
        }

        // Update UI
        this.initAudioTracks();

        this.audioMenu.classList.remove('active');
    }

    async handleShare() {
        const urlToShare = this.urlInput.value.trim() || this.originalUrl;
        if (!urlToShare || urlToShare.startsWith('?v=')) {
            navigator.clipboard.writeText(window.location.href).catch(()=>{});
            this.showToast('Link Copied');
            return;
        }

        try {
            const response = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlToShare })
            });

            if (!response.ok) throw new Error('Failed to generate link');
            const data = await response.json();
            const shareLink = `${window.location.origin}/?v=${data.token}`;

            await navigator.clipboard.writeText(shareLink);
            this.showToast('Link Copied');
        } catch (e) {
            console.error('Share error:', e);
            const fallbackToken = btoa(urlToShare);
            const fallbackLink = `${window.location.origin}/?v=${fallbackToken}`;
            navigator.clipboard.writeText(fallbackLink).catch(()=>{});
            this.showToast('Link Copied (Base64)');
        }
    }

    downloadVideo(quality) {
        if (!this.currentUrl) return;

        const a = document.createElement('a');
        a.href = this.currentUrl;
        a.download = `video_${quality}_${Date.now()}.mp4`; // Try to suggest a filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    loadVideo() {
        let url = this.urlInput.value.trim();
        if (!url) {
            this.urlInput.focus();
            return;
        }
        
        // Check if proxy should be used
        const useProxy = this.useProxyCheckbox && this.useProxyCheckbox.checked;
        if (useProxy) {
            // Use proxy to bypass CORS (works via Cloudflare Pages Function or local server.js)
            url = `/proxy?url=${encodeURIComponent(url)}`;
            console.log('🔄 Using proxy server for URL');
        }
        
        this.currentUrl = url;
        this.originalUrl = this.urlInput.value.trim(); // Store original for display
        this.hideError();
        this.showPlayerSection();
        this.showLoading();
        
        // Reset network speed tracking
        this.lastBufferTime = 0;
        this.lastBufferedAmount = 0;
        this.networkSpeedSamples = [];
        this.loadStartTime = Date.now();
        
        // Reset CORS retry flags
        this.triedWithoutCors = false;
        this.triedWithCors = false;
        this.rangeRequestChecked = false;
        
        // Check if HLS stream
        if (url.includes('.m3u8')) {
            this.loadHLS(url);
        } else if (url.includes('.mpd')) {
            this.loadDASH(url);
        } else {
            // Direct video URL - try loading with best settings for streaming
            this.loadDirectVideo(url);
        }
        
        // Update URL params
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('url', encodeURIComponent(url));
        window.history.replaceState({}, '', newUrl);
    }
    
    async loadDirectVideo(url) {
        // Reset video element for fresh load
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        
        // Configure for streaming
        this.video.preload = 'auto';
        
        // Check if it's a Google URL (they have specific requirements)
        const isGoogleUrl = url.includes('googleusercontent.com') || 
                           url.includes('googlevideo.com') ||
                           url.includes('google.com');
        
        if (isGoogleUrl) {
            console.log('🔗 Detected Google video URL - may expire after a few hours');
            // Google URLs work better without crossorigin attribute
            this.video.removeAttribute('crossorigin');
        }
        
        // Check if server supports Range requests (for seeking)
        if (!this.rangeRequestChecked) {
            this.checkRangeRequestSupport(url);
        }
        
        // Set the source and load
        this.video.src = url;
        this.video.load();
        
        // Add timeout for stuck loading
        this.loadTimeout = setTimeout(() => {
            if (this.video.readyState < 2) { // HAVE_CURRENT_DATA
                console.warn('Video loading is taking too long...');
                // Try without any special attributes
                this.video.removeAttribute('crossorigin');
                this.video.load();
            }
        }, 10000); // 10 second timeout
    }
    
    async checkRangeRequestSupport(url) {
        this.rangeRequestChecked = true;
        
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'cors'
            });
            
            const acceptRanges = response.headers.get('Accept-Ranges');
            const contentLength = response.headers.get('Content-Length');
            
            this.supportsRangeRequests = acceptRanges === 'bytes';
            
            if (this.supportsRangeRequests) {
                console.log(`✅ Server supports Range requests (byte-seeking enabled)`);
                if (contentLength) {
                    const sizeMB = (parseInt(contentLength) / 1024 / 1024).toFixed(1);
                    console.log(`📦 File size: ${sizeMB} MB`);
                }
            } else {
                console.warn(`⚠️ Server doesn't support Range requests - seeking may require re-download`);
                this.showRangeWarning();
            }
        } catch (error) {
            console.warn('Could not check Range request support:', error.message);
            // Assume it works - browser will handle it
            this.supportsRangeRequests = true;
        }
    }
    
    showRangeWarning() {
        // Show a subtle warning that seeking might not work well
        const warning = document.createElement('div');
        warning.className = 'range-warning';
        warning.innerHTML = `
            <span>⚠️ This video may not support seeking to unbuffered positions</span>
        `;
        warning.style.cssText = `
            position: absolute;
            top: 70px;
            right: 20px;
            padding: 10px 16px;
            background: rgba(255, 165, 0, 0.9);
            color: #000;
            border-radius: 8px;
            font-size: 0.85rem;
            z-index: 20;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 4s forwards;
        `;
        
        this.playerContainer.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, 5000);
    }
    
    loadHLS(url) {
        // Check if native HLS is supported (Safari)
        if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            this.video.src = url;
            this.video.load();
        } else if (typeof Hls !== 'undefined') {
            // Use hls.js for other browsers
            const hls = new Hls({
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                maxBufferSize: 60 * 1000 * 1000, // 60MB
                maxBufferHole: 0.5,
            });
            hls.loadSource(url);
            hls.attachMedia(this.video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.hideLoading();
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    this.showError('HLS stream error: ' + data.type);
                }
            });
        } else {
            this.showError('HLS playback not supported. Please use Safari or add hls.js library.');
        }
    }
    
    loadDASH(url) {
        if (typeof dashjs !== 'undefined') {
            const player = dashjs.MediaPlayer().create();
            player.initialize(this.video, url, false);
            player.updateSettings({
                streaming: {
                    buffer: {
                        fastSwitchEnabled: true,
                        bufferTimeAtTopQuality: 30,
                        bufferTimeAtTopQualityLongForm: 60,
                    }
                }
            });
        } else {
            this.showError('DASH playback requires dash.js library.');
        }
    }
    
    togglePlay() {
        if (this.video.paused) {
            this.video.play().catch(e => {
                console.error('Play error:', e);
            });
        } else {
            this.video.pause();
        }
    }
    
    skip(seconds) {
        const newTime = this.video.currentTime + seconds;
        this.seekToTime(newTime);
        
        // Show seek indicator
        this.showSeekIndicator(seconds);
    }
    
    showSeekIndicator(seconds) {
        // Create indicator if doesn't exist
        let indicator = document.querySelector(`.seek-indicator.${seconds < 0 ? 'left' : 'right'}`);
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = `seek-indicator ${seconds < 0 ? 'left' : 'right'}`;
            this.playerContainer.appendChild(indicator);
        }
        
        indicator.textContent = `${seconds > 0 ? '+' : ''}${seconds}s`;
        indicator.classList.remove('active');
        void indicator.offsetWidth; // Force reflow
        indicator.classList.add('active');
    }
    
    seek(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const clampedPos = Math.max(0, Math.min(1, pos));
        this.seekToTime(clampedPos * this.video.duration);
    }
    
    seekToTime(targetTime) {
        if (!this.video.duration) return;
        
        // Check if target is within buffered range
        const isBuffered = this.isTimeBuffered(targetTime);
        
        if (!isBuffered) {
            // Show loading indicator for unbuffered seek
            this.showLoading();
            
            const timeStr = this.formatTime(targetTime);
            
            if (this.supportsRangeRequests === false) {
                console.warn(`⚠️ Seeking to ${timeStr} - server may not support Range requests`);
            } else {
                console.log(`🎯 Seeking to ${timeStr} - requesting chunk via HTTP Range header`);
            }
            
            // For Google URLs, add a note
            const isGoogleUrl = this.currentUrl.includes('googleusercontent.com');
            if (isGoogleUrl && !isBuffered) {
                console.log(`📥 Note: Google URLs support seeking, but may expire soon`);
            }
        }
        
        this.video.currentTime = Math.max(0, Math.min(targetTime, this.video.duration));

        // Always start playing from that timestamp when seeking as requested
        if (this.video.paused) {
            this.video.play().catch(e => console.error('Play error after seek:', e));
        }
    }
    
    isTimeBuffered(time) {
        for (let i = 0; i < this.video.buffered.length; i++) {
            if (time >= this.video.buffered.start(i) && time <= this.video.buffered.end(i)) {
                return true;
            }
        }
        return false;
    }
    
    // Seek to a specific percentage (0-100)
    seekToPercent(percent) {
        if (!this.video.duration) return;
        const targetTime = (percent / 100) * this.video.duration;
        this.seekToTime(targetTime);
    }
    
    // Time input methods
    showTimeInput() {
        this.timeDisplay.style.display = 'none';
        this.timeInputWrapper.style.display = 'flex';
        this.timeInput.value = '';
        this.timeInput.placeholder = this.formatTime(this.video.currentTime);
        this.timeInput.focus();
    }
    
    hideTimeInput() {
        this.timeInputWrapper.style.display = 'none';
        this.timeDisplay.style.display = '';
    }
    
    jumpToInputTime() {
        const input = this.timeInput.value.trim();
        if (!input) {
            this.hideTimeInput();
            return;
        }
        
        const seconds = this.parseTimeInput(input);
        if (seconds !== null && seconds >= 0 && seconds <= this.video.duration) {
            this.seekToTime(seconds);
            this.hideTimeInput();
        } else {
            // Invalid input - shake the input
            this.timeInput.style.animation = 'shake 0.3s ease';
            setTimeout(() => {
                this.timeInput.style.animation = '';
            }, 300);
        }
    }
    
    parseTimeInput(input) {
        // Support formats: "1:30", "1:30:00", "90", "1h30m", "90s"
        input = input.toLowerCase().trim();
        
        // Try HH:MM:SS or MM:SS format
        if (input.includes(':')) {
            const parts = input.split(':').map(p => parseInt(p) || 0);
            if (parts.length === 2) {
                // MM:SS
                return parts[0] * 60 + parts[1];
            } else if (parts.length === 3) {
                // HH:MM:SS
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
        }
        
        // Try human readable format: 1h30m, 90s, 1h, 30m
        let totalSeconds = 0;
        const hourMatch = input.match(/(\d+)\s*h/);
        const minMatch = input.match(/(\d+)\s*m/);
        const secMatch = input.match(/(\d+)\s*s/);
        
        if (hourMatch || minMatch || secMatch) {
            if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
            if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
            if (secMatch) totalSeconds += parseInt(secMatch[1]);
            return totalSeconds;
        }
        
        // Try plain number (seconds)
        const num = parseInt(input);
        if (!isNaN(num)) {
            return num;
        }
        
        return null;
    }
    
    updateTooltip(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const clampedPos = Math.max(0, Math.min(1, pos));
        const time = clampedPos * this.video.duration;
        
        this.progressTooltip.textContent = this.formatTime(time);
        this.progressTooltip.style.left = `${clampedPos * 100}%`;
    }
    
    updateProgress() {
        if (!this.video.duration) return;
        
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressPlayed.style.width = `${progress}%`;
        this.progressThumb.style.left = `${progress}%`;
        this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
    }
    
    updateBuffer() {
        if (!this.video.duration || this.video.buffered.length === 0) return;
        
        const duration = this.video.duration;
        const currentTime = this.video.currentTime;
        const now = Date.now();
        
        // Track max watched position for history buffer calculation
        if (currentTime > this.maxWatchedPosition) {
            this.maxWatchedPosition = currentTime;
        }
        
        // Collect all buffer ranges
        this.bufferRanges = [];
        for (let i = 0; i < this.video.buffered.length; i++) {
            this.bufferRanges.push({
                start: this.video.buffered.start(i),
                end: this.video.buffered.end(i)
            });
        }
        
        // Find buffer range containing current time
        let currentBufferEnd = currentTime;
        let currentBufferStart = currentTime;
        for (const range of this.bufferRanges) {
            if (currentTime >= range.start && currentTime <= range.end) {
                currentBufferEnd = range.end;
                currentBufferStart = range.start;
                break;
            }
        }
        
        // Calculate buffer ahead (from current position)
        const bufferAhead = currentBufferEnd - currentTime;
        
        // Calculate history buffer (from start of current buffer range)
        const historyBuffer = currentTime - currentBufferStart;
        
        // Calculate total buffered seconds
        let totalBuffered = 0;
        for (const range of this.bufferRanges) {
            totalBuffered += range.end - range.start;
        }
        
        // Update visual buffer bar - show the continuous buffer range around current position
        const bufferStartPercent = (currentBufferStart / duration) * 100;
        const bufferEndPercent = (currentBufferEnd / duration) * 100;
        
        this.progressBuffer.style.left = `${bufferStartPercent}%`;
        this.progressBuffer.style.width = `${bufferEndPercent - bufferStartPercent}%`;
        
        // Update stats display
        const aheadSeconds = Math.round(bufferAhead);
        this.bufferPercent.textContent = `${aheadSeconds}s ahead`;
        
        // Calculate real-time network speed using rolling average
        this.calculateNetworkSpeed(totalBuffered, now);
    }
    
    calculateNetworkSpeed(totalBuffered, now) {
        // Initialize on first call
        if (this.lastBufferTime === 0) {
            this.lastBufferTime = now;
            this.lastBufferedAmount = totalBuffered;
            return;
        }
        
        // Calculate speed based on buffer change over time
        const timeDelta = (now - this.lastBufferTime) / 1000; // seconds
        const bufferDelta = totalBuffered - this.lastBufferedAmount; // seconds of video
        
        if (timeDelta > 0.3) { // Update every 300ms minimum
            // Estimate bitrate: assume average video bitrate
            // For typical HD video: ~5 Mbps, 4K: ~15 Mbps, SD: ~2 Mbps
            const estimatedBitrate = 5000000; // 5 Mbps default assumption
            
            // bytes downloaded = seconds of video * (bitrate / 8)
            const bytesDownloaded = bufferDelta * (estimatedBitrate / 8);
            const speedBps = bytesDownloaded / timeDelta; // bytes per second
            
            if (bufferDelta > 0.1) {
                // Add to rolling average
                this.networkSpeedSamples.push(speedBps);
                if (this.networkSpeedSamples.length > this.maxSpeedSamples) {
                    this.networkSpeedSamples.shift();
                }
                
                // Calculate average speed
                const avgSpeed = this.networkSpeedSamples.reduce((a, b) => a + b, 0) / this.networkSpeedSamples.length;
                this.displayNetworkSpeed(avgSpeed);
            } else if (timeDelta > 2) {
                // No recent buffering activity
                const isFullyBuffered = totalBuffered >= this.video.duration - 1;
                if (isFullyBuffered) {
                    this.networkSpeed.textContent = 'Complete';
                    this.networkSpeed.style.color = 'var(--accent-primary)';
                } else {
                    this.networkSpeed.textContent = 'Waiting...';
                    this.networkSpeed.style.color = 'var(--text-tertiary)';
                }
            }
            
            // Update tracking
            this.lastBufferTime = now;
            this.lastBufferedAmount = totalBuffered;
        }
    }
    
    displayNetworkSpeed(bytesPerSecond) {
        this.networkSpeed.style.color = ''; // Reset to default color
        
        if (bytesPerSecond >= 1000000) {
            this.networkSpeed.textContent = `${(bytesPerSecond / 1000000).toFixed(1)} MB/s`;
        } else if (bytesPerSecond >= 1000) {
            this.networkSpeed.textContent = `${(bytesPerSecond / 1000).toFixed(0)} KB/s`;
        } else if (bytesPerSecond > 0) {
            this.networkSpeed.textContent = `${Math.round(bytesPerSecond)} B/s`;
        }
    }
    
    // Update speed status when not actively buffering
    updateSpeedStatus() {
        if (!this.video.duration) return;
        
        // Calculate total buffered
        let totalBuffered = 0;
        for (let i = 0; i < this.video.buffered.length; i++) {
            totalBuffered += this.video.buffered.end(i) - this.video.buffered.start(i);
        }
        
        const isFullyBuffered = totalBuffered >= this.video.duration - 1;
        const bufferPercent = Math.round((totalBuffered / this.video.duration) * 100);
        
        // Update based on current state
        if (isFullyBuffered) {
            this.networkSpeed.textContent = 'Complete';
            this.networkSpeed.style.color = 'var(--accent-primary)';
            this.bufferIndicator.classList.remove('active');
        } else if (this.networkSpeedSamples.length === 0) {
            // No speed data yet, show buffer progress
            this.networkSpeed.textContent = `${bufferPercent}% loaded`;
            this.networkSpeed.style.color = '';
        }
    }
    
    // Smart buffer management - continues buffering when paused
    getMovieId() {
        if (this.originalUrl && this.originalUrl.startsWith('?v=')) {
            return 'streamflow_progress_' + this.originalUrl.substring(3);
        }
        const url = this.urlInput ? this.urlInput.value.trim() : '';
        if (!url) return null;

        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'streamflow_progress_' + Math.abs(hash);
    }

    checkResume() {
        const movieId = this.getMovieId();
        if (!movieId) return;

        const savedTime = localStorage.getItem(movieId);
        if (savedTime && parseFloat(savedTime) > 5) {
            if (this.resumeTime) this.resumeTime.textContent = this.formatTime(parseFloat(savedTime));
            if (this.resumePrompt) this.resumePrompt.classList.add('active');

            if (this.resumeBtnYes) this.resumeBtnYes.onclick = () => {
                this.seekToTime(parseFloat(savedTime));
                this.video.play();
                if (this.resumePrompt) this.resumePrompt.classList.remove('active');
            };

            if (this.resumeBtnNo) this.resumeBtnNo.onclick = () => {
                localStorage.removeItem(movieId);
                this.video.currentTime = 0;
                this.video.play();
                if (this.resumePrompt) this.resumePrompt.classList.remove('active');
            };

            setTimeout(() => {
                if (this.resumePrompt) this.resumePrompt.classList.remove('active');
            }, 10000);
        }
    }

    saveProgress() {
        if (!this.isPlaying || !this.video.duration) return;
        const movieId = this.getMovieId();
        if (!movieId) return;

        if (this.video.currentTime > 5 && this.video.currentTime < this.video.duration - 5) {
            localStorage.setItem(movieId, this.video.currentTime);
        }
    }

    startBufferManagement() {
        // Clear any existing interval
        if (this.bufferCheckInterval) {
            clearInterval(this.bufferCheckInterval);
        }
        
        // Check buffer status every 500ms
        this.bufferCheckInterval = setInterval(() => {
            this.manageBuffer();
        }, 500);
    }
    
    stopBufferManagement() {
        if (this.bufferCheckInterval) {
            clearInterval(this.bufferCheckInterval);
            this.bufferCheckInterval = null;
        }
    }
    
    manageBuffer() {
        if (!this.video.duration || !this.video.src) return;
        
        const currentTime = this.video.currentTime;
        const duration = this.video.duration;
        
        // Calculate required history buffer (10% of max watched position)
        const requiredHistoryBuffer = this.maxWatchedPosition * this.historyBufferRatio;
        
        // Find current buffer range
        let bufferAhead = 0;
        let bufferBehind = 0;
        let totalBuffered = 0;
        
        for (let i = 0; i < this.video.buffered.length; i++) {
            const start = this.video.buffered.start(i);
            const end = this.video.buffered.end(i);
            totalBuffered += end - start;
            
            if (currentTime >= start && currentTime <= end) {
                bufferAhead = end - currentTime;
                bufferBehind = currentTime - start;
            }
        }
        
        // Check if still buffering (not fully loaded)
        const isFullyBuffered = totalBuffered >= duration - 0.5;
        const needsMoreBuffer = bufferAhead < this.targetBufferAhead && !isFullyBuffered;
        
        // Show buffer indicator when paused and still buffering
        if (this.video.paused && needsMoreBuffer && !this.loadingOverlay.classList.contains('active')) {
            this.bufferIndicator.classList.add('active');
            this.encourageBuffering();
        } else {
            this.bufferIndicator.classList.remove('active');
        }
        
        // Update UI with buffer health indicator
        this.updateBufferHealth(bufferAhead, bufferBehind, requiredHistoryBuffer);
        
        // Update speed status display
        this.updateSpeedStatus();
    }
    
    encourageBuffering() {
        // Browsers automatically buffer when video is loaded
        // We ensure preload is set to auto for aggressive buffering
        if (this.video.preload !== 'auto') {
            this.video.preload = 'auto';
        }
        
        // Some browsers buffer more when we access buffered property
        // This is a hint to the browser that we care about buffering
        if (this.video.buffered.length > 0) {
            const lastBufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
            // Log buffer status for debugging
            console.debug(`Buffer: ${lastBufferedEnd.toFixed(1)}s / ${this.video.duration.toFixed(1)}s`);
        }
    }
    
    updateBufferHealth(ahead, behind, requiredHistory) {
        // Visual indicator of buffer health
        const bufferStat = document.getElementById('bufferStat');
        
        if (ahead >= 30) {
            bufferStat.classList.remove('warning', 'critical');
            bufferStat.classList.add('healthy');
        } else if (ahead >= 10) {
            bufferStat.classList.remove('healthy', 'critical');
            bufferStat.classList.add('warning');
        } else {
            bufferStat.classList.remove('healthy', 'warning');
            bufferStat.classList.add('critical');
        }
    }
    
    toggleMute() {
        if (this.video.muted) {
            this.video.muted = false;
            this.video.volume = this.lastVolume || 1;
        } else {
            this.lastVolume = this.video.volume;
            this.video.muted = true;
        }
    }
    
    setVolume(value) {
        this.video.volume = value;
        this.video.muted = value == 0;
        this.updateVolumeUI();
    }
    
    updateVolumeUI() {
        const volume = this.video.muted ? 0 : this.video.volume;
        const container = this.muteBtn.closest('.volume-container');
        
        this.volumeSlider.value = volume;
        this.volumeFill.style.width = `${volume * 100}%`;
        
        container.classList.remove('low', 'muted');
        if (volume === 0 || this.video.muted) {
            container.classList.add('muted');
        } else if (volume < 0.5) {
            container.classList.add('low');
        }
    }
    
    setPlaybackSpeed(speed) {
        try {
            this.video.playbackRate = speed;
            this.speedValue.textContent = `${speed}x`;
            
            document.querySelectorAll('.speed-option').forEach(option => {
                option.classList.toggle('active', parseFloat(option.dataset.speed) === speed);
            });
            
            this.speedMenu.classList.remove('active');
        } catch (error) {
            // Browser doesn't support this playback rate
            console.warn(`Playback rate ${speed}x not supported:`, error.message);
            this.showSpeedWarning(speed);
        }
    }
    
    showSpeedWarning(speedOrMessage) {
        // Remove existing warning if any
        const existingWarning = this.playerContainer.querySelector('.speed-warning');
        if (existingWarning) existingWarning.remove();

        // Show temporary warning
        const warning = document.createElement('div');
        warning.className = 'speed-warning';

        if (typeof speedOrMessage === 'number') {
            warning.innerHTML = `⚠️ ${speedOrMessage}x not supported. Browser limit: 0.0625x - 16x`;
        } else {
            warning.innerHTML = `⏩ ${speedOrMessage}`;
        }
        
        this.playerContainer.appendChild(warning);
        
        setTimeout(() => {
            if (warning.parentNode) {
                warning.classList.add('fade-out');
                setTimeout(() => {
                    if (warning.parentNode) warning.remove();
                }, 300);
            }
        }, 2500);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (this.playerContainer.requestFullscreen) {
                this.playerContainer.requestFullscreen();
            } else if (this.playerContainer.webkitRequestFullscreen) {
                this.playerContainer.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }
    
    onFullscreenChange() {
        this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
        this.playerContainer.classList.toggle('fullscreen', this.isFullscreen);

        // Auto landscape lock for mobile when entering fullscreen
        try {
            if (this.isFullscreen && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(e => console.log('Orientation lock failed:', e));
            } else if (!this.isFullscreen && screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        } catch (e) {
            console.log('Orientation API not supported or error:', e);
        }
    }
    
    async togglePiP() {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await this.video.requestPictureInPicture();
            }
        } catch (e) {
            console.error('PiP error:', e);
        }
    }
    
    showControls() {
        clearTimeout(this.controlsTimeout);
        clearTimeout(this.cursorTimeout);
        
        this.playerContainer.classList.add('show-controls');
        this.playerContainer.classList.remove('hide-cursor');
        
        if (this.isPlaying) {
            this.controlsTimeout = setTimeout(() => {
                this.playerContainer.classList.remove('show-controls');
            }, 3000);
            
            if (this.isFullscreen) {
                this.cursorTimeout = setTimeout(() => {
                    this.playerContainer.classList.add('hide-cursor');
                }, 3000);
            }
        }
    }
    
    hideControls() {
        if (this.isPlaying) {
            this.playerContainer.classList.remove('show-controls');
        }
    }
    
    handleKeyboard(e) {
        // Don't handle if typing in input
        if (e.target.tagName === 'INPUT') return;
        
        const key = e.key.toLowerCase();
        
        switch (key) {
            case ' ':
            case 'k':
                e.preventDefault();
                if (this.playerSection.classList.contains('active')) {
                    this.togglePlay();
                }
                break;
            case 'f':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'm':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'p':
                e.preventDefault();
                this.togglePiP();
                break;
            case 'arrowleft':
            case 'j':
                e.preventDefault();
                this.skip(-10);
                break;
            case 'arrowright':
            case 'l':
                e.preventDefault();
                this.skip(10);
                break;
            case 'arrowup':
                e.preventDefault();
                this.setVolume(Math.min(1, this.video.volume + 0.1));
                break;
            case 'arrowdown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.video.volume - 0.1));
                break;
            case '?':
                e.preventDefault();
                this.shortcutsModal.classList.toggle('active');
                break;
            case 'escape':
                this.shortcutsModal.classList.remove('active');
                break;
            default:
                // Number keys for seeking (0-9 = 0%-90%)
                if (key >= '0' && key <= '9') {
                    e.preventDefault();
                    const percent = parseInt(key) * 10;
                    this.seekToPercent(percent);
                }
        }
    }
    
    showLoading() {
        this.loadingOverlay.classList.add('active');
    }
    
    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }
    
    showError(message = 'Unable to load video') {
        this.hideLoading();
        this.errorText.textContent = message;
        this.errorOverlay.classList.add('active');
    }
    
    hideError() {
        this.errorOverlay.classList.remove('active');
    }
    
    handleError(e) {
        const error = this.video.error;
        let message = 'Unable to load video';
        
        if (error) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    message = 'Video playback aborted';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    message = 'Network error - check your connection or the URL may have expired';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    message = 'Video format not supported by browser';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    // Try without crossorigin attribute if it was set
                    if (this.video.hasAttribute('crossorigin') && !this.triedWithoutCors) {
                        this.triedWithoutCors = true;
                        console.log('Retrying without CORS...');
                        this.video.removeAttribute('crossorigin');
                        this.video.load();
                        return;
                    }
                    // Try with crossorigin if it wasn't set
                    if (!this.video.hasAttribute('crossorigin') && !this.triedWithCors) {
                        this.triedWithCors = true;
                        console.log('Retrying with CORS anonymous...');
                        this.video.setAttribute('crossorigin', 'anonymous');
                        this.video.load();
                        return;
                    }
                    
                    // Check if it's a Google URL for specific message
                    const isGoogleUrl = this.currentUrl.includes('googleusercontent.com') || 
                                       this.currentUrl.includes('googlevideo.com');
                    if (isGoogleUrl) {
                        message = 'Google video URL has expired!\n\nGoogle download links are only valid for a few hours.\nPlease get a fresh download URL.';
                    } else {
                        message = 'Video cannot be played.\n\n• URL may be expired or invalid\n• Server may block external access\n• Format may not be supported';
                    }
                    break;
            }
        }
        
        this.showError(message);
    }
    
    showPlayerSection() {
        this.urlSection.classList.add('hidden');
        this.playerSection.classList.add('active');
    }
    
    showUrlSection() {
        this.urlSection.classList.remove('hidden');
        this.playerSection.classList.remove('active');
        
        // Stop buffer management
        this.stopBufferManagement();
        
        // Reset video
        this.video.pause();
        this.video.src = '';
        this.video.load();
        
        // Reset buffer tracking
        this.maxWatchedPosition = 0;
        this.bufferRanges = [];
        this.lastBufferTime = 0;
        this.lastBufferedAmount = 0;
        this.networkSpeedSamples = [];
        
        // Reset UI
        this.hideLoading();
        this.hideError();
        this.progressPlayed.style.width = '0%';
        this.progressBuffer.style.width = '0%';
        this.progressBuffer.style.left = '0%';
        this.progressThumb.style.left = '0%';
        this.currentTimeEl.textContent = '0:00';
        this.durationEl.textContent = '0:00';
        this.bufferPercent.textContent = '0%';
        this.networkSpeed.textContent = '—';
        
        // Remove buffer health classes
        const bufferStat = document.getElementById('bufferStat');
        bufferStat.classList.remove('healthy', 'warning', 'critical');
        
        // Hide buffer indicator
        this.bufferIndicator.classList.remove('active');
        
        // Clear URL params
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('url');
        window.history.replaceState({}, '', newUrl);
        
        this.urlInput.focus();
    }
    
    showToast(message) {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> ${message}`;
        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.streamFlow = new StreamFlowPlayer();
});

// Service Worker for offline support (optional enhancement)
if ('serviceWorker' in navigator) {
    // Uncomment to enable service worker
    // navigator.serviceWorker.register('/sw.js');
}

