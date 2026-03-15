/**
 * calendar.js — populates the calendar grid with active plants.
 *
 * Constraints:
 *  - Never writes HTML markup.
 *  - Clones the #plant-row-tpl template, sets data attributes, appends to grid.
 *  - Delegates milestone colouring to PlantCard.initCard().
 */
(function () {
  'use strict';

  const SITE_BASE = (function () {
    const base = document.querySelector('base');
    if (base) return base.href.replace(/\/$/, '');
    return window.location.pathname.startsWith('/seed-cal') ? '/seed-cal' : '';
  })();

  function init() {
    const grid    = document.getElementById('calendar-grid');
    const tpl     = document.getElementById('plant-row-tpl');
    const emptyEl = document.getElementById('calendar-empty');
    const subtitle = document.getElementById('calendar-subtitle');

    if (!grid || !tpl) return;

    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Highlight month header column
    highlightCurrentMonthHeaders(currentMonth);

    function render() {
      const plants = StorageAPI.getAll().filter(p => p.active);

      // Clear existing rows (keep the empty message initially)
      grid.querySelectorAll('[data-component="plant-card"]').forEach(el => el.remove());

      if (plants.length === 0) {
        if (emptyEl) {
          emptyEl.removeAttribute('hidden');
          emptyEl.textContent = 'No active plants. Add some plants in the Library.';
        }
        if (subtitle) subtitle.textContent = 'No active plants';
        return;
      }

      if (emptyEl) emptyEl.setAttribute('hidden', '');
      if (subtitle) subtitle.textContent = 'Showing ' + plants.length + ' active plant' + (plants.length !== 1 ? 's' : '');

      plants.forEach((plant) => {
        const clone = tpl.content.cloneNode(true);
        const row = clone.querySelector('[data-component="plant-card"]');

        // Set data attributes used by PlantCard
        row.setAttribute('data-plant-id', plant.id);
        row.setAttribute('data-plant', JSON.stringify(plant));

        // Fill name and variety text via data-tpl attributes (no innerHTML)
        const nameEl = row.querySelector('[data-tpl-plant-name]');
        if (nameEl) nameEl.textContent = plant.name;

        const varietyEl = row.querySelector('[data-tpl-plant-variety]');
        if (varietyEl) varietyEl.textContent = plant.variety || '';

        const linkEl = row.querySelector('[data-tpl-plant-link]');
        if (linkEl) linkEl.setAttribute('href', SITE_BASE + '/plant/?id=' + plant.id);

        // Highlight current month cells
        for (let m = 1; m <= 12; m++) {
          const cell = row.querySelector('[data-month="' + m + '"]');
          if (cell && m === currentMonth) {
            cell.classList.add('cell--current-month');
          }
        }

        grid.appendChild(clone);

        // Initialise milestone colours on the newly appended row
        const appended = grid.lastElementChild;
        if (appended && window.PlantCard) {
          window.PlantCard.initCard(appended);
        }
      });
    }

    // Initial render (data may already be available or will be seeded)
    render();

    // Re-render when plant data changes
    document.addEventListener('plant-saved', render);
    document.addEventListener('storage-ready', render);

    // Milestone filter toggles
    document.querySelectorAll('[data-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.toggle('active');
        const hidden = new Set(
          Array.from(document.querySelectorAll('[data-toggle]:not(.active)'))
            .map(function (b) { return b.dataset.toggle; })
        );
        if (window.PlantCard) {
          window.PlantCard.setFilter(hidden);
          window.PlantCard.initAll();
        }
      });
    });
  }

  function highlightCurrentMonthHeaders(currentMonth) {
    document.querySelectorAll('[data-month-header]').forEach((header) => {
      const m = parseInt(header.getAttribute('data-month-header'), 10);
      if (m === currentMonth) {
        header.style.color = 'var(--color-primary)';
        header.style.fontWeight = '700';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
