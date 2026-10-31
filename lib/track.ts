export type TrackEvent = {
  t: 'pageview' | 'click' | 'chat';
  p: string;
  c?: string;
  i?: string;
  z?: string;
  l?: string;
  r?: string;
  cp?: string;
  e?: 1;
};

const ENDPOINT = '/api/collect';

export function trackingAllowed(): boolean {
  try {
    if (window.localStorage.getItem('ts_ignore') === '1') return false;
  } catch {
    // Storage can be blocked; counting still works without it.
  }
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack !== '1' && !nav.globalPrivacyControl;
}

export function track(event: TrackEvent): void {
  if (typeof window === 'undefined' || !trackingAllowed()) return;
  const body = JSON.stringify(event);
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
  } catch {
    // Fall through to fetch.
  }
  fetch(ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
}
