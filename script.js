/**
 * GauraPrompter v2 - Professional Offline Teleprompter
 * Single-file Vanilla JS Application Engine
 */

// ==========================================================================
// 1. APPLICATION STATE
// ==========================================================================
const State = {
  // Script Variables
  scriptText: '',
  
  // Scroller Execution States
  isPlaying: false,
  scrollSpeed: 5,         // Scaled 1 to 20
  currentScrollY: 0,      // Precise sub-pixel layout pointer
  lastFrameTime: 0,
  animationFrameId: null,

  // UI Interactive States
  lastMouseMoveTime: 0,
  isControlsVisible: true,
  isCursorVisible: true,
  isManualDragging: false,
  dragStartY: 0,
  dragStartScrollTop: 0,

  // Configurations (Autosaved via LocalStorage)
  settings: {
    fontSize: 'medium',   // tiny, small, medium, large, xlarge, massive
    fontFamily: 'Inter',
    alignment: 'left',    // left, center, right, justify
    lineSpacing: 1.5,     // 1.0 to 3.0
    letterSpacing: 0,     // -2px to 10px
    textColor: '#ffffff',
    backgroundHex: '#0a0a0c',
    mirrorMode: false,
    verticalFlip: false,
    showCueLine: true,
    autoHideControls: true,
    autoHideCursor: true,
    autoFullscreen: true,
    smoothScroll: true
  }
};

// Default Fallback Script
const DEFAULT_SCRIPT = `Welcome to GauraPrompter v2!

This is a professional-grade, offline-first teleprompter built for maximum frame rate stability, security, and performance.

HOW TO USE THIS APP:
1. Paste or edit your presentation script in this editor.
2. Adjust your configuration on the right-hand panel (font choices, text alignments, line spacing, mirroring, and system speeds).
3. Click "Start Prompter" or press Spacebar to enter prompter view.
4. Use standard hotkeys to easily control playback during live recordings.

KEYBOARD CONTROL HIGHLIGHTS:
• SPACEBAR: Play or Pause the scrolling engine
• ARROW UP / DOWN: Speed up or slow down
• ESCAPE: Instantly return to the editor dashboard
• KEY "M": Toggle Mirror Mode (for professional beam-splitter physical glass rigs)
• KEY "F": Toggle Fullscreen

All of your configurations, themes, script modifications, and alignments are continuously saved automatically to your browser's offline local memory space. Go ahead, clear this text, write your script, and start filming!`;

// ==========================================================================
// 2. DOM ELEMENT CACHE
// ==========================================================================
const DOM = {
  // Initialization Layers
  loadingScreen: document.getElementById('loadingScreen'),
  loadingBar: document.getElementById('loadingBar'),
  toastContainer: document.getElementById('toastContainer'),

  // Primary Workspace Layouts
  dashboard: document.getElementById('dashboard'),
  prompter: document.getElementById('prompter'),
  scriptEditor: document.getElementById('scriptEditor'),

  // Interactive Buttons
  btnAbout: document.getElementById('btnAbout'),
  btnShortcuts: document.getElementById('btnShortcuts'),
  btnStart: document.getElementById('btnStart'),
  btnExport: document.getElementById('btnExport'),
  btnClear: document.getElementById('btnClear'),
  btnReset: document.getElementById('btnReset'),
  fileImport: document.getElementById('fileImport'),
  btnConfirmClearAction: document.getElementById('btnConfirmClearAction'),
  btnConfirmResetAction: document.getElementById('btnConfirmResetAction'),
  btnEnterFullscreenFloating: document.getElementById('btnEnterFullscreenFloating'),

  // Control Indicators
  autosaveIndicator: document.getElementById('autosaveIndicator'),

  // Statistics Displays
  statWords: document.getElementById('statWords'),
  statChars: document.getElementById('statChars'),
  statParagraphs: document.getElementById('statParagraphs'),
  statLines: document.getElementById('statLines'),
  statSpeakTime: document.getElementById('statSpeakTime'),
  statReadTime: document.getElementById('statReadTime'),
  statFileSize: document.getElementById('statFileSize'),

  // Configuration Elements
  selectFontSize: document.getElementById('selectFontSize'),
  selectFontFamily: document.getElementById('selectFontFamily'),
  alignButtons: document.querySelectorAll('.btn-align'),
  rangeLineSpacing: document.getElementById('rangeLineSpacing'),
  valLineSpacing: document.getElementById('valLineSpacing'),
  rangeLetterSpacing: document.getElementById('rangeLetterSpacing'),
  valLetterSpacing: document.getElementById('valLetterSpacing'),
  rangeScrollSpeed: document.getElementById('rangeScrollSpeed'),
  valScrollSpeed: document.getElementById('valScrollSpeed'),
  inputTextColor: document.getElementById('inputTextColor'),
  lblTextColor: document.getElementById('lblTextColor'),
  inputBgColor: document.getElementById('inputBgColor'),
  lblBgColor: document.getElementById('lblBgColor'),
  chkMirror: document.getElementById('chkMirror'),
  chkVerticalFlip: document.getElementById('chkVerticalFlip'),
  chkCueLine: document.getElementById('chkCueLine'),
  chkAutoHideControls: document.getElementById('chkAutoHideControls'),
  chkAutoHideCursor: document.getElementById('chkAutoHideCursor'),
  chkAutoFullscreen: document.getElementById('chkAutoFullscreen'),
  chkSmoothScroll: document.getElementById('chkSmoothScroll'),

  // Prompter Elements
  progressWrapper: document.getElementById('progressWrapper'),
  progressBar: document.getElementById('progressBar'),
  cueLineOverlay: document.getElementById('cueLineOverlay'),
  prompterViewport: document.getElementById('prompterViewport'),
  prompterScroller: document.getElementById('prompterScroller'),
  statusOverlay: document.getElementById('statusOverlay'),
  prompterControls: document.getElementById('prompterControls'),

  // Prompter Controller Buttons
  pBtnExit: document.getElementById('pBtnExit'),
  pBtnSlower: document.getElementById('pBtnSlower'),
  pBtnPlayPause: document.getElementById('pBtnPlayPause'),
  pBtnFaster: document.getElementById('pBtnFaster'),
  pBtnReset: document.getElementById('pBtnReset'),
  pBtnMirror: document.getElementById('pBtnMirror'),
  pBtnFlip: document.getElementById('pBtnFlip'),
  pBtnFullscreen: document.getElementById('pBtnFullscreen'),
  playIcon: document.getElementById('playIcon'),
  pauseIcon: document.getElementById('pauseIcon'),

  // HUD Outputs
  hudSpeed: document.getElementById('hudSpeed'),
  hudProgress: document.getElementById('hudProgress'),
  hudRemaining: document.getElementById('hudRemaining'),

  // Modal Dialogs
  modalAbout: document.getElementById('modalAbout'),
  modalShortcuts: document.getElementById('modalShortcuts'),
  modalConfirmClear: document.getElementById('modalConfirmClear'),
  modalConfirmReset: document.getElementById('modalConfirmReset')
};

// ==========================================================================
// 3. STORAGE & STATE MANAGEMENT
// ==========================================================================
const Storage = {
  saveAll() {
    localStorage.setItem('gp_script_text', State.scriptText);
    localStorage.setItem('gp_settings', JSON.stringify(State.settings));
    localStorage.setItem('gp_scroll_speed', State.scrollSpeed.toString());
  },

  loadAll() {
    // Load Script Text
    const savedText = localStorage.getItem('gp_script_text');
    State.scriptText = savedText !== null ? savedText : DEFAULT_SCRIPT;
    DOM.scriptEditor.value = State.scriptText;

    // Load Scroll Speed
    const savedSpeed = localStorage.getItem('gp_scroll_speed');
    if (savedSpeed !== null) {
      State.scrollSpeed = parseInt(savedSpeed, 10);
    }

    // Load Settings
    const savedSettings = localStorage.getItem('gp_settings');
    if (savedSettings !== null) {
      try {
        State.settings = { ...State.settings, ...JSON.parse(savedSettings) };
      } catch (e) {
        console.error("Failed to parse settings. Reverting to defaults.", e);
      }
    }
  }
};

// ==========================================================================
// 4. TOAST NOTIFICATIONS
// ==========================================================================
const Toast = {
  show(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose clean inline SVG indicator path based on toast type
    let svgIcon = '';
    if (type === 'success') {
      svgIcon = `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
      svgIcon = `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      svgIcon = `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${svgIcon}
      <span class="toast-message">${message}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    // Fade and Clean up Lifecycle
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3200);
  }
};

// ==========================================================================
// 5. LIVE STATISTICS ENGINE
// ==========================================================================
const StatsEngine = {
  update() {
    const text = State.scriptText || '';
    
    // Clean and split strings for precision count
    const wordsArray = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = wordsArray.length;
    const charCount = text.length;
    
    const paragraphsArray = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphsArray.length;
    
    const lineCount = text === '' ? 0 : text.split('\n').length;

    // Calculations based on industry performance averages
    const speakingSeconds = Math.round((wordCount / 130) * 60);
    const readingSeconds = Math.round((wordCount / 200) * 60);

    // Compute raw memory allocation weight
    const fileBytes = new Blob([text]).size;

    // Update Dashboard Layout DOM
    DOM.statWords.textContent = wordCount.toLocaleString();
    DOM.statChars.textContent = charCount.toLocaleString();
    DOM.statParagraphs.textContent = paragraphCount.toLocaleString();
    DOM.statLines.textContent = lineCount.toLocaleString();
    
    DOM.statSpeakTime.textContent = this.formatTime(speakingSeconds);
    DOM.statReadTime.textContent = this.formatTime(readingSeconds);
    DOM.statFileSize.textContent = this.formatBytes(fileBytes);
  },

  formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const hStr = hrs.toString().padStart(2, '0');
    const mStr = mins.toString().padStart(2, '0');
    const sStr = secs.toString().padStart(2, '0');

    return `${hStr}:${mStr}:${sStr}`;
  },

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};

// ==========================================================================
// 6. MODALS INTERACTION CONTROLLER
// ==========================================================================
const Modals = {
  open(modalElement) {
    modalElement.classList.add('active');
  },

  close(modalElement) {
    modalElement.classList.remove('active');
  },

  initEvents() {
    const self = this;
    
    // Select elements to coordinate close mechanisms
    const modalContainers = document.querySelectorAll('.modal');
    
    modalContainers.forEach(modal => {
      // Direct Close Button trigger
      const closeTrigger = modal.querySelector('.modal-close');
      if (closeTrigger) {
        closeTrigger.addEventListener('click', () => self.close(modal));
      }

      // Action Footer Close trigger
      const footerTriggers = modal.querySelectorAll('.modal-close-btn');
      footerTriggers.forEach(btn => {
        btn.addEventListener('click', () => self.close(modal));
      });

      // Overlay Backdrop Area click
      const backdrop = modal.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', () => self.close(modal));
      }
    });
  }
};

// ==========================================================================
// 7. FILE IMPORT & EXPORT
// ==========================================================================
const FileSystem = {
  importFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      State.scriptText = content;
      DOM.scriptEditor.value = content;
      
      // Sync State & Update Engine Data
      StatsEngine.update();
      Storage.saveAll();
      Toast.show('Script imported successfully.', 'success');
      
      // Reset input value to allow consecutive uploads of same file
      DOM.fileImport.value = '';
    };

    reader.onerror = function() {
      Toast.show('Error reading the imported file.', 'danger');
    };

    reader.readAsText(file);
  },

  exportFile() {
    const text = State.scriptText;
    if (!text.trim()) {
      Toast.show('Workspace is empty. Write a script before exporting.', 'danger');
      return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const tempLink = document.createElement('a');
    tempLink.href = url;
    // Format timestamp name
    const date = new Date();
    const cleanDate = date.toISOString().slice(0,10);
    tempLink.download = `GauraPrompter_Script_${cleanDate}.txt`;
    
    document.body.appendChild(tempLink);
    tempLink.click();
    
    // Lifecycle cleanup
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(url);
    
    Toast.show('Script exported to local downloads.', 'success');
  }
};

// ==========================================================================
// 8. SCROLL ENGINE & RUNTIME PLATFORM
// ==========================================================================
const ScrollEngine = {
  init() {
    this.updateTransformStates();
  },

  start() {
    if (State.isPlaying) return;
    State.isPlaying = true;
    State.lastFrameTime = performance.now();
    
    // UI Visual Class syncs
    DOM.playIcon.className = 'icon-hidden';
    DOM.pauseIcon.className = 'icon-visible';
    DOM.pBtnPlayPause.classList.add('active');
    
    // Execute rendering thread loop
    State.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  },

  pause() {
    if (!State.isPlaying) return;
    State.isPlaying = false;
    
    if (State.animationFrameId) {
      cancelAnimationFrame(State.animationFrameId);
    }
    
    // UI Visual Class syncs
    DOM.playIcon.className = 'icon-visible';
    DOM.pauseIcon.className = 'icon-hidden';
    DOM.pBtnPlayPause.classList.remove('active');
  },

  toggle() {
    if (State.isPlaying) {
      this.pause();
    } else {
      this.start();
    }
  },

  resetPosition() {
    State.currentScrollY = 0;
    DOM.prompterViewport.scrollTop = 0;
    this.updateProgressHUD();
  },

  adjustSpeed(amount) {
    const oldSpeed = State.scrollSpeed;
    State.scrollSpeed = Math.max(1, Math.min(20, State.scrollSpeed + amount));
    
    if (oldSpeed !== State.scrollSpeed) {
      DOM.rangeScrollSpeed.value = State.scrollSpeed;
      DOM.valScrollSpeed.textContent = State.scrollSpeed;
      DOM.hudSpeed.textContent = State.scrollSpeed;
      Storage.saveAll();
      Toast.show(`Scroll Speed set to ${State.scrollSpeed}`);
    }
  },

  loop(timestamp) {
    if (!State.isPlaying) return;

    // Delta Time calculations (Frame rate independent consistency)
    let dt = (timestamp - State.lastFrameTime) / 1000;
    
    // Prevent huge jumps if window loses active focus
    if (dt > 0.1) dt = 0.1; 
    
    State.lastFrameTime = timestamp;

    const viewport = DOM.prompterViewport;
    const maxScroll = viewport.scrollHeight - viewport.clientHeight;

    // Check boundary
    if (State.currentScrollY >= maxScroll) {
      this.pause();
      State.currentScrollY = maxScroll;
      viewport.scrollTop = maxScroll;
      this.updateProgressHUD();
      return;
    }

    if (!State.isManualDragging) {
      // Calculate dynamic speed scaling factor
      // Speed 1 -> 15 px/sec, Speed 20 -> 550 px/sec
      const pixelsPerSecond = 15 + (Math.pow(State.scrollSpeed, 1.8) * 1.5);
      
      State.currentScrollY += pixelsPerSecond * dt;
      viewport.scrollTop = Math.floor(State.currentScrollY);
    } else {
      // If user is actively dragging, lock state pointer to standard scroll layout offset
      State.currentScrollY = viewport.scrollTop;
    }

    this.updateProgressHUD();

    // Loop Frame
    State.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  },

  updateProgressHUD() {
    const viewport = DOM.prompterViewport;
    const maxScroll = viewport.scrollHeight - viewport.clientHeight;
    
    let progressPercent = 0;
    if (maxScroll > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((viewport.scrollTop / maxScroll) * 100)));
    }

    // Set Progress layouts
    DOM.progressBar.style.width = `${progressPercent}%`;
    DOM.hudProgress.textContent = `${progressPercent}%`;

    // Estimate time remaining
    const remainingSeconds = this.estimateRemainingTime(viewport, maxScroll);
    DOM.hudRemaining.textContent = StatsEngine.formatTime(remainingSeconds).substring(3); // format: MM:SS
  },

  estimateRemainingTime(viewport, maxScroll) {
    const remainingScroll = maxScroll - viewport.scrollTop;
    if (remainingScroll <= 0) return 0;

    const pixelsPerSecond = 15 + (Math.pow(State.scrollSpeed, 1.8) * 1.5);
    return Math.max(0, Math.round(remainingScroll / pixelsPerSecond));
  },

  updateTransformStates() {
    const scroller = DOM.prompterScroller;
    
    // Remove old classes
    scroller.classList.remove('mirror-x', 'mirror-y', 'mirror-xy');

    const mirror = State.settings.mirrorMode;
    const vFlip = State.settings.verticalFlip;

    // Apply exact visual scaling adjustments based on geometric toggle parameters
    if (mirror && vFlip) {
      scroller.classList.add('mirror-xy');
    } else if (mirror) {
      scroller.classList.add('mirror-x');
    } else if (vFlip) {
      scroller.classList.add('mirror-y');
    }
  }
};

// ==========================================================================
// 9. FULLSCREEN CONTROLLER
// ==========================================================================
const FullscreenController = {
  toggle() {
    if (!document.fullscreenElement) {
      DOM.prompter.requestFullscreen()
        .then(() => {
          DOM.btnEnterFullscreenFloating.classList.add('hidden');
        })
        .catch(err => {
          Toast.show('Fullscreen request denied by browser security layers.', 'danger');
          console.error(`Fullscreen Error: ${err.message}`);
        });
    } else {
      document.exitFullscreen();
    }
  },

  handleStateChange() {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    
    // Handle UI button highlighting indicators
    if (isCurrentlyFullscreen) {
      DOM.pBtnFullscreen.classList.add('active');
      DOM.btnEnterFullscreenFloating.classList.add('hidden');
    } else {
      DOM.pBtnFullscreen.classList.remove('active');
      
      // If we are still looking at the Prompter Screen and autoFullscreen was configured, 
      // reveal floating notice button to return to fullscreen comfortably.
      if (!DOM.prompter.classList.contains('hidden')) {
        DOM.btnEnterFullscreenFloating.classList.remove('hidden');
      }
    }
  }
};

// ==========================================================================
// 10. SYSTEM UI ENGINE & LOCAL STORAGE COORDINATION
// ==========================================================================
const UI = {
  init() {
    // 1. Initial State Syncing
    Storage.loadAll();
    
    // 2. Setup Configuration UI elements to match state values
    this.hydrateUIControls();
    
    // 3. Render Script & Initial Calculation Calculations
    StatsEngine.update();
  },

  hydrateUIControls() {
    // Fonts & sizes
    DOM.selectFontSize.value = State.settings.fontSize;
    DOM.selectFontFamily.value = State.settings.fontFamily;
    
    // Alignment group
    DOM.alignButtons.forEach(btn => {
      if (btn.dataset.align === State.settings.alignment) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Spacing range sliders
    DOM.rangeLineSpacing.value = State.settings.lineSpacing;
    DOM.valLineSpacing.textContent = `${State.settings.lineSpacing}x`;

    DOM.rangeLetterSpacing.value = State.settings.letterSpacing;
    DOM.valLetterSpacing.textContent = `${State.settings.letterSpacing}px`;

    // Speed range sliders
    DOM.rangeScrollSpeed.value = State.scrollSpeed;
    DOM.valScrollSpeed.textContent = State.scrollSpeed;
    DOM.hudSpeed.textContent = State.scrollSpeed;

    // Custom Color Palette hex codes
    DOM.inputTextColor.value = State.settings.textColor;
    DOM.lblTextColor.textContent = State.settings.textColor.toUpperCase();

    DOM.inputBgColor.value = State.settings.backgroundHex;
    DOM.lblBgColor.textContent = State.settings.backgroundHex.toUpperCase();

    // Checkbox toggles
    DOM.chkMirror.checked = State.settings.mirrorMode;
    DOM.chkVerticalFlip.checked = State.settings.verticalFlip;
    DOM.chkCueLine.checked = State.settings.showCueLine;
    DOM.chkAutoHideControls.checked = State.settings.autoHideControls;
    DOM.chkAutoHideCursor.checked = State.settings.autoHideCursor;
    DOM.chkAutoFullscreen.checked = State.settings.autoFullscreen;
    DOM.chkSmoothScroll.checked = State.settings.smoothScroll;
  },

  applyAllCurrentStyles() {
    const scroller = DOM.prompterScroller;
    const viewport = DOM.prompterViewport;
    
    // Remove previous typography scaling classes
    scroller.classList.remove('text-tiny', 'text-small', 'text-medium', 'text-large', 'text-xlarge', 'text-massive');
    scroller.classList.add(`text-${State.settings.fontSize}`);

    // Set structural and design styles
    scroller.style.fontFamily = State.settings.fontFamily;
    scroller.style.textAlign = State.settings.alignment;
    scroller.style.lineHeight = State.settings.lineSpacing;
    scroller.style.letterSpacing = `${State.settings.letterSpacing}px`;
    
    // Align core background coloring limits
    DOM.prompter.style.backgroundColor = State.settings.backgroundHex;
    scroller.style.color = State.settings.textColor;

    // Mirror updates
    ScrollEngine.updateTransformStates();

    // Guide Cue UI visibility toggles
    if (State.settings.showCueLine) {
      DOM.cueLineOverlay.style.display = 'flex';
    } else {
      DOM.cueLineOverlay.style.display = 'none';
    }
  },

  enterPrompterView() {
    // 1. Build script in target container
    const cleanText = State.scriptText.trim();
    if (!cleanText) {
      Toast.show('Please write or import a script first.', 'danger');
      return;
    }

    // Convert newlines to block paragraph spaces for cleaner prompter typography
    DOM.prompterScroller.innerHTML = cleanText
      .split('\n')
      .map(line => line.trim() === '' ? '<br>' : `<div>${line}</div>`)
      .join('');

    // Apply all customized layout and theme controls
    this.applyAllCurrentStyles();

    // Switch view panel states
    DOM.dashboard.classList.add('hidden');
    DOM.prompter.classList.remove('hidden');

    // Reset layout scroller state tracking
    ScrollEngine.resetPosition();

    // Fullscreen behavior execution wrapper
    if (State.settings.autoFullscreen) {
      FullscreenController.toggle();
    }

    // Start auto-hide monitors
    State.lastMouseMoveTime = performance.now();
    this.showCursorAndControls();

    Toast.show('Prompter Mode activated.', 'success');
  },

  exitPrompterView() {
    ScrollEngine.pause();

    // Exit active fullscreens natively if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Switch visual panels
    DOM.prompter.classList.add('hidden');
    DOM.dashboard.classList.remove('hidden');

    // Reset default browser pointer environments
    document.body.style.cursor = 'default';

    Toast.show('Returned to script editor.');
  },

  showCursorAndControls() {
    State.isControlsVisible = true;
    State.isCursorVisible = true;
    
    DOM.prompterControls.classList.remove('fade-out');
    DOM.statusOverlay.style.opacity = '1';
    DOM.cueLineOverlay.style.opacity = '1';
    document.body.style.cursor = 'default';
  },

  hideCursorAndControls() {
    // Only hide if settings permit and engine is actively executing scroller threads
    if (!State.isPlaying) return;

    if (State.settings.autoHideControls) {
      State.isControlsVisible = false;
      DOM.prompterControls.classList.add('fade-out');
      DOM.statusOverlay.style.opacity = '0';
    }

    if (State.settings.autoHideCursor) {
      State.isCursorVisible = false;
      document.body.style.cursor = 'none';
    }
  },

  handleMouseMovePrompter() {
    this.showCursorAndControls();
    
    // Clear legacy timers to re-initialize layout decay clocks
    clearTimeout(this.mouseMoveTimeout);
    
    this.mouseMoveTimeout = setTimeout(() => {
      this.hideCursorAndControls();
    }, 2000);
  }
};

// ==========================================================================
// 11. KEYBOARD SHORTCUTS MANAGER
// ==========================================================================
const Keyboard = {
  init() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  },

  handleKeyDown(event) {
    // Check if the focus path is inside an input/textarea
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' || 
      activeEl.tagName === 'TEXTAREA' || 
      activeEl.isContentEditable
    );

    // If user is editing in dashboard, bypass shortcut logic (except Escape key behavior for focus exit)
    if (isTyping && event.key !== 'Escape') {
      return;
    }

    // Capture standard hotkeys
    const key = event.key.toLowerCase();

    // Check if prompter view is active
    const inPrompter = !DOM.prompter.classList.contains('hidden');

    if (inPrompter) {
      switch (event.key) {
        case ' ': // Spacebar
          event.preventDefault();
          ScrollEngine.toggle();
          break;
        case 'ArrowUp':
          event.preventDefault();
          ScrollEngine.adjustSpeed(1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          ScrollEngine.adjustSpeed(-1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          DOM.prompterViewport.scrollTop -= 60;
          State.currentScrollY = DOM.prompterViewport.scrollTop;
          break;
        case 'ArrowRight':
          event.preventDefault();
          DOM.prompterViewport.scrollTop += 60;
          State.currentScrollY = DOM.prompterViewport.scrollTop;
          break;
        case 'Escape':
          event.preventDefault();
          UI.exitPrompterView();
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          State.settings.mirrorMode = !State.settings.mirrorMode;
          DOM.chkMirror.checked = State.settings.mirrorMode;
          ScrollEngine.updateTransformStates();
          Storage.saveAll();
          Toast.show(`Mirror Mode: ${State.settings.mirrorMode ? 'ON' : 'OFF'}`);
          break;
        case 'v':
        case 'V':
          event.preventDefault();
          State.settings.verticalFlip = !State.settings.verticalFlip;
          DOM.chkVerticalFlip.checked = State.settings.verticalFlip;
          ScrollEngine.updateTransformStates();
          Storage.saveAll();
          Toast.show(`Vertical Flip: ${State.settings.verticalFlip ? 'ON' : 'OFF'}`);
          break;
        case 'h':
        case 'H':
          event.preventDefault();
          State.settings.autoHideControls = !State.settings.autoHideControls;
          DOM.chkAutoHideControls.checked = State.settings.autoHideControls;
          Storage.saveAll();
          if (!State.settings.autoHideControls) {
            UI.showCursorAndControls();
          }
          Toast.show(`Auto-Hide Controls: ${State.settings.autoHideControls ? 'ON' : 'OFF'}`);
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          ScrollEngine.resetPosition();
          Toast.show('Position Reset');
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          FullscreenController.toggle();
          break;
        case '?':
          event.preventDefault();
          // Fall through to open modal
          Modals.open(DOM.modalShortcuts);
          break;
      }
    } else {
      // Dashboard only Key bindings
      switch (key) {
        case ' ':
          // Prevent standard scroll on page if active focus is somehow lost
          if (activeEl === document.body) {
            event.preventDefault();
            UI.enterPrompterView();
          }
          break;
        case '?':
          event.preventDefault();
          Modals.open(DOM.modalShortcuts);
          break;
      }
    }
  }
};

// ==========================================================================
// 12. MOUSE & DRAG EVENT INTERACTION
// ==========================================================================
const MouseEvents = {
  init() {
    const viewport = DOM.prompterViewport;

    // Wheel inputs update local position calculations immediately
    viewport.addEventListener('wheel', () => {
      // Synchronize standard trackpad/mouse layout positions
      State.currentScrollY = viewport.scrollTop;
      ScrollEngine.updateProgressHUD();
    }, { passive: true });

    // Drag and Drop Scroll handling
    viewport.addEventListener('mousedown', (e) => this.dragStart(e));
    window.addEventListener('mousemove', (e) => this.dragMove(e));
    window.addEventListener('mouseup', () => this.dragEnd());
  },

  dragStart(event) {
    State.isManualDragging = true;
    State.dragStartY = event.pageY;
    State.dragStartScrollTop = DOM.prompterViewport.scrollTop;
    DOM.prompterViewport.style.cursor = 'grabbing';
  },

  dragMove(event) {
    if (!State.isManualDragging) return;
    
    // Reverse movement offset calculation for intuitive screen drag physics
    const deltaY = event.pageY - State.dragStartY;
    DOM.prompterViewport.scrollTop = State.dragStartScrollTop - deltaY;
    
    // Lock track pointer state
    State.currentScrollY = DOM.prompterViewport.scrollTop;
    ScrollEngine.updateProgressHUD();
  },

  dragEnd() {
    if (!State.isManualDragging) return;
    State.isManualDragging = false;
    DOM.prompterViewport.style.cursor = 'default';
  }
};

// ==========================================================================
// 13. LIFECYCLE INITIALIZATION
// ==========================================================================
const App = {
  init() {
    this.bindEvents();
    UI.init();
    Modals.initEvents();
    Keyboard.init();
    MouseEvents.init();
    ScrollEngine.init();

    // Kill Loading sequence elegantly after a calculated asset buffer
    this.runStartupAnimation();
  },

  bindEvents() {
    // Script Area Text Syncs
    DOM.scriptEditor.addEventListener('input', (e) => {
      State.scriptText = e.target.value;
      
      // Flash UI save tags
      DOM.autosaveIndicator.classList.add('saving');
      
      // Update data statistics and auto save outputs
      StatsEngine.update();
      Storage.saveAll();
    });

    // Start App action hooks
    DOM.btnStart.addEventListener('click', () => UI.enterPrompterView());

    // File Actions Import Export
    DOM.fileImport.addEventListener('change', (e) => FileSystem.importFile(e));
    DOM.btnExport.addEventListener('click', () => FileSystem.exportFile());

    // Clean Workspace Confirmation Modal Logic
    DOM.btnClear.addEventListener('click', () => Modals.open(DOM.modalConfirmClear));
    DOM.btnConfirmClearAction.addEventListener('click', () => {
      State.scriptText = '';
      DOM.scriptEditor.value = '';
      StatsEngine.update();
      Storage.saveAll();
      Modals.close(DOM.modalConfirmClear);
      Toast.show('Script workspace cleared successfully.', 'success');
    });

    // Configuration Reset Modals
    DOM.btnReset.addEventListener('click', () => Modals.open(DOM.modalConfirmReset));
    DOM.btnConfirmResetAction.addEventListener('click', () => {
      // Clear persistent parameters and force reboot defaults
      localStorage.removeItem('gp_settings');
      localStorage.removeItem('gp_scroll_speed');
      
      // Refresh configurations state
      State.settings = {
        fontSize: 'medium',
        fontFamily: 'Inter',
        alignment: 'left',
        lineSpacing: 1.5,
        letterSpacing: 0,
        textColor: '#ffffff',
        backgroundHex: '#0a0a0c',
        mirrorMode: false,
        verticalFlip: false,
        showCueLine: true,
        autoHideControls: true,
        autoHideCursor: true,
        autoFullscreen: true,
        smoothScroll: true
      };
      State.scrollSpeed = 5;

      UI.hydrateUIControls();
      Storage.saveAll();
      Modals.close(DOM.modalConfirmReset);
      Toast.show('Configuration variables restored.', 'success');
    });

    // Configuration Interactive Value Change Handlers
    DOM.selectFontSize.addEventListener('change', (e) => {
      State.settings.fontSize = e.target.value;
      Storage.saveAll();
    });

    DOM.selectFontFamily.addEventListener('change', (e) => {
      State.settings.fontFamily = e.target.value;
      Storage.saveAll();
    });

    DOM.alignButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.alignButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.settings.alignment = btn.dataset.align;
        Storage.saveAll();
      });
    });

    DOM.rangeLineSpacing.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value).toFixed(1);
      State.settings.lineSpacing = parseFloat(val);
      DOM.valLineSpacing.textContent = `${val}x`;
      Storage.saveAll();
    });

    DOM.rangeLetterSpacing.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value).toFixed(1);
      State.settings.letterSpacing = parseFloat(val);
      DOM.valLetterSpacing.textContent = `${val}px`;
      Storage.saveAll();
    });

    DOM.rangeScrollSpeed.addEventListener('input', (e) => {
      State.scrollSpeed = parseInt(e.target.value, 10);
      DOM.valScrollSpeed.textContent = State.scrollSpeed;
      DOM.hudSpeed.textContent = State.scrollSpeed;
      Storage.saveAll();
    });

    DOM.inputTextColor.addEventListener('input', (e) => {
      const color = e.target.value;
      State.settings.textColor = color;
      DOM.lblTextColor.textContent = color.toUpperCase();
      Storage.saveAll();
    });

    DOM.inputBgColor.addEventListener('input', (e) => {
      const color = e.target.value;
      State.settings.backgroundHex = color;
      DOM.lblBgColor.textContent = color.toUpperCase();
      Storage.saveAll();
    });

    // Switch check values
    DOM.chkMirror.addEventListener('change', (e) => {
      State.settings.mirrorMode = e.target.checked;
      Storage.saveAll();
    });

    DOM.chkVerticalFlip.addEventListener('change', (e) => {
      State.settings.verticalFlip = e.target.checked;
      Storage.saveAll();
    });

    DOM.chkCueLine.addEventListener('change', (e) => {
      State.settings.showCueLine = e.target.checked;
      Storage.saveAll();
    });

    DOM.chkAutoHideControls.addEventListener('change', (e) => {
      State.settings.autoHideControls = e.target.checked;
      Storage.saveAll();
    });

    DOM.chkAutoHideCursor.addEventListener('change', (e) => {
      State.settings.autoHideCursor = e.target.checked;
      Storage.saveAll();
    });

    DOM.chkAutoFullscreen.addEventListener('change', (e) => {
      State.settings.autoFullscreen = e.target.checked;
      Storage.saveAll();
    });

    DOM.chkSmoothScroll.addEventListener('change', (e) => {
      State.settings.smoothScroll = e.target.checked;
      Storage.saveAll();
    });

    // Header Meta Information dialog triggers
    DOM.btnAbout.addEventListener('click', () => Modals.open(DOM.modalAbout));
    DOM.btnShortcuts.addEventListener('click', () => Modals.open(DOM.modalShortcuts));

    // Fullscreen Event Changes Listener
    document.addEventListener('fullscreenchange', () => FullscreenController.handleStateChange());
    document.addEventListener('webkitfullscreenchange', () => FullscreenController.handleStateChange());

    // Prompter Screen Floating Control Actions
    DOM.pBtnExit.addEventListener('click', () => UI.exitPrompterView());
    DOM.pBtnSlower.addEventListener('click', () => ScrollEngine.adjustSpeed(-1));
    DOM.pBtnPlayPause.addEventListener('click', () => ScrollEngine.toggle());
    DOM.pBtnFaster.addEventListener('click', () => ScrollEngine.adjustSpeed(1));
    DOM.pBtnReset.addEventListener('click', () => {
      ScrollEngine.resetPosition();
      Toast.show('Position Reset');
    });
    DOM.pBtnMirror.addEventListener('click', () => {
      State.settings.mirrorMode = !State.settings.mirrorMode;
      DOM.chkMirror.checked = State.settings.mirrorMode;
      ScrollEngine.updateTransformStates();
      Storage.saveAll();
      Toast.show(`Mirror Mode: ${State.settings.mirrorMode ? 'ON' : 'OFF'}`);
    });
    DOM.pBtnFlip.addEventListener('click', () => {
      State.settings.verticalFlip = !State.settings.verticalFlip;
      DOM.chkVerticalFlip.checked = State.settings.verticalFlip;
      ScrollEngine.updateTransformStates();
      Storage.saveAll();
      Toast.show(`Vertical Flip: ${State.settings.verticalFlip ? 'ON' : 'OFF'}`);
    });
    DOM.pBtnFullscreen.addEventListener('click', () => FullscreenController.toggle());
    
    DOM.btnEnterFullscreenFloating.addEventListener('click', () => FullscreenController.toggle());

    // Mouse idle behavior monitor in Prompter mode
    DOM.prompter.addEventListener('mousemove', () => UI.handleMouseMovePrompter());
  },

  runStartupAnimation() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Final fade output sequence
        setTimeout(() => {
          DOM.loadingScreen.style.opacity = '0';
          DOM.loadingScreen.style.visibility = 'hidden';
          Toast.show('GauraPrompter Online', 'success');
        }, 300);
      }
      DOM.loadingBar.style.width = `${progress}%`;
    }, 120);
  }
};

// Start core lifecycle on safe compile
document.addEventListener('DOMContentLoaded', () => App.init());