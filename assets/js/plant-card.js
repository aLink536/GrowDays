/**
 * plant-card.js — reads data-plant JSON on each [data-component="plant-card"]
 * element and colours the corresponding month cells based on milestones.
 *
 * Constraints:
 *  - Never writes HTML markup.
 *  - Only sets classList, setAttribute, and title on existing DOM elements.
 */
(function () {
  'use strict';

  const MONTH_NAMES = [
    '', // 0 unused
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  /**
   * Milestone config: maps milestone key -> CSS class suffix and readable label.
   * Order matters when multiple milestones share a month (last one wins for colour,
   * but title accumulates all).
   */
  const MILESTONE_CONFIG = {
    sow_indoors:   { cls: 'cell--sow-indoors',  label: 'Sow indoors' },
    direct_sow:    { cls: 'cell--direct-sow',   label: 'Direct sow'  },
    transplant:    { cls: 'cell--transplant',    label: 'Transplant'  },
    flowering:     { cls: 'cell--flowering',     label: 'Flowering'   },
    fruiting:      { cls: 'cell--fruiting',      label: 'Fruiting'    },
    harvest_start: { cls: 'cell--harvest',       label: 'Harvest'     },
  };

  /**
   * Initialise all plant-card elements in the given root (default: document).
   * Called by calendar.js after cloning templates, and directly on page load.
   */
  function initAll(root) {
    const cards = (root || document).querySelectorAll('[data-component="plant-card"]');
    cards.forEach(initCard);
  }

  function initCard(card) {
    const raw = card.getAttribute('data-plant');
    if (!raw) return;

    let plant;
    try {
      plant = JSON.parse(raw);
    } catch {
      console.warn('[plant-card] Invalid JSON on card', card);
      return;
    }

    const ms = plant.milestones || {};

    // Build a map: month number -> array of milestone labels for tooltip
    const monthLabels = {};
    // Build a map: month number -> CSS class (last write wins for colour)
    const monthClass  = {};

    // Single-month milestones (all except harvest range)
    const singleKeys = ['sow_indoors', 'direct_sow', 'transplant', 'flowering', 'fruiting'];
    singleKeys.forEach((key) => {
      const month = ms[key];
      if (!month) return;
      const cfg = MILESTONE_CONFIG[key];
      if (!monthLabels[month]) monthLabels[month] = [];
      monthLabels[month].push(cfg.label);
      monthClass[month] = cfg.cls;
    });

    // Harvest range: fill every month from harvest_start to harvest_end
    const hs = ms.harvest_start;
    const he = ms.harvest_end;
    if (hs) {
      const end = he || hs;
      for (let m = hs; m <= end; m++) {
        if (!monthLabels[m]) monthLabels[m] = [];
        monthLabels[m].push('Harvest');
        monthClass[m] = 'cell--harvest';
      }
    }

    // Apply classes and titles to month cells within this card
    for (let m = 1; m <= 12; m++) {
      const cell = card.querySelector('[data-month="' + m + '"]');
      if (!cell) continue;

      if (monthClass[m]) {
        cell.classList.add(monthClass[m]);
      }

      if (monthLabels[m] && monthLabels[m].length) {
        cell.setAttribute('title', plant.name + ' — ' + monthLabels[m].join(', ') + ' (' + MONTH_NAMES[m] + ')');
        cell.setAttribute('aria-label', plant.name + ' ' + monthLabels[m].join(', ') + ' in ' + MONTH_NAMES[m]);
      }
    }
  }

  // Expose for use by calendar.js
  window.PlantCard = { initAll, initCard };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }
})();
