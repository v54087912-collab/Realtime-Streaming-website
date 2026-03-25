# StreamFlow Video Player - UI/UX Architecture

## 1. USER LOGIC

**Target User Types**
1. **Direct Viewers:** Users accessing safe-share links (`?v=TOKEN`) to consume content seamlessly.
2. **Power Users:** Users manually inputting direct media links (`.mp4`, `.mkv`, `.m3u8`) or utilizing advanced features (dual-audio, subtitle injection, quality selection).

**Primary Goals**
* Instantly initiate playback without configuration friction.
* Resume previously watched content exactly where they left off.
* Manage complex video controls (audio tracks, playback speed, picture-in-picture) without interrupting the viewing experience.

**User Journeys**
* **Journey A (Automated Consumption):** Entry via Share Link (`?v=TOKEN`) → Application hits `/api/share` backend resolver → Player automatically mounts, hides input section, and begins buffering → Playback starts.
* **Journey B (Manual Entry):** Entry via Home view (`url-section`) → User pastes URL into input field (can toggle "Use Proxy") → Clicks 'Stream' → State transitions to `player-section` → Playback starts.
* **Journey C (Resume):** Entry via Share Link or Manual Entry → Player reads `localStorage` for timestamps (using a generated movie ID) → `resumePrompt` toast appears → User clicks 'Resume' → Player seeks to saved timestamp.

**Friction Points Eliminated**
* *Friction:* Cluttered mobile screens during playback. *Solution:* Auto-hide control bar after 3 seconds of inactivity; hide cursor in fullscreen mode.
* *Friction:* Losing progress. *Solution:* Silent interval saves to `localStorage` every 5 seconds; automatic prompt to resume on load.
* *Friction:* Seeking unbuffered content. *Solution:* Visual buffer indicators and network speed displays provide real-time feedback on stream health.

---

## 2. INFORMATION ARCHITECTURE

**Site Structure (Single Page Application)**
The system operates as a single HTML file (`index.html`) managing state via CSS visibility toggles to minimize page loads and DOM destruction.
1. **Home/Input State (`#urlSection`):** The ingest interface for manual URLs.
2. **Player State (`#playerSection`):** The active consumption interface.

**Navigation Logic**
* **State Transition:** Moving from Home to Player hides `#urlSection` (`display: none`) and shows `#playerSection` (`display: flex`).
* **Back Behavior:** Clicking the 'New Video' arrow within the Player state pauses the video, clears the source, and transitions the DOM back to the Home state.
* **Sidebar Menu:** A global, off-canvas sidebar (`#sidebar`) accessible via the logo, providing external community links.

---

## 3. SECTION LOGIC

### Section: Home / Input View (`#urlSection`)
* **Purpose:** To capture user intent for new stream creation.
* **Expected Action:** Paste a URL and click Stream.
* **Elements (Required Only):**
  1. Title and Subtitle.
  2. URL Input Field (`#videoUrl`).
  3. Action Button ('Stream').
  4. Proxy Toggle (`#useProxy`).
  5. Supported Format Tags.
* **Priority Order:**
  1. Input Field (Autofocused on load).
  2. Action Button.

### Section: Player View (`#playerSection`)
* **Purpose:** Uninterrupted content consumption.
* **Expected Action:** Watch, seek, adjust environment (volume, fullscreen, speed).
* **Elements (Required Only):**
  1. Video Canvas (`#videoPlayer`).
  2. Play Overlay (`#playOverlay` - Big centered play button).
  3. Control Bar (`#controls` - Play/Pause, Progress Bar, Time, Audio Toggle, Settings Menu, Fullscreen).
  4. Overlays (Loading, Error, Buffer Indicators).
* **Priority Order:**
  1. Content (100% viewport).
  2. Core playback controls (Play/Seek).
  3. Contextual controls (Quality/Audio/Speed).

---

## 4. RESPONSIVE BEHAVIOR (MOBILE-FIRST)

**General Layout**
* The layout is fluid and heavily relies on Flexbox for component distribution.

**Home View**
* **Mobile:** The URL input and Stream button stack vertically (`flex-direction: column`).
* **Tablet:** The URL input and Stream button shift to a horizontal row (`flex-direction: row`) to utilize wider screen space.
* **Desktop:** The layout remains horizontal but centralizes with max-width constraints.
* **Large screens / TV:** Form scales up proportionally.

**Player View**
* **Mobile:**
  * Controls wrap logically. Time display moves to a full-width row (`order: 10`, `justify-content: center`) below the primary buttons.
  * Volume slider is hidden by default and expands on hover/interaction.
  * Entering Fullscreen automatically attempts to trigger `screen.orientation.lock('landscape')` to force the optimal viewing aspect ratio.
* **Tablet:**
  * Full layout elements (stats in header) become visible.
  * Time display shifts to inline (`order: unset`).
* **Desktop:**
  * Hover states enabled on the progress bar to show timestamp tooltips before clicking.
* **Large screens / TV:**
  * Control bar padding scales up drastically (e.g., `bottom: 40px; padding: 20px 32px`).
  * Mouse cursor is explicitly hidden after 3 seconds of inactivity. Keyboard/Remote focus states are prioritized.

---

## 5. INTERACTION LOGIC

**Click / Tap Behavior**
* **Active State:** All interactive elements (`.ctrl-btn`, `.play-btn`) utilize `transform: scale(0.95)` with a fast transition on `:active` to provide tactile feedback confirming the action.
* **Time Input:** Clicking the current time display transforms it into an input field, allowing users to type exact timestamps (e.g., "1:30:00") to jump to a specific point.
* **Double Tap:** Double-clicking the video canvas toggles fullscreen mode.

**Hover Behavior (Desktop Only)**
* Hovering over the Player View reveals the Control Bar.
* Hovering over the Progress Bar enlarges the scrubber handle (`transform: scale(1)`) and displays a time tooltip.
* Hovering the volume icon expands the volume slider horizontally.

**Player Control Bar Auto-Hide**
* **Logic:** The `#controls` element has its opacity set to 1 on mouse movement. A `setTimeout` of 3000ms removes the `show-controls` class, fading it out to prevent blocking the video canvas.

**Feedback System**
* **Success:** Actions like copying a share link trigger a temporary Toast notification in the bottom right corner.
* **Error:** Network failures or invalid URLs trigger a centralized `#errorOverlay` with a "Try Again" button to allow user recovery.
* **Loading:** A non-blocking, centered loading spinner (`#loadingOverlay`) appears when the `video.readyState` indicates buffering. A secondary, subtle "Buffering ahead..." indicator appears in the top right to confirm network activity when paused.

---

## 6. COMPONENT LOGIC

**Navbar (Header)**
* **Behavior:** Stays fixed at the top. Contains the logo (which triggers the sidebar) and real-time network/buffer stats. Stats are dynamically updated based on video buffering events.

**Buttons**
* **Behavior:** Enabled by default. Buttons like 'Stream' remain enabled to trigger client-side validation logic on click rather than pre-emptively disabling them. Buttons inside menus (e.g., quality selection) close the parent menu upon click.

**Forms**
* **Validation Logic:** The URL input relies on basic browser `type="url"` validation. Advanced validation (e.g., network reachability or CORS issues) is deferred to the media player loading state, which catches errors and displays the `#errorOverlay`. The time input validates formats like "1:30" or "90s" before executing a seek.

**Cards / List Items (Menus)**
* **Click Behavior:** Clicking an option within a dropdown menu (like the Audio Track or Playback Speed menu) applies the selected state, updates the internal player state, and immediately closes the parent menu.

**Modals (Overlays & Settings)**
* **Open/Close Rules:**
  * The Keyboard Shortcuts modal (`#shortcutsModal`) opens via button click or the `?` key and closes via the 'Got it' button or `Escape` key.
  * Settings menus (Gear icon) open on click and close automatically if the user clicks anywhere outside the menu boundaries (`document.addEventListener('click')`).

**Progress Bar (Seeker)**
* **Behavior:** Composed of three layers: buffer background, played foreground, and interactive thumb.
* **Logic:** Clicking or dragging the bar calculates `(e.offsetX / bar.offsetWidth) * video.duration`. The video player automatically initiates playback upon a seek event to eliminate the need for a secondary 'play' click.

---

## 7. PERFORMANCE LOGIC

**Rendering Priority**
* **First:** The DOM structure and core CSS.
* **Second:** The Home state UI elements (`#urlSection`).
* **Third (Deferred):** Video Player initialization and media parsing libraries (e.g., HLS.js or Dash.js are only loaded/instantiated if specifically required by the input URL).

**Optimization Strategies**
* **Event Listeners:** The `timeupdate` event is utilized for progress bar updates and saving state to `localStorage`, but the save operation is throttled to execute only once every 5000ms to reduce I/O overhead.
* **CSS Hardware Acceleration:** All animations (hiding controls, overlays, modals) strictly use `opacity` and `transform` rather than altering layout properties (like width/height/display) during runtime, preventing costly browser reflows.

---

## 8. ACCESSIBILITY LOGIC

**Tap Targets**
* Actionable control elements are padded to a minimum of `42x42px` to ensure reliable interaction on touch devices, preventing accidental misclicks.

**Keyboard Navigation**
* A comprehensive global Event Listener maps physical keys to playback actions:
  * `Spacebar` / `k`: Toggle Play/Pause.
  * `f`: Fullscreen toggle.
  * `m`: Mute toggle.
  * `p`: Picture-in-Picture toggle.
  * `Arrow Left/Right` or `j`/`l`: Seek +/- 10 seconds.
  * `Arrow Up/Down`: Volume +/- 10%.
  * `0-9`: Jump to 0%-90% of the video duration.

**Readability & Interaction Traps**
* Text contrast ratios are maintained using high-contrast white-on-black text.
* Focus traps are not explicitly enforced, but modal overlays cover the entire viewport to prevent background interaction while active.

---

## 9. CONSISTENCY RULES

**Spacing Logic (8px System)**
* All margins, paddings, and gap properties strictly adhere to a mathematical 8px grid system (`8px`, `12px`, `16px`, `24px`, `32px`). This ensures structural consistency across components regardless of the viewport size or device type.

**Component Reuse Rules**
* Control buttons universally utilize a standardized `.ctrl-btn` class with nested SVG icons. This ensures sizing, hover, and active states remain perfectly synchronized across the entire player bar, avoiding duplicate CSS definitions for every new button added.
