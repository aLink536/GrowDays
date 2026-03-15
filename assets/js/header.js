/**
 * header.js — wires up global header controls and seeds default data.
 * Runs on every page (loaded in default.html).
 */
(function () {
  'use strict';

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  function init() {
    // Seed default data on first visit (async, non-blocking)
    StorageAPI.seedDefaults().then(() => {
      // Dispatch event so page-specific JS can react after data is ready
      document.dispatchEvent(new CustomEvent('storage-ready'));
    });

    wireExport();
    wireImport();
    wireAddPlant();
    wireMobileMenu();
    highlightActiveNav();
  }

  function wireExport() {
    document.querySelectorAll('[data-action="export-json"]').forEach((btn) => {
      btn.addEventListener('click', () => StorageAPI.exportJSON());
    });
  }

  function wireImport() {
    // Two file inputs: desktop + mobile
    const fileInputs = [
      document.getElementById('import-file-input'),
      document.getElementById('import-file-input-mobile'),
    ].filter(Boolean);

    function handleFile(file) {
      if (!file) return;
      StorageAPI.importJSON(file)
        .then((plants) => {
          alert('Imported ' + plants.length + ' plant' + (plants.length !== 1 ? 's' : '') + ' successfully.');
          window.location.reload();
        })
        .catch((err) => {
          alert('Import failed: ' + err.message);
        })
        .finally(() => {
          fileInputs.forEach((fi) => { fi.value = ''; });
        });
    }

    fileInputs.forEach((fi) => {
      fi.addEventListener('change', () => handleFile(fi.files[0]));
    });

    document.querySelectorAll('[data-action="import-json"]').forEach((btn, i) => {
      const input = fileInputs[i] || fileInputs[0];
      btn.addEventListener('click', () => input.click());
    });
  }

  function wireAddPlant() {
    document.querySelectorAll('[data-action="open-plant-form"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('open-plant-form', { detail: { plant: null } }));
        closeMobileMenu();
      });
    });
  }

  function wireMobileMenu() {
    const toggle = document.querySelector('[data-action="toggle-mobile-menu"]');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const menu = document.getElementById('mobile-menu');
      const isOpen = !menu.classList.contains('hidden');
      if (isOpen) {
        closeMobileMenu();
      } else {
        menu.classList.remove('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.querySelector('[data-icon="hamburger"]').classList.add('hidden');
        toggle.querySelector('[data-icon="close"]').classList.remove('hidden');
      }
    });

    // Close menu when a nav link is tapped
    document.querySelectorAll('#mobile-menu [data-nav-link]').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const toggle = document.querySelector('[data-action="toggle-mobile-menu"]');
    if (!menu || !toggle) return;
    menu.classList.add('hidden');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('[data-icon="hamburger"]').classList.remove('hidden');
    toggle.querySelector('[data-icon="close"]').classList.add('hidden');
  }

  /**
   * Mark the current nav link as active based on the current pathname.
   */
  function highlightActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      const target = link.getAttribute('data-nav-link');
      // Normalise: strip trailing slash for comparison except root
      const normPath = path.replace(/\/$/, '') || '/';
      const normTarget = (link.getAttribute('href') || '').replace(/\/$/, '') || '/';
      const isActive = normPath.endsWith(normTarget) || (normTarget === '/' && (normPath === '' || normPath.endsWith('/seed-cal')));
      if (isActive) {
        link.style.color = 'var(--color-primary)';
        link.style.fontWeight = '600';
        link.style.backgroundColor = 'rgba(74,124,89,0.08)';
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
