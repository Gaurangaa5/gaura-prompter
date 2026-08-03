/**
 * GauraPrompter - Core Controller Module
 */

(function() {
    'use strict';

    // --- State Elements ---
    const state = {
        isScrolling: false,
        scrollSpeed: 5, // Speed values normalized between 1 and 20
        isMirrored: false,
        scrollTopPosition: 0,
        lastTimestamp: 0,
        animationFrameId: null
    };

    // --- DOM Elements Cache ---
    const dom = {
        // Screens
        setupScreen: document.getElementById('setup-screen'),
        prompterScreen: document.getElementById('prompter-screen'),
        
        // Setup Form Controls
        scriptInput: document.getElementById('script-input'),
        fontSize: document.getElementById('font-size'),
        textAlign: document.getElementById('text-align'),
        textColor: document.getElementById('text-color'),
        bgColor: document.getElementById('bg-color'),
        textColorHex: document.getElementById('text-color-hex'),
        bgColorHex: document.getElementById('bg-color-hex'),
        startBtn: document.getElementById('start-btn'),

        // Prompter Screen Controls
        exitBtn: document.getElementById('exit-btn'),
        slowBtn: document.getElementById('slow-btn'),
        playBtn: document.getElementById('play-btn'),
        fastBtn: document.getElementById('fast-btn'),
        flipBtn: document.getElementById('flip-btn'),
        resetBtn: document.getElementById('reset-btn'),
        speedVal: document.getElementById('speed-val'),
        
        // Output Areas
        scrollContainer: document.getElementById('prompter-scroll-container'),
        textOutput: document.getElementById('prompter-text-output')
    };

    // --- Local Storage Management ---
    const STORAGE_KEY = 'gaura_prompter_settings';

    function saveSettingsToStorage() {
        const payload = {
            script: dom.scriptInput.value,
            fontSize: dom.fontSize.value,
            textAlign: dom.textAlign.value,
            textColor: dom.textColor.value,
            bgColor: dom.bgColor.value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }

    function loadSettingsFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const settings = JSON.parse(stored);
                if (settings.script !== undefined) dom.scriptInput.value = settings.script;
                if (settings.fontSize) dom.fontSize.value = settings.fontSize;
                if (settings.textAlign) dom.textAlign.value = settings.textAlign;
                if (settings.textColor) {
                    dom.textColor.value = settings.textColor;
                    dom.textColorHex.textContent = settings.textColor.toUpperCase();
                }
                if (settings.bgColor) {
                    dom.bgColor.value = settings.bgColor;
                    dom.bgColorHex.textContent = settings.bgColor.toUpperCase();
                }
            } catch (err) {
                // Fail silently, load defaults defined in html
            }
        }
    }

    // --- Scroll Cycle Engine ---
    function scrollStep(timestamp) {
        if (!state.isScrolling) return;

        if (!state.lastTimestamp) {
            state.lastTimestamp = timestamp;
        }

        const delta = timestamp - state.lastTimestamp;
        state.lastTimestamp = timestamp;

        // Normalize speed increments for a smooth visual pan.
        // Base scrolling step is dependent on frames rendering.
        const baseFactor = 0.45;
        const speedMultiplier = Math.pow(state.scrollSpeed, 1.35) * baseFactor;
        const normalizedStep = (speedMultiplier * (delta / 16.67));

        state.scrollTopPosition += normalizedStep;
        dom.scrollContainer.scrollTop = Math.floor(state.scrollTopPosition);

        // Terminate at boundary margins
        const maxScroll = dom.scrollContainer.scrollHeight - dom.scrollContainer.clientHeight;
        if (dom.scrollContainer.scrollTop >= maxScroll - 1) {
            pauseScrolling();
        } else {
            state.animationFrameId = requestAnimationFrame(scrollStep);
        }
    }

    // --- State Operations ---
    function startScrolling() {
        if (state.isScrolling) return;
        state.isScrolling = true;
        state.lastTimestamp = 0; // Reset timestamps to avoid delta jumps
        dom.playBtn.textContent = 'Pause';
        dom.playBtn.classList.add('action-btn');
        state.animationFrameId = requestAnimationFrame(scrollStep);
    }

    function pauseScrolling() {
        if (!state.isScrolling) return;
        state.isScrolling = false;
        dom.playBtn.textContent = 'Play';
        if (state.animationFrameId) {
            cancelAnimationFrame(state.animationFrameId);
            state.animationFrameId = null;
        }
    }

    function togglePlayPause() {
        if (state.isScrolling) {
            pauseScrolling();
        } else {
            startScrolling();
        }
    }

    function changeSpeed(delta) {
        const newSpeed = state.scrollSpeed + delta;
        if (newSpeed >= 1 && newSpeed <= 20) {
            state.scrollSpeed = newSpeed;
            dom.speedVal.textContent = state.scrollSpeed;
        }
    }

    function toggleMirror() {
        state.isMirrored = !state.isMirrored;
        if (state.isMirrored) {
            dom.textOutput.classList.add('mirrored');
            dom.flipBtn.classList.add('action-btn');
        } else {
            dom.textOutput.classList.remove('mirrored');
            dom.flipBtn.classList.remove('action-btn');
        }
    }

    function resetPosition() {
        pauseScrolling();
        state.scrollTopPosition = 0;
        dom.scrollContainer.scrollTop = 0;
    }

    // --- Screen Transitions ---
    function launchPrompter() {
        // Save current configured values
        saveSettingsToStorage();

        // 1. Configure visual styles based on setup choices
        dom.prompterScreen.style.backgroundColor = dom.bgColor.value;
        dom.textOutput.style.color = dom.textColor.value;
        dom.textOutput.style.textAlign = dom.textAlign.value;
        
        // Strip out existing size classes and append chosen selector
        dom.textOutput.className = ''; 
        dom.textOutput.classList.add(dom.fontSize.value);
        if (state.isMirrored) {
            dom.textOutput.classList.add('mirrored');
        }

        // 2. Load and verify script
        const rawScript = dom.scriptInput.value.trim();
        dom.textOutput.textContent = rawScript ? rawScript : "No script provided. Please return and paste your speech script.";

        // 3. Setup margins: text must start near the center guide marker
        const screenPadding = Math.floor(dom.scrollContainer.clientHeight / 2);
        dom.textOutput.style.paddingTop = `${screenPadding}px`;
        dom.textOutput.style.paddingBottom = `${screenPadding}px`;

        // 4. Switch screens
        dom.setupScreen.classList.add('hidden');
        dom.prompterScreen.classList.remove('hidden');

        // Force position reset on start
        resetPosition();
    }

    function exitPrompter() {
        pauseScrolling();
        dom.prompterScreen.classList.add('hidden');
        dom.setupScreen.classList.remove('hidden');
    }

    // --- Color Input Syncing Helpers ---
    function setupColorSync(inputEl, labelEl) {
        inputEl.addEventListener('input', (e) => {
            labelEl.textContent = e.target.value.toUpperCase();
        });
    }

    // --- Global Event Bindings ---
    function initListeners() {
        // Navigation / Starts
        dom.startBtn.addEventListener('click', launchPrompter);
        dom.exitBtn.addEventListener('click', exitPrompter);

        // Control Panel
        dom.playBtn.addEventListener('click', togglePlayPause);
        dom.slowBtn.addEventListener('click', () => changeSpeed(-1));
        dom.fastBtn.addEventListener('click', () => changeSpeed(1));
        dom.flipBtn.addEventListener('click', toggleMirror);
        dom.resetBtn.addEventListener('click', resetPosition);

        // Color Previews
        setupColorSync(dom.textColor, dom.textColorHex);
        setupColorSync(dom.bgColor, dom.bgColorHex);

        // Keyboard Navigation Shortcuts
        window.addEventListener('keydown', (e) => {
            // Hotkeys should only intercept inputs when the teleprompter running interface is active
            if (dom.prompterScreen.classList.contains('hidden')) {
                return;
            }

            switch(e.code) {
                case 'Space':
                    e.preventDefault(); // Stop page scrolling mechanics
                    togglePlayPause();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    changeSpeed(1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    changeSpeed(-1);
                    break;
                case 'KeyF':
                    e.preventDefault();
                    toggleMirror();
                    break;
                case 'Escape':
                    e.preventDefault();
                    exitPrompter();
                    break;
            }
        });

        // Recalculate margins when dynamic resizing window occurs while running
        window.addEventListener('resize', () => {
            if (!dom.prompterScreen.classList.contains('hidden')) {
                const screenPadding = Math.floor(dom.scrollContainer.clientHeight / 2);
                dom.textOutput.style.paddingTop = `${screenPadding}px`;
                dom.textOutput.style.paddingBottom = `${screenPadding}px`;
            }
        });
    }

    // --- App initialization entry point ---
    document.addEventListener('DOMContentLoaded', () => {
        loadSettingsFromStorage();
        initListeners();
    });

})();