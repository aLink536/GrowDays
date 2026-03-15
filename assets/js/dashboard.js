/**
 * dashboard.js — populates the dashboard with upcoming milestones and active plant cards.
 *
 * Constraints:
 *  - Never writes HTML markup.
 *  - Clones templates, sets textContent/setAttribute/classList only.
 */
(function () {
  'use strict';

  const MONTH_NAMES = [
    '', // 0 unused
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const SITE_BASE = (function () {
    const base = document.querySelector('base');
    if (base) return base.href.replace(/\/$/, '');
    return window.location.pathname.startsWith('/seed-cal') ? '/seed-cal' : '';
  })();

  /**
   * Milestone display config: label, CSS variable colour name, chip background colour.
   */
  const MILESTONE_META = {
    sow_indoors:   { label: 'Sow indoors',  colour: 'var(--color-sow-indoors)'  },
    direct_sow:    { label: 'Direct sow',   colour: 'var(--color-direct-sow)'   },
    transplant:    { label: 'Transplant',   colour: 'var(--color-transplant)'   },
    flowering:     { label: 'Flowering',    colour: 'var(--color-flowering)'    },
    fruiting:      { label: 'Fruiting',     colour: 'var(--color-fruiting)'     },
    harvest_start: { label: 'Harvest start',colour: 'var(--color-harvest-start)'},
    harvest_end:   { label: 'Harvest end',  colour: 'var(--color-harvest-end)'  },
  };

  const TAG_COLOURS = [
    { bg: '#e8f5e9', fg: '#2e7d32' },
    { bg: '#e3f2fd', fg: '#1565c0' },
    { bg: '#fce4ec', fg: '#880e4f' },
    { bg: '#fff8e1', fg: '#f57f17' },
    { bg: '#f3e5f5', fg: '#6a1b9a' },
  ];

  function init() {
    render();
    document.addEventListener('plant-saved',    render);
    document.addEventListener('storage-ready',  render);
  }

  function render() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Update month label
    const monthLabel = document.getElementById('dashboard-month-label');
    if (monthLabel) {
      monthLabel.textContent = MONTH_NAMES[currentMonth] + ' ' + now.getFullYear();
    }

    const plants = StorageAPI.getAll();
    const activePlants = plants.filter(p => p.active);

    // Active count
    const countEl = document.getElementById('active-plant-count');
    if (countEl) countEl.textContent = activePlants.length;

    renderUpcomingMilestones(activePlants, currentMonth);
    renderActivePlants(activePlants);
  }

  function renderUpcomingMilestones(plants, currentMonth) {
    const container = document.getElementById('upcoming-milestones');
    const tpl = document.getElementById('milestone-card-tpl');
    const emptyEl = document.getElementById('milestones-empty');
    if (!container || !tpl) return;

    // Remove existing milestone cards
    container.querySelectorAll('[data-milestone-card]').forEach(el => el.remove());

    // Gather milestones for current month + next 2 months
    const upcoming = [];
    const lookahead = 3;

    plants.forEach((plant) => {
      const ms = plant.milestones || {};
      Object.entries(ms).forEach(([key, val]) => {
        if (!val) return;
        const meta = MILESTONE_META[key];
        if (!meta) return;

        // Check if milestone falls within current month + lookahead
        for (let offset = 0; offset < lookahead; offset++) {
          let month = ((currentMonth - 1 + offset) % 12) + 1;
          if (val === month) {
            upcoming.push({
              plantName: plant.name,
              plantId:   plant.id,
              key,
              month,
              offset,
              meta,
            });
          }
        }
      });
    });

    // Sort by month offset, then plant name
    upcoming.sort((a, b) => a.offset - b.offset || a.plantName.localeCompare(b.plantName));

    if (upcoming.length === 0) {
      if (emptyEl) {
        emptyEl.removeAttribute('hidden');
        emptyEl.textContent = 'No milestones in the next 3 months.';
      }
      return;
    }

    if (emptyEl) emptyEl.setAttribute('hidden', '');

    upcoming.forEach((item) => {
      const clone = tpl.content.cloneNode(true);
      const card  = clone.querySelector('[data-milestone-card]') || clone.firstElementChild;

      // Mark for later cleanup
      card.setAttribute('data-milestone-card', '');

      // Chip
      const chip = card.querySelector('[data-tpl-chip]');
      if (chip) {
        chip.textContent = item.meta.label;
        chip.style.backgroundColor = item.meta.colour;
      }

      // Plant name
      const nameEl = card.querySelector('[data-tpl-plant-name]');
      if (nameEl) nameEl.textContent = item.plantName;

      // Month label
      const monthEl = card.querySelector('[data-tpl-month-label]');
      if (monthEl) {
        const prefix = item.offset === 0 ? 'This month — ' : (item.offset === 1 ? 'Next month — ' : 'In 2 months — ');
        monthEl.textContent = prefix + MONTH_NAMES[item.month];
      }

      // Link the card to plant detail
      const linkTarget = card.querySelector('a, [data-tpl-plant-link]') || card;
      if (card.tagName === 'A' || card.href !== undefined) {
        card.setAttribute('href', SITE_BASE + '/plant/?id=' + item.plantId);
      }

      container.appendChild(clone);
    });
  }

  function renderActivePlants(plants) {
    const container = document.getElementById('active-plant-list');
    const tpl = document.getElementById('active-plant-card-tpl');
    if (!container || !tpl) return;

    // Clear existing cards
    container.querySelectorAll('[data-plant-card]').forEach(el => el.remove());

    if (plants.length === 0) {
      const msg = document.createElement('p');
      msg.textContent = 'No active plants. Visit the Library to activate some.';
      msg.className = 'text-sm col-span-full';
      msg.style.color = 'var(--color-muted)';
      msg.setAttribute('data-plant-card', '');
      container.appendChild(msg);
      return;
    }

    plants.forEach((plant) => {
      const clone = tpl.content.cloneNode(true);
      const card  = clone.firstElementChild;
      card.setAttribute('data-plant-card', '');

      // Link
      card.setAttribute('href', SITE_BASE + '/plant/?id=' + plant.id);

      const nameEl = card.querySelector('[data-tpl-name]');
      if (nameEl) nameEl.textContent = plant.name;

      const varietyEl = card.querySelector('[data-tpl-variety]');
      if (varietyEl) varietyEl.textContent = plant.variety || '';

      const tagsEl = card.querySelector('[data-tpl-tags]');
      if (tagsEl && Array.isArray(plant.tags)) {
        plant.tags.forEach((tag, i) => {
          const badge = document.createElement('span');
          const colour = TAG_COLOURS[i % TAG_COLOURS.length];
          badge.textContent = tag;
          badge.style.backgroundColor = colour.bg;
          badge.style.color = colour.fg;
          badge.style.fontSize = '0.7rem';
          badge.style.padding = '1px 6px';
          badge.style.borderRadius = '9999px';
          badge.style.fontWeight = '500';
          tagsEl.appendChild(badge);
        });
      }

      container.appendChild(clone);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
