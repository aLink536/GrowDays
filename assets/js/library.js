/**
 * library.js — renders and manages the plant library list.
 *
 * Constraints:
 *  - Never writes HTML markup.
 *  - Clones #plant-list-item-tpl, sets textContent/attributes/classList only.
 */
(function () {
  'use strict';

  const SITE_BASE = (window.SITE_BASEURL || '').replace(/\/$/, '');

  const TAG_COLOURS = [
    { bg: '#e8f5e9', fg: '#2e7d32' },
    { bg: '#e3f2fd', fg: '#1565c0' },
    { bg: '#fce4ec', fg: '#880e4f' },
    { bg: '#fff8e1', fg: '#f57f17' },
    { bg: '#f3e5f5', fg: '#6a1b9a' },
    { bg: '#e0f7fa', fg: '#006064' },
  ];

  let plantListEl, tpl, searchInput, showInactiveCheckbox, countLabel;
  let currentQuery = '';
  let showInactive = false;

  function init() {
    plantListEl          = document.getElementById('plant-list');
    tpl                  = document.getElementById('plant-list-item-tpl');
    searchInput          = document.getElementById('plant-search');
    showInactiveCheckbox = document.getElementById('show-inactive');
    countLabel           = document.getElementById('plant-count-label');

    if (!plantListEl || !tpl) return;

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentQuery = searchInput.value.toLowerCase().trim();
        render();
      });
    }

    if (showInactiveCheckbox) {
      showInactiveCheckbox.addEventListener('change', () => {
        showInactive = showInactiveCheckbox.checked;
        render();
      });
    }

    const importDefaultsBtn = document.getElementById('import-defaults-btn');
    if (importDefaultsBtn) {
      importDefaultsBtn.addEventListener('click', loadDefaults);
    }

    render();

    document.addEventListener('plant-saved', render);
    document.addEventListener('storage-ready', render);
  }

  function render() {
    let plants = StorageAPI.getAll();

    if (!showInactive) {
      // Show all but dim inactive — we filter for the count badge
    }

    // Sort: active first, then alphabetically
    plants.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    // Filter by search query
    if (currentQuery) {
      plants = plants.filter((p) => {
        const haystack = [
          p.name,
          p.variety,
          ...(p.tags || []),
        ].join(' ').toLowerCase();
        return haystack.includes(currentQuery);
      });
    }

    // Clear list (remove previous items but keep any non-item children)
    plantListEl.querySelectorAll('[data-tpl-item]').forEach(el => el.remove());

    const displayPlants = showInactive ? plants : plants;
    const activeCount = StorageAPI.getAll().filter(p => p.active).length;
    if (countLabel) {
      countLabel.textContent = activeCount + ' active, ' + StorageAPI.getAll().length + ' total';
    }

    if (plants.length === 0) {
      // Show empty state by setting textContent on a placeholder
      const empty = plantListEl.querySelector('p') || document.createElement('p');
      empty.textContent = currentQuery ? 'No plants match your search.' : 'No plants yet. Click "Add Plant" to get started.';
      empty.style.color = 'var(--color-muted)';
      empty.className = 'text-sm italic py-4 text-center';
      if (!empty.parentElement) plantListEl.appendChild(empty);
      return;
    }

    // Remove empty message if present
    const emptyMsg = plantListEl.querySelector('p');
    if (emptyMsg) emptyMsg.remove();

    plants.forEach((plant) => {
      if (!showInactive && !plant.active && !currentQuery) return;

      const clone = tpl.content.cloneNode(true);
      const item  = clone.querySelector('[data-tpl-item]');

      item.setAttribute('data-plant-id', plant.id);

      // Dim inactive plants
      if (!plant.active) {
        item.style.opacity = '0.55';
      }

      // Name
      const nameEl = item.querySelector('[data-tpl-name]');
      if (nameEl) nameEl.textContent = plant.name || '—';

      // Variety
      const varietyEl = item.querySelector('[data-tpl-variety]');
      if (varietyEl) varietyEl.textContent = plant.variety || '';

      // Link to detail page
      const linkEl = item.querySelector('[data-tpl-plant-link]');
      if (linkEl) linkEl.setAttribute('href', SITE_BASE + '/plant/?id=' + plant.id);

      // Tags
      const tagsEl = item.querySelector('[data-tpl-tags]');
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

      // Active toggle
      const activeToggle = item.querySelector('[data-tpl-active-toggle]');
      const activeIndicator = item.querySelector('[data-tpl-active-indicator]');
      const activeLabel = item.querySelector('[data-tpl-active-label]');
      if (activeToggle) {
        activeToggle.checked = !!plant.active;
        if (activeIndicator) {
          if (plant.active) {
            activeIndicator.style.borderColor = 'var(--color-primary)';
            activeIndicator.style.backgroundColor = 'var(--color-primary)';
            activeIndicator.style.color = '#fff';
          } else {
            activeIndicator.style.borderColor = 'var(--color-border)';
            activeIndicator.style.backgroundColor = 'transparent';
            activeIndicator.style.color = 'transparent';
          }
        }
        if (activeLabel) {
          activeLabel.textContent = plant.active ? 'Mark inactive' : 'Mark active';
        }
        activeToggle.addEventListener('change', () => {
          plant.active = activeToggle.checked;
          StorageAPI.save(plant);
          render();
        });
      }

      // Edit button
      const editBtn = item.querySelector('[data-tpl-edit-btn]');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('open-plant-form', { detail: { plant } }));
        });
      }

      // Delete button
      const deleteBtn = item.querySelector('[data-tpl-delete-btn]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (window.confirm('Delete "' + plant.name + '"? This cannot be undone.')) {
            StorageAPI.delete(plant.id);
            render();
          }
        });
      }

      plantListEl.appendChild(clone);
    });
  }

  async function loadDefaults() {
    if (!window.confirm('This will replace all your current plants with the default set. Continue?')) return;
    localStorage.removeItem(StorageAPI.STORAGE_KEY);
    await StorageAPI.seedDefaults();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
