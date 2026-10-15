/*! MyCryptoSignal first-party analytics — no cookies, no cross-site tracking.
 *  Endpoint injected at build time as window.__MCS_ANALYTICS__. */
(function () {
  'use strict';
  var cfg = window.__MCS_ANALYTICS__;
  if (!cfg || !cfg.endpoint) return;

  // Respect Do Not Track + Global Privacy Control: send NOTHING when either is set.
  try {
    var d = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (d === '1' || d === 'yes') return;
  } catch (e) {}
  try { if (navigator.globalPrivacyControl === true) return; } catch (e) {}

  // Session id lives ONLY in sessionStorage (tab-scoped, cleared when the tab
  // closes): not a cookie, not localStorage, never shared. A random opaque string
  // used only to group pageviews into one visit's session; no personal data.
  function sid() {
    try {
      var k = 'mcs-sid', v = sessionStorage.getItem(k);
      if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(k, v); }
      return v;
    } catch (e) { return ''; }
  }

  // Only the site's own allowlisted ?from= tag; no other query data.
  function tag() {
    try {
      var f = new URLSearchParams(location.search).get('from');
      if (f && /^[A-Za-z0-9_-]{1,32}$/.test(f)) return f;
    } catch (e) {}
    return '';
  }

  var w = window.innerWidth || 0; // coarse width bucket, never exact pixels
  var body = JSON.stringify({
    p: location.pathname, // path only, no query
    r: document.referrer || '', // host extracted server-side
    w: w < 480 ? 'xs' : w < 768 ? 'sm' : w < 1024 ? 'md' : w < 1440 ? 'lg' : 'xl',
    c: tag(), s: sid(),
  });

  try {
    // text/plain → a CORS "simple request" (no preflight).
    if (navigator.sendBeacon && navigator.sendBeacon(cfg.endpoint, new Blob([body], { type: 'text/plain' }))) return;
  } catch (e) {}
  try {
    fetch(cfg.endpoint, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true, mode: 'no-cors', credentials: 'omit' });
  } catch (e) {}
})();
