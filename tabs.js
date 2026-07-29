// =============================================================
// Dashboard bottom tab bar — Home / Stack / Gym / Water
// Include after topbar.js on index.html:
//   <script src="tabs.js" defer></script>
// =============================================================
(function () {
  'use strict';

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
    stack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    nutrition: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',

  };

  const TABS = [
    { id: 'home', label: 'Home', panelId: 'tab-panel-home' },
    { id: 'stack', label: 'Health', panelId: 'tab-panel-stack', iframeSrc: 'stack.html?embed=1' },
    { id: 'nutrition', label: 'Nutrition', panelId: 'tab-panel-nutrition', iframeSrc: 'nutrition.html?embed=1' },

  ];

  let activeTab = 'home';

  function injectTabbar() {
    if (document.getElementById('dashTabbar')) return;

    const nav = document.createElement('nav');
    nav.className = 'tabbar';
    nav.id = 'dashTabbar';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Dashboard sections');

    const inner = document.createElement('div');
    inner.className = 'tabbar-inner';
    inner.innerHTML = TABS.map((t) =>
      '<button type="button" class="tab" data-tab="' + t.id + '" role="tab" aria-selected="false">'
      + '<span class="tab-icon">' + ICONS[t.id] + '</span>'
      + '<span>' + t.label + '</span>'
      + '</button>'
    ).join('');

    nav.appendChild(inner);
    document.body.appendChild(nav);

    inner.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => showTab(btn.dataset.tab));
    });
  }

  function ensureIframe(tab) {
    const panel = document.getElementById(tab.panelId);
    if (!panel || !tab.iframeSrc) return;
    let iframe = panel.querySelector('iframe.tab-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'tab-iframe';
      iframe.title = tab.label;
      iframe.src = tab.iframeSrc;
      iframe.loading = 'lazy';
      panel.appendChild(iframe);
    }
  }

  function showTab(id) {
    const tab = TABS.find((t) => t.id === id);
    if (!tab) return;

    activeTab = id;

    TABS.forEach((t) => {
      const panel = document.getElementById(t.panelId);
      if (!panel) return;
      const on = t.id === id;
      panel.classList.toggle('is-active', on);
      panel.hidden = !on;
      if (on && t.iframeSrc) ensureIframe(t);
    });

    const bar = document.getElementById('dashTabbar');
    if (bar) {
      bar.querySelectorAll('.tab').forEach((btn) => {
        const on = btn.dataset.tab === id;
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.setAttribute('aria-current', on ? 'page' : null);
      });
    }

    document.body.dataset.activeTab = id;

    try {
      history.replaceState(null, '', '#' + id);
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('dash-tab-change', { detail: { tab: id } }));
  }

  function tabFromHash() {
    const h = (location.hash || '').replace(/^#/, '');
    return TABS.some((t) => t.id === h) ? h : 'home';
  }

  function boot() {
    injectTabbar();
    showTab(tabFromHash());
    window.addEventListener('hashchange', () => showTab(tabFromHash()));
  }

  window.DashTabs = { show: showTab, active: () => activeTab };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
