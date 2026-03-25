### 1. USER LOGIC
**Target User Types:**
*   **Casual Browsers:** Users looking for content to watch via discovery on the home feed.
*   **Intent-Driven Viewers:** Users returning to resume a previously started video or searching for a specific title.
*   **Power Users:** Users with specific media URLs or secure share tokens (`?v=TOKEN`) requiring direct playback.

**Primary Goals:**
1.  Discover content or input a custom stream URL with minimal friction.
2.  Resume previously watched content automatically with zero manual seeking.
3.  Control playback seamlessly without the interface interrupting the viewing experience.

**User Journeys:**
*   **Journey A (Discovery):** App Load → Browse Rows → Click Card → DOM transitions to Player View → Playback begins.
*   **Journey B (Resume):** App Load → System detects `localStorage` timestamp → Displays "Resume" Hero Button → Click → Player mounts & seeks to timestamp automatically.
*   **Journey C (Custom Stream):** App Load → Navigate to Custom URL Input → Paste Direct Media Link (.mp4, .m3u8) → Submit → Input Validation → Player mounts.

**Friction Points & Elimination Logic:**
*   *Friction:* Losing video progress upon accidental reload. *Solution:* System writes playback timestamp to `localStorage` every 5 seconds. Player initialization sequence reads this state before requesting the media chunk.
*   *Friction:* Complex player controls cluttering small screens. *Solution:* Granular controls (Aspect Ratio, Loop, Audio Tracks) are grouped into a secondary Overflow Settings menu.

---

### 2. INFORMATION ARCHITECTURE
**Complete Site Structure:**
The system operates as a Single Page Application (SPA) managing three primary DOM states (Views):
1.  **Home / Browse View:** The default landing state for discovery.
2.  **Custom Stream View:** The utility state for manual link entry.
3.  **Video Player View:** The active consumption state.

**Navigation Logic:**
*   Global navigation is persistent only in the Home and Custom Stream states.
*   Transitioning to the Video Player View actively unmounts or completely hides the global navigation to maximize viewport space.
*   Exiting the Player View restores the previous DOM state without a full page reload, maintaining the user's scroll position in the Browse View.

**Avoidance of Unnecessary Steps:**
*   No intermediate "Content Details" page is required. Clicking a media card triggers an immediate state transition to the Player View to minimize time-to-play.

---

### 3. SECTION LOGIC (FOR EACH PAGE)
**A. Home / Browse View**
*   *Purpose:* Facilitate immediate content discovery and playback continuation.
*   *Required Elements:* Hero Section (Resume/Featured), Categorized Horizontal Scroll Rows.
*   *Expected Action:* Click a media card.
*   *Priority Order:* 1. Resume active watch state. 2. Custom Stream Input trigger. 3. Trending/Featured content rows.

**B. Custom Stream View**
*   *Purpose:* Allow power users to play direct media links securely via client-side proxy.
*   *Required Elements:* URL Input Field, Format Warning text, Submit Button.
*   *Expected Action:* Paste a valid `.mp4`, `.mkv`, or `.m3u8` link.
*   *Priority Order:* 1. Input field (receives autofocus). 2. Submit action. 3. Supported formats list.

**C. Video Player View**
*   *Purpose:* Deliver uncompromised video playback.
*   *Required Elements:* HTML5 `<video>` container, Primary Control Bar (Play, Seek, Fullscreen), Secondary Overflow Menu (Quality, Tracks).
*   *Expected Action:* Watch content, adjust basic playback parameters.
*   *Priority Order:* 1. The video stream. 2. Play/Pause and Seek Bar. 3. Fullscreen toggle. 4. Advanced settings.

---

### 4. RESPONSIVE BEHAVIOR (CORE REQUIREMENT)
**A. Home / Browse View**
*   **Mobile (Portrait):** Layout is strictly 1-column. Horizontal rows show 2.5 items (partial item indicates scrollability). Touch interaction requires horizontal swiping. Global nav collapses into a hamburger menu.
*   **Tablet:** Grid expands. Horizontal rows show 4 complete items.
*   **Desktop:** Horizontal rows show 6 items. Touch swiping is disabled; mouse-driven chevron arrows appear on hover to paginate rows.
*   **Large Screens/TV:** Grid maximizes. Typography scales up. Dedicated `:focus` states mapped to D-pad/keyboard navigation logic.

**B. Custom Stream View**
*   **Mobile:** Input field takes 100% width. Submit button stacks vertically below the input to maximize touch target size.
*   **Desktop:** Input field and Submit button sit inline horizontally.

**C. Video Player View**
*   **Mobile:** Playback triggers an immediate API call to `screen.orientation.lock('landscape')`. Control bar icons scale up to minimum 48x48px touch targets. Double-tap left/right edge to seek -/+ 10 seconds.
*   **Tablet/Desktop:** Orientation lock is ignored. Mouse movement triggers control bar visibility. Idle mouse for 3 seconds triggers `opacity: 0` and `pointer-events: none` on the UI wrapper.

---

### 5. INTERACTION LOGIC
**Click / Tap Behavior:**
*   Buttons must resolve their state instantly. Clicking "Play" immediately swaps the icon to a "Loading/Spinner" state until the media `canplay` event fires.
*   Tapping the video canvas toggles the visibility of the player UI.

**Hover Behavior (Desktop Only):**
*   Hovering over a media card triggers a delayed structural expansion (z-index increase, scale transform) revealing metadata without disrupting the underlying grid flow.
*   Hovering the progress bar calculates the mouse X-coordinate relative to the track width to display the precise timestamp.

**Scroll Behavior:**
*   Vertical scrolling triggers a background opacity transition on the global Navbar (from transparent to solid) to maintain text readability.

**Feedback System:**
*   *Success:* Direct state transitions (e.g., successful URL validation immediately mounts the player).
*   *Error:* Toast notification system mounted at the top of the DOM layer. Used for "Invalid Media Link" or "Proxy Decryption Failed". Auto-dismisses after 4 seconds.
*   *Loading:* Skeleton loaders dynamically render in Browse Rows based on the viewport width until the JSON manifest resolves.

---

### 6. COMPONENT LOGIC
**Navbar:**
*   *Logic:* Fixed to the top viewport edge. Tracks `window.scrollY`. If `scrollY > 50`, state switches to `is-scrolled` (solid background). If Player View is active, Navbar is unmounted entirely.

**Forms / Inputs:**
*   *Logic:* Custom Stream input strips whitespace on `paste` event. Validates against a Regex pattern for supported extensions or `?v=TOKEN` structures before enabling the submit button.

**Cards:**
*   *Logic:* Entire component is a single clickable area. Inner elements (title, duration) are non-interactive structurally, preventing nested anchor tag issues.

**Video Control Bar:**
*   *Logic:* Tied to a 3000ms timeout function reset by `mousemove`, `touchstart`, or `keydown`. When timeout executes, a CSS class `is-idle` is applied, structurally hiding controls and setting `cursor: none` on the wrapper.

**Modals / Overflow Settings:**
*   *Logic:* Clicking the settings gear toggles `aria-expanded` and mounts the submenu. A transparent backdrop overlay is mounted beneath the menu. Clicking the overlay or pressing `Escape` unmounts the menu.

---

### 7. PERFORMANCE LOGIC
**Priority Loading:**
*   The primary JavaScript bundle executes only the DOM setup and the Hero section first.
*   Row generation is paginated. Only the top two rows (viewport-visible) load initial image assets.

**Lazy Loading Strategy:**
*   All media cards utilize the `IntersectionObserver` API. Image `src` attributes are held in `data-src`. The observer swaps them only when the card enters within 200px of the viewport threshold.
*   Heavy libraries (like `hls.js` for custom streams) are dynamically imported (`import()`) only if the parsed media URL actually requires it.

**UI Rendering Optimization:**
*   The `<video>` element and its complex UI wrapper do not exist in the DOM until playback is explicitly requested, conserving memory for users who are merely browsing.

---

### 8. ACCESSIBILITY LOGIC
**Tap Target Constraints:**
*   All interactive elements (buttons, slider handles, row navigation chevrons) must compute to a minimum of 48x48 logical pixels, regardless of the visual icon size.

**Keyboard Navigation logic:**
*   *Browse State:* Tab sequence strictly follows: Navbar → Hero → Row 1 → Row 2.
*   *Player State:* Focus is trapped within the player wrapper.
    *   `Spacebar` = Play/Pause
    *   `ArrowRight / ArrowLeft` = Seek +10s / -10s
    *   `F` = Fullscreen API toggle
    *   `M` = Mute toggle

**Avoid Interaction Traps:**
*   If the user opens the Settings Modal inside the player, `Tab` presses cycle only within the modal's buttons. Focus must not escape to hidden player controls beneath it.

---

### 9. CONSISTENCY RULES
**Structural Spacing (Grid Logic):**
*   The layout relies on a strict base-8 spacing unit system (8px, 16px, 24px, 32px, 64px) applied to all margins and paddings to ensure mathematical consistency across component alignments.

**Component Reuse Rules:**
*   The codebase must define a single `PrimaryButton` and `SecondaryButton` DOM structure. No bespoke button HTML should be written for specific sections.
*   The `Card` component used in "Trending" must be the exact same DOM structure used in "Search Results," merely fed different data props.

**State Consistency:**
*   Disabled UI states (e.g., an empty URL submit button) must structurally prevent interaction via `disabled` HTML attributes and `pointer-events: none` in CSS, never just relying on visual dimming.
