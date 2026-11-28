/* eslint-disable @typescript-eslint/no-explicit-any */
const ANALYTICS_ENDPOINT = '/api/track';
const ANALYTICS_BATCH_WINDOW_MS = 10 * 1000;
const ANALYTICS_MAX_QUEUE_SIZE = 80;
const ANALYTICS_SESSION_KEY = 'farol_analytics_sid_v1';

export function installFetchLaterPolyfill(): void {
  if (typeof globalThis === 'undefined' || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const g = globalThis as any;
  g.fetchLater ??= function fetchLater(url: string, init: Record<string, any> = {}) {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let activated = false;

    function sendNow() {
      if (!(init.signal && init.signal.aborted)) {
        if (
          (typeof Request !== 'undefined' && 'keepalive' in Request.prototype) ||
          init.method !== 'POST' ||
          init.headers
        ) {
          fetch(url, Object.assign({}, init, { keepalive: true })).catch(() => {});
          activated = true;
        } else if (typeof navigator?.sendBeacon === 'function') {
          activated = navigator.sendBeacon(url, init.body);
        }
      }
      destroy();
    }

    function destroy() {
      document.removeEventListener('visibilitychange', sendNow);
      clearTimeout(timeoutHandle);
    }

    if (document.visibilityState === 'hidden') {
      queueMicrotask(sendNow);
    } else {
      document.addEventListener('visibilitychange', sendNow);
      if (typeof init.activateAfter === 'number' && init.activateAfter >= 0) {
        timeoutHandle = setTimeout(sendNow, init.activateAfter);
      }
    }

    if (init.signal) {
      init.signal.addEventListener('abort', destroy);
    }

    return {
      get activated() {
        return activated;
      },
    };
  };
}

export function getAnalyticsSessionId(): string {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sid = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (!sid) {
        sid =
          typeof window.crypto?.randomUUID === 'function'
            ? window.crypto.randomUUID()
            : `sid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, sid);
      }
      return sid;
    }
  } catch {}
  return `sid-${Date.now()}`;
}

export function describeClickableTarget(el: any): string | null {
  if (!el || typeof el.getAttribute !== 'function') return null;
  if (el.id) return `#${el.id}`;
  if (el.dataset?.tab) return `tab:${el.dataset.tab}`;
  if (el.dataset?.closeModal) return `close:${el.dataset.closeModal}`;
  if (el.dataset?.gateModeBtn) return `gate:${el.dataset.gateModeBtn}`;
  if (el.dataset?.authTab) return `auth:${el.dataset.authTab}`;
  if (el.dataset?.quickCat) return `cat-chip:${el.dataset.quickCat}`;
  if (el.dataset?.editGoal) return 'edit:goal';
  if (el.dataset?.aporteGoal) return 'aporte:goal';
  if (el.dataset?.editCat) return 'edit:category';
  if (el.dataset?.editAcc) return 'edit:account';
  if (el.dataset?.editTx) return 'edit:tx';
  if (el.dataset?.segVal) return `seg:${el.dataset.segVal}`;
  const tag = (el.tagName || 'btn').toLowerCase();
  const cls =
    typeof el.className === 'string'
      ? el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
  return cls ? `${tag}.${cls}` : tag;
}

export function createAnalyticsTracker(getCurrentTab: () => string) {
  const analyticsQueue: Array<Record<string, string>> = [];
  let analyticsFetchLaterResult: { activated: boolean } | null = null;
  let analyticsFetchLaterController: AbortController | null = null;
  let analyticsTrackerBound = false;

  function trackFarolEvent(eventType: string, target: string, label = ''): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const g = globalThis as any;
    if (typeof g.fetchLater !== 'function') installFetchLaterPolyfill();
    if (typeof g.fetchLater !== 'function') return;

    if (analyticsFetchLaterResult?.activated || analyticsQueue.length >= ANALYTICS_MAX_QUEUE_SIZE) {
      analyticsFetchLaterController = null;
      analyticsFetchLaterResult = null;
      analyticsQueue.length = 0;
    }

    analyticsQueue.push({
      sessionId: getAnalyticsSessionId(),
      eventType: String(eventType || 'click').slice(0, 40),
      target: String(target || 'unknown').slice(0, 120),
      label: String(label || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      tab: String(getCurrentTab() || '').slice(0, 48),
      path: String(window.location?.pathname || '/').slice(0, 120),
    });

    if (analyticsFetchLaterController) {
      analyticsFetchLaterController.abort();
    }
    analyticsFetchLaterController = typeof AbortController === 'function' ? new AbortController() : null;

    try {
      analyticsFetchLaterResult = g.fetchLater(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(analyticsQueue),
        signal: analyticsFetchLaterController?.signal,
        activateAfter: ANALYTICS_BATCH_WINDOW_MS,
      });
    } catch {
      // Fallback silencioso caso exceda cota do navegador
    }
  }

  function initAnalyticsTracker(): void {
    if (analyticsTrackerBound || typeof document === 'undefined' || typeof document.addEventListener !== 'function') {
      return;
    }
    analyticsTrackerBound = true;
    installFetchLaterPolyfill();

    trackFarolEvent('page_view', window.location?.pathname || '/', document.title || 'Farol Finanças');

    document.addEventListener(
      'click',
      (event: MouseEvent) => {
        const clickable = (event.target as HTMLElement | null)?.closest?.(
          'button, a, [role="button"], .sidebar-footer, summary'
        );
        if (!clickable) return;
        const targetDesc = describeClickableTarget(clickable);
        if (!targetDesc) return;
        const cleanLabel = (
          clickable.getAttribute('aria-label') ||
          clickable.getAttribute('title') ||
          clickable.textContent ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 60);
        trackFarolEvent('click', targetDesc, cleanLabel);
      },
      { passive: true }
    );
  }

  return {
    trackFarolEvent,
    initAnalyticsTracker,
  };
}
