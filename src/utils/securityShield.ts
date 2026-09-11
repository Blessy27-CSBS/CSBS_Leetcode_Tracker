/**
 * CSBS LeetCode Tracker - Frontend Security Deterrence Shield
 * 
 * NOTE: Client-side restrictions are defense-in-depth deterrence to prevent
 * casual inspection, right-click copying, accidental dumps, screenshots, and DevTools inspection.
 * True security is enforced on the backend via token auth, RBAC, and rate limiting.
 */

export type SecurityAlert = {
  id: string;
  type: 'contextmenu' | 'shortcut' | 'copy' | 'devtools' | 'print' | 'screenshot';
  message: string;
  timestamp: number;
};

type AlertListener = (alert: SecurityAlert) => void;
const listeners: Set<AlertListener> = new Set();

export function onSecurityAlert(listener: AlertListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let lastAlertTime = 0;
function emitAlert(type: SecurityAlert['type'], message: string) {
  const now = Date.now();
  // Throttle alerts to avoid spamming the UI
  if (now - lastAlertTime < 800) return;
  lastAlertTime = now;

  const alert: SecurityAlert = {
    id: `sec_${now}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    message,
    timestamp: now,
  };

  listeners.forEach((listener) => {
    try {
      listener(alert);
    } catch (e) {
      console.error('Security alert listener error:', e);
    }
  });
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if (target.isContentEditable) return true;
  if (target.closest('input, textarea, [contenteditable="true"]')) return true;
  return false;
}

export function initSecurityShield(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 0. Ensure Privacy Shield Overlay exists in DOM
  let overlayEl = document.getElementById('privacy-shield-overlay');
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    overlayEl.id = 'privacy-shield-overlay';
    overlayEl.innerHTML = `
      <div class="privacy-shield-card">
        <div class="privacy-icon">🔒</div>
        <h3 class="privacy-title">Privacy Shield Active</h3>
        <p class="privacy-desc">
          Protected Academic Data • CSBS LeetCode Tracker<br/>
          Student performance rankings and statistics are hidden during window blur or screen capture attempts.
        </p>
        <div class="privacy-action">
          Click or return focus to resume
        </div>
      </div>
    `;
    document.body.appendChild(overlayEl);
    overlayEl.addEventListener('click', () => {
      document.body.classList.remove('privacy-shield-active');
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.classList.remove('window-blurred');
    });
  }

  // 1. Console Warning Banner
  try {
    const bannerStyle = 'color: #ef4444; font-size: 28px; font-weight: 900; -webkit-text-stroke: 1px black;';
    const subStyle = 'color: #38bdf8; font-size: 13px; font-weight: 600; line-height: 1.6;';
    const textStyle = 'color: #94a3b8; font-size: 12px; font-weight: normal;';

    console.clear();
    console.log('%c⚠️ SECURITY NOTICE: RESTRICTED SYSTEM', bannerStyle);
    console.log(
      '%cCSBS LeetCode Tracker & Performance Hub — KGiSL Institute of Technology\n' +
      'Unauthorized copying, scraping, screenshots, reverse-engineering, or tampering with academic data is strictly prohibited.\n' +
      'All API activities and session events are cryptographically authenticated and monitored.',
      subStyle
    );
    console.log('%cFrontend security shield active. Client-side actions are monitored.', textStyle);
  } catch (e) {}

  // 2. Intercept & Deter Browser Screen Capture APIs (getDisplayMedia)
  try {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      navigator.mediaDevices.getDisplayMedia = function (..._args: any[]) {
        document.body.classList.add('privacy-shield-active');
        emitAlert('screenshot', 'Screen recording and display capture is restricted on this platform.');
        setTimeout(() => {
          document.body.classList.remove('privacy-shield-active');
        }, 5000);
        return Promise.reject(new DOMException('Screen display capture is disabled on CSBS LeetCode Tracker.', 'NotAllowedError'));
      };
    }
  } catch (e) {}

  // 3. Disable Context Menu (Right Click)
  const handleContextMenu = (e: MouseEvent) => {
    if (isEditableElement(e.target)) return;

    e.preventDefault();
    e.stopPropagation();
    emitAlert('contextmenu', 'Right-click is disabled to protect platform data.');
    return false;
  };

  // Helper to trigger screenshot protection veil flash & clipboard wipe
  const triggerScreenshotDeterrence = (reason: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('');
      }
    } catch (err) {}

    // Add temporary privacy shield overlay
    document.body.classList.add('privacy-shield-active');
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.classList.add('screenshot-obscured');

    setTimeout(() => {
      document.body.classList.remove('privacy-shield-active');
      if (rootEl) rootEl.classList.remove('screenshot-obscured');
    }, 2500);

    emitAlert('screenshot', reason);
  };

  // 4. Keydown & Screenshot Shortcut Interception
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key ? e.key.toLowerCase() : '';
    const keyCode = e.keyCode || e.which;
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    // Inside editable inputs: do NOT block normal typing or navigation shortcuts
    if (isEditableElement(e.target)) {
      if (
        keyCode === 123 || // F12
        (isCtrlOrMeta && isShift && ['i', 'j', 'c', 'k', 'e'].includes(key)) ||
        (isCtrlOrMeta && key === 'u')
      ) {
        e.preventDefault();
        e.stopPropagation();
        emitAlert('shortcut', 'Developer shortcut disabled for security.');
        return false;
      }
      return;
    }

    // Windows Snipping Tool (Win+Shift+S) or Mac Screenshot (Cmd+Shift+3 / 4 / 5)
    if (
      (isCtrlOrMeta && isShift && ['s', '3', '4', '5'].includes(key)) ||
      (e.key === 'Meta' && isShift && key === 's')
    ) {
      e.preventDefault();
      e.stopPropagation();
      triggerScreenshotDeterrence('Screenshot shortcut detected. Screen data hidden.');
      return false;
    }

    // PrintScreen / SysReq Key detection
    if (key === 'printscreen' || keyCode === 44) {
      e.preventDefault();
      e.stopPropagation();
      triggerScreenshotDeterrence('PrintScreen captured blocked. Clipboard cleared.');
      return false;
    }

    // F12 (DevTools)
    if (keyCode === 123 || key === 'f12') {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('shortcut', 'Developer Tools shortcut (F12) is disabled.');
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K, Ctrl+Shift+E
    // Mac: Cmd+Alt+I, Cmd+Alt+J, Cmd+Alt+C
    if (
      (isCtrlOrMeta && isShift && ['i', 'j', 'c', 'k', 'e'].includes(key)) ||
      (isCtrlOrMeta && isAlt && ['i', 'j', 'c'].includes(key))
    ) {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('shortcut', 'Inspection shortcut is disabled.');
      return false;
    }

    // Ctrl+U (View Source)
    if (isCtrlOrMeta && key === 'u') {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('shortcut', 'View-Source shortcut (Ctrl+U) is disabled.');
      return false;
    }

    // Ctrl+S (Save Page)
    if (isCtrlOrMeta && key === 's') {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('shortcut', 'Save-Page shortcut (Ctrl+S) is disabled.');
      return false;
    }

    // Ctrl+P (Print Page)
    if (isCtrlOrMeta && key === 'p') {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('print', 'Printing this confidential page is restricted.');
      return false;
    }
  };

  // Keyup listener for PrintScreen release
  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key ? e.key.toLowerCase() : '';
    if (key === 'printscreen' || e.keyCode === 44) {
      triggerScreenshotDeterrence('Screen capture attempt deterred.');
    }
  };

  // 5. Prevent Dragging on Images & Media
  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.getAttribute('draggable') === 'true' && target.classList.contains('allow-drag')) {
      return;
    }
    e.preventDefault();
    return false;
  };

  // 6. Deter Copy & Cut outside form fields
  const handleCopy = (e: ClipboardEvent) => {
    if (isEditableElement(e.target)) return;
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      const parent = selection.anchorNode.parentElement;
      if (parent && (parent.closest('.allow-copy') || parent.closest('.selectable-code'))) {
        return;
      }
    }

    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', 'Confidential Academic Performance Data - CSBS LeetCode Tracker.');
    }
    emitAlert('copy', 'Copying table data directly is restricted.');
  };

  const handleCut = (e: ClipboardEvent) => {
    if (isEditableElement(e.target)) return;
    e.preventDefault();
  };

  // 7. Print Capture Event Interception
  const handleBeforePrint = () => {
    emitAlert('print', 'Printing is restricted to protect student confidentiality.');
  };

  // 8. Full-Screen Privacy Shield on Blur / Window Visibility Loss
  const handleWindowBlur = () => {
    document.body.classList.add('privacy-shield-active');
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.classList.add('window-blurred');
    }
  };

  const handleWindowFocus = () => {
    document.body.classList.remove('privacy-shield-active');
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.classList.remove('window-blurred');
    }
  };

  const handleVisibilityChange = () => {
    const rootEl = document.getElementById('root');
    if (document.hidden) {
      document.body.classList.add('privacy-shield-active');
      if (rootEl) rootEl.classList.add('window-blurred');
    } else {
      document.body.classList.remove('privacy-shield-active');
      if (rootEl) rootEl.classList.remove('window-blurred');
    }
  };

  // 9. Non-blocking DevTools opening detection
  let devToolsDetected = false;
  const checkDevTools = () => {
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;

    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devToolsDetected) {
        devToolsDetected = true;
        emitAlert('devtools', 'Developer inspection environment detected.');
      }
    } else {
      devToolsDetected = false;
    }
  };

  const probe = {
    get id() {
      if (!devToolsDetected) {
        devToolsDetected = true;
        emitAlert('devtools', 'Console inspection detected.');
      }
      return 'sec_probe';
    },
  };

  const devToolsInterval = setInterval(() => {
    checkDevTools();
    try {
      // @ts-ignore
      if (window.console && window.console.debug) {
        // @ts-ignore
        console.debug(probe);
      }
    } catch (e) {}
  }, 3000);

  // Attach event listeners with capture phase
  window.addEventListener('contextmenu', handleContextMenu, true);
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('dragstart', handleDragStart, true);
  document.addEventListener('copy', handleCopy, true);
  document.addEventListener('cut', handleCut, true);
  window.addEventListener('beforeprint', handleBeforePrint);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu, true);
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('keyup', handleKeyUp, true);
    window.removeEventListener('dragstart', handleDragStart, true);
    document.removeEventListener('copy', handleCopy, true);
    document.removeEventListener('cut', handleCut, true);
    window.removeEventListener('beforeprint', handleBeforePrint);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(devToolsInterval);
  };
}
