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
    gym: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 4v16M18 4v16M6 12h12M9 7h6M9 17h6"/></svg>',
    soccer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/><path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10"/><path d="M2 12h20"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/><line x1="19.1" y1="4.9" x2="4.9" y2="19.1"/></svg>',
    body: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="5" r="2"/><path d="M12 7v5"/><path d="M9 10l3 3 3-3"/><path d="M12 12v7"/><path d="M9 16l3-3 3 3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>',
  };

  const TABS = [
    { id: 'home', label: 'Home', panelId: 'tab-panel-home' },
    { id: 'stack', label: 'Health', panelId: 'tab-panel-stack', iframeSrc: 'stack.html?embed=1' },
    { id: 'nutrition', label: 'Nutrition', panelId: 'tab-panel-nutrition', iframeSrc: 'nutrition.html?embed=1' },
    { id: 'gym', label: 'Gym', panelId: 'tab-panel-gym', iframeSrc: 'gym.html?embed=1' },
    { id: 'soccer', label: 'Soccer', panelId: 'tab-panel-soccer', iframeSrc: 'soccer.html?embed=1' },
    { id: 'body', label: 'Body', panelId: 'tab-panel-body', iframeSrc: 'body.html?embed=1' },
    { id: 'calendar', label: 'Calendar', panelId: 'tab-panel-calendar', iframeSrc: 'calendar.html?embed=1' },
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
