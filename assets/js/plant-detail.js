/**
 * plant-detail.js — populates the plant detail view from URL ?id= parameter.
 *
 * Constraints:
 *  - Never writes HTML markup.
 *  - Sets textContent, setAttribute, classList only.
 */
(function () {
  'use strict';

  const MONTH_NAMES = [
    '', // 0 unused
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];

  const MILESTONE_META = {
    sow_indoors:   { label: 'Sow indoors',  colour: 'var(--color-sow-indoors)',  cls: 'cell--sow-indoors'  },
    direct_sow:    { label: 'Direct sow',   colour: 'var(--color-direct-sow)',   cls: 'cell--direct-sow'   },
    transplant:    { label: 'Transplant',   colour: 'var(--color-transplant)',   cls: 'cell--transplant'   },
    flowering:     { label: 'Flowering',    colour: 'var(--color-flowering)',    cls: 'cell--flowering'    },
    fruiting:      { label: 'Fruiting',     colour: 'var(--color-fruiting)',     cls: 'cell--fruiting'     },
    harvest_start: { label: 'Harvest start',colour: 'var(--color-harvest-start)',cls: 'cell--harvest'      },
    harvest_end:   { label: 'Harvest end',  colour: 'var(--color-harvest-end)',  cls: 'cell--harvest'      },
  };

  const TAG_COLOURS = [
    { bg: '#e8f5e9', fg: '#2e7d32' },
    { bg: '#e3f2fd', fg: '#1565c0' },
    { bg: '#fce4ec', fg: '#880e4f' },
    { bg: '#fff8e1', fg: '#f57f17' },
    { bg: '#f3e5f5', fg: '#6a1b9a' },
    { bg: '#e0f7fa', fg: '#006064' },
  ];

  function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      showNotFound('No plant ID specified in URL.');
      return;
    }

    function tryRender() {
      const plant = StorageAPI.getById(id);
      if (!plant) {
        showNotFound('Plant "' + id + '" not found in your library.');
        return;
      }
      render(plant);
    }

    tryRender();
    document.addEventListener('storage-ready', tryRender);
    document.addEventListener('plant-saved', (e) => {
      if (e.detail && e.detail.plant && e.detail.plant.id === id) tryRender();
    });
  }

  function render(plant) {
    const container = document.querySelector('[data-component="plant-detail"]');
    if (!container) return;
    container.setAttribute('data-plant-id', plant.id);

    // Simple text fields
    setField(container, 'name',              plant.name || '—');
    setField(container, 'variety',           plant.variety || '—');
    setField(container, 'notes',             plant.notes || '—');
    setField(container, 'sun',               plant.sun || '—');
    setField(container, 'lifecycle',         plant.lifecycle || '—');
    setField(container, 'spacing_cm',        plant.spacing_cm != null ? plant.spacing_cm + ' cm' : '—');
    setField(container, 'sowing_depth_mm',   plant.sowing_depth_mm != null ? plant.sowing_depth_mm + ' mm' : '—');
    setField(container, 'days_to_germinate', plant.days_to_germinate != null ? plant.days_to_germinate + ' days' : '—');
    setField(container, 'frost_hardy',       plant.frost_hardy ? 'Yes' : 'No');
    setField(container, 'supplier',          plant.supplier || '—');
    setField(container, 'colour',            plant.colour || '—');
    setField(container, 'active',            plant.active ? 'Active' : 'Inactive');

    // Tags
    const tagsContainer = container.querySelector('[data-field="tags-container"]');
    if (tagsContainer) {
      // Clear existing badges
      while (tagsContainer.firstChild) tagsContainer.removeChild(tagsContainer.firstChild);
      (plant.tags || []).forEach((tag, i) => {
        const badge = document.createElement('span');
        const colour = TAG_COLOURS[i % TAG_COLOURS.length];
        badge.textContent = tag;
        badge.style.backgroundColor = colour.bg;
        badge.style.color = colour.fg;
        badge.style.fontSize = '0.75rem';
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '9999px';
        badge.style.fontWeight = '500';
        tagsContainer.appendChild(badge);
      });
    }

    // Update page title
    document.title = plant.name + (plant.variety ? ' — ' + plant.variety : '') + ' — Seed Calendar';

    // Milestone bar
    renderMilestoneBar(container, plant);

    // Edit button
    const editBtn = container.querySelector('[data-action="edit-plant"]');
    if (editBtn) {
      // Remove old listener by replacing the element node (no innerHTML — we clone with DOM)
      const newBtn = editBtn.cloneNode(true);
      editBtn.parentNode.replaceChild(newBtn, editBtn);
      newBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('open-plant-form', { detail: { plant } }));
      });
    }
  }

  function setField(container, fieldName, value) {
    const el = container.querySelector('[data-field="' + fieldName + '"]');
    if (el) el.textContent = value;
  }

  function renderMilestoneBar(container, plant) {
    const bar    = document.getElementById('detail-milestone-bar');
    const legend = document.getElementById('detail-milestone-legend');
    if (!bar) return;

    // Clear bar
    while (bar.firstChild) bar.removeChild(bar.firstChild);

    const ms = plant.milestones || {};

    // Build month->class map (same logic as plant-card.js)
    const monthClass  = {};
    const monthTitles = {};

    const singleKeys = ['sow_indoors', 'direct_sow', 'transplant', 'flowering', 'fruiting'];
    singleKeys.forEach((key) => {
      const month = ms[key];
      if (!month) return;
      const meta = MILESTONE_META[key];
      monthClass[month]  = meta.cls;
      monthTitles[month] = (monthTitles[month] || []).concat(meta.label);
    });

    const hs = ms.harvest_start;
    const he = ms.harvest_end;
    if (hs) {
      const end = he || hs;
      for (let m = hs; m <= end; m++) {
        monthClass[m]  = 'cell--harvest';
        monthTitles[m] = (monthTitles[m] || []).concat('Harvest');
      }
    }

    // Month header row
    const headerCell = document.createElement('div');
    headerCell.className = 'calendar-cell flex items-center px-2 py-1 text-xs font-semibold';
    headerCell.style.color = 'var(--color-muted)';
    headerCell.textContent = plant.name;
    bar.appendChild(headerCell);

    for (let m = 1; m <= 12; m++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      cell.setAttribute('data-month', m);
      if (monthClass[m]) cell.classList.add(monthClass[m]);
      if (monthTitles[m]) cell.setAttribute('title', monthTitles[m].join(', ') + ' (' + MONTH_NAMES[m] + ')');
      bar.appendChild(cell);
    }

    // Legend chips
    if (legend) {
      while (legend.firstChild) legend.removeChild(legend.firstChild);
      const seen = new Set();
      for (let m = 1; m <= 12; m++) {
        if (monthClass[m] && monthTitles[m]) {
          monthTitles[m].forEach((label) => {
            if (seen.has(label)) return;
            seen.add(label);
            const chip = document.createElement('span');
            chip.className = 'milestone-chip';
            chip.textContent = label;
            // Find colour from meta
            const meta = Object.values(MILESTONE_META).find(mt => mt.label === label);
            if (meta) chip.style.backgroundColor = meta.colour;
            legend.appendChild(chip);
          });
        }
      }
    }
  }

  function showNotFound(message) {
    const container = document.querySelector('[data-component="plant-detail"]');
    if (!container) return;
    // Clear all data-field elements
    container.querySelectorAll('[data-field]').forEach((el) => {
      el.textContent = '';
    });
    const nameEl = container.querySelector('[data-field="name"]');
    if (nameEl) nameEl.textContent = 'Plant not found';
    const notesEl = container.querySelector('[data-field="notes"]');
    if (notesEl) notesEl.textContent = message;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
