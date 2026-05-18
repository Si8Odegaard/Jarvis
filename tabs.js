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
    gym: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 4v16M18 4v16M6 12h12M9 7h6M9 17h6"/></svg>',
    water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2.5c3 4.5 7 7.2 7 11a7 7 0 1 1-14 0c0-3.8 4-6.5 7-11z"/></svg>',
    weight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v18M8 8l4-4 4 4M8 16l4 4 4-4"/></svg>',
  };

  const TABS = [
    { id: 'home', label: 'Home', panelId: 'tab-panel-home' },
    { id: 'stack', label: 'Stack', panelId: 'tab-panel-stack', iframeSrc: 'stack.html?embed=1' },
    { id: 'gym', label: 'Gym', panelId: 'tab-panel-gym', iframeSrc: 'gym.html?embed=1' },
    { id: 'water', label: 'Water', panelId: 'tab-panel-water', iframeSrc: 'po-water.html?embed=1' },
    { id: 'weight', label: 'Weight', panelId: 'tab-panel-weight', iframeSrc: 'weight102.html?embed=1' },
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
