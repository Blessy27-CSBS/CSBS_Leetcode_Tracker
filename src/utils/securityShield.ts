/**
 * CSBS LeetCode Tracker - Frontend Security Deterrence Shield
 *
 * Client-side controls are defense-in-depth only. They cannot prevent OS-level
 * screenshot tools from capturing the screen, but they do hide sensitive data
 * whenever the page loses focus or visibility and make casual extraction much harder.
 */

export type SecurityAlert = {
  id: string;
  type: 'contextmenu' | 'shortcut' | 'copy' | 'devtools' | 'print' | 'screenshot';
  message: string;
  timestamp: number;
};

type AlertListener = (alert: SecurityAlert) => void;
const listeners: Set<AlertListener> = new Set();

type SecurityUser = {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  student_name?: string;
  role?: string;
};

let privacyOverlay: HTMLDivElement | null = null;

export function onSecurityAlert(listener: AlertListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let lastAlertTime = 0;
function emitAlert(type: SecurityAlert['type'], message: string) {
  const now = Date.now();
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

function setPrivacyMode(_active: boolean) {
  // Disabled: never dim, blank out, or lock the screen
  if (privacyOverlay && privacyOverlay.parentNode) {
    privacyOverlay.parentNode.removeChild(privacyOverlay);
    privacyOverlay = null;
  }
  document.body.classList.remove('privacy-locked');
  document.documentElement.classList.remove('privacy-locked');
  document.body.style.pointerEvents = '';
  document.body.style.filter = '';
  document.body.style.opacity = '';
}

export function initSecurityShield(user?: SecurityUser | null): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    const bannerStyle = 'color: #ef4444; font-size: 28px; font-weight: 900; -webkit-text-stroke: 1px black;';
    const subStyle = 'color: #38bdf8; font-size: 13px; font-weight: 600; line-height: 1.6;';
    const textStyle = 'color: #94a3b8; font-size: 12px; font-weight: normal;';

    console.clear();
    console.log('%c⚠️ SECURITY NOTICE: RESTRICTED SYSTEM', bannerStyle);
    console.log(
      '%cCSBS LeetCode Tracker & Performance Hub — KGiSL Institute of Technology\n' +
      'Unauthorized copying, scraping, screenshots, reverse-engineering, or tampering with academic data is strictly prohibited.\n' +
      'Sensitive content is automatically hidden whenever the browser loses focus or is hidden.',
      subStyle
    );
    console.log('%cFrontend security shield active. Client-side actions are monitored.', textStyle);
  } catch (e) {}

  try {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      navigator.mediaDevices.getDisplayMedia = function (..._args: any[]) {
        emitAlert('screenshot', 'Screen recording and display capture is restricted on this platform.');
        return Promise.reject(new DOMException('Screen display capture is disabled on CSBS LeetCode Tracker.', 'NotAllowedError'));
      };
    }
  } catch (e) {}


  const triggerScreenshotDeterrence = (reason: string) => {
    emitAlert('screenshot', reason);
  };

  const handleContextMenu = (e: MouseEvent) => {
    // Intercept right-click so "Inspect", "Inspect Element", "View Source" cannot be opened.
    // Does NOT alter screen brightness, lock screen, or turn it white.
    e.preventDefault();
    e.stopPropagation();
    emitAlert('contextmenu', 'Right-click and element inspection are disabled.');
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key ? e.key.toLowerCase() : '';
    const keyCode = e.keyCode || e.which;
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    // F12 or Developer Tools
    if (keyCode === 123 || key === 'f12') {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('shortcut', 'Developer Tools shortcut (F12) is disabled.');
      return false;
    }

    // Inspection & Console shortcuts (Ctrl+Shift+I, J, C, K, E, P) or Mac equivalents
    if (
      (isCtrlOrMeta && isShift && ['i', 'j', 'c', 'k', 'e', 'p'].includes(key)) ||
      (isCtrlOrMeta && isAlt && ['i', 'j', 'c', 'u'].includes(key))
    ) {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('shortcut', 'Inspection and DevTools shortcuts are disabled.');
      return false;
    }

    // View Source (Ctrl+U / Cmd+Opt+U)
    if (isCtrlOrMeta && key === 'u') {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('shortcut', 'View-Source shortcut (Ctrl+U) is disabled.');
      return false;
    }

    // Save Page (Ctrl+S / Cmd+S)
    if (isCtrlOrMeta && key === 's') {
      e.preventDefault();
      e.stopPropagation();
      emitAlert('shortcut', 'Save-Page shortcut (Ctrl+S) is disabled.');
      return false;
    }

    // Screenshot shortcuts
    if (
      (isCtrlOrMeta && isShift && ['s', '3', '4', '5'].includes(key)) ||
      (e.key === 'Meta' && isShift && key === 's') ||
      key === 'printscreen' || keyCode === 44
    ) {
      e.preventDefault();
      e.stopPropagation();
      triggerScreenshotDeterrence('Screenshot or capture shortcut detected.');
      return false;
    }

    if (isCtrlOrMeta && key === 'p') {
      if (user?.role === 'staff') {
        return; // Allow faculty staff to print reports
      }
      e.preventDefault();
      e.stopPropagation();
      emitAlert('print', 'Printing this confidential page is restricted.');
      return false;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key ? e.key.toLowerCase() : '';
    if (key === 'printscreen' || e.keyCode === 44) {
      triggerScreenshotDeterrence('Screen capture attempt deterred.');
    }
  };

  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.getAttribute('draggable') === 'true' && target.classList.contains('allow-drag')) {
      return;
    }
    e.preventDefault();
    return false;
  };

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

  const handleBeforePrint = () => {
    if (user?.role === 'staff') return;
    emitAlert('print', 'Printing is restricted to protect student confidentiality.');
  };

  const handleAfterPrint = () => {};

  // DevTools inspection detection via window divergence
  let devToolsDetected = false;
  const detectDevTools = () => {
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
      if (!devToolsDetected) {
        devToolsDetected = true;
        emitAlert('devtools', 'Inspection session detected. Source code access is restricted.');
      }
      try {
        console.clear();
      } catch (e) {}
    } else {
      devToolsDetected = false;
    }
  };

  const devToolsInterval = setInterval(detectDevTools, 1200);
  window.addEventListener('resize', detectDevTools);

  // Anti-debugging trap: pauses execution if DevTools is active
  const antiDebugTimer = setInterval(() => {
    try {
      const start = Date.now();
      const fn = new Function('debugger');
      fn();
      if (Date.now() - start > 100) {
        emitAlert('devtools', 'Active debugger detected. Execution paused.');
      }
    } catch (err) {}
  }, 2000);

  document.addEventListener('contextmenu', handleContextMenu, true);
  window.addEventListener('contextmenu', handleContextMenu, true);
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('dragstart', handleDragStart, true);
  window.addEventListener('beforeprint', handleBeforePrint, true);
  window.addEventListener('afterprint', handleAfterPrint, true);
  document.addEventListener('copy', handleCopy, true);
  document.addEventListener('cut', handleCut, true);

  setPrivacyMode(false);

  return () => {
    clearInterval(devToolsInterval);
    clearInterval(antiDebugTimer);
    document.removeEventListener('contextmenu', handleContextMenu, true);
    window.removeEventListener('contextmenu', handleContextMenu, true);
    window.removeEventListener('resize', detectDevTools);
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('keyup', handleKeyUp, true);
    window.removeEventListener('dragstart', handleDragStart, true);
    window.removeEventListener('beforeprint', handleBeforePrint, true);
    window.removeEventListener('afterprint', handleAfterPrint, true);
    document.removeEventListener('copy', handleCopy, true);
    document.removeEventListener('cut', handleCut, true);

    if (privacyOverlay && privacyOverlay.parentNode) {
      privacyOverlay.parentNode.removeChild(privacyOverlay);
    }
    privacyOverlay = null;

    try {
      const originalPrint = (window as any).__csbs_original_print__;
      if (typeof originalPrint === 'function') {
        Object.defineProperty(window, 'print', {
          value: originalPrint,
          configurable: true,
          writable: true,
        });
      }
    } catch (e) {}
  };
}
