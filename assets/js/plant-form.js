/**
 * plant-form.js — controller for the Add/Edit Plant dialog.
 *
 * Constraints:
 *  - Never writes HTML markup; only reads/sets data attributes, values, and textContent.
 *  - Listens for the 'open-plant-form' CustomEvent to open with optional pre-population.
 */
(function () {
  'use strict';

  const MONTH_NAMES = [
    '', // index 0 unused
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const MILESTONE_FIELDS = [
    'sow_indoors',
    'transplant',
    'direct_sow',
    'flowering',
    'fruiting',
    'harvest_start',
    'harvest_end',
  ];

  let dialog, form, titleEl;

  function init() {
    dialog  = document.getElementById('plant-form-dialog');
    form    = document.getElementById('plant-form');
    titleEl = document.getElementById('plant-form-title');

    if (!dialog || !form) return;

    // Open triggers
    document.addEventListener('open-plant-form', onOpenRequest);

    // Close buttons
    document.querySelectorAll('[data-action="close-plant-form"]').forEach((btn) => {
      btn.addEventListener('click', closeDialog);
    });

    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog();
    });

    // Form submit
    form.addEventListener('submit', onSubmit);
  }

  function onOpenRequest(e) {
    const plant = (e && e.detail && e.detail.plant) ? e.detail.plant : null;
    resetForm();
    if (plant) {
      populateForm(plant);
      titleEl.textContent = 'Edit Plant';
    } else {
      titleEl.textContent = 'Add Plant';
    }
    dialog.showModal();
  }

  function closeDialog() {
    dialog.close();
    resetForm();
  }

  function resetForm() {
    form.reset();
    // Clear the hidden id
    setField('id', '');
  }

  /** Populate form inputs from an existing plant object. */
  function populateForm(plant) {
    setField('id', plant.id || '');
    setField('name', plant.name || '');
    setField('variety', plant.variety || '');
    setField('tags', Array.isArray(plant.tags) ? plant.tags.join(', ') : (plant.tags || ''));
    setField('notes', plant.notes || '');
    setField('sun', plant.sun || 'full');
    setField('spacing_cm', plant.spacing_cm != null ? plant.spacing_cm : '');
    setField('sowing_depth_mm', plant.sowing_depth_mm != null ? plant.sowing_depth_mm : '');
    setField('days_to_germinate', plant.days_to_germinate != null ? plant.days_to_germinate : '');
    setCheckbox('frost_hardy', !!plant.frost_hardy);
    setField('lifecycle', plant.lifecycle || 'annual');
    setField('supplier', plant.supplier || '');
    setField('colour', plant.colour || '');
    setCheckbox('active', plant.active !== false);

    const ms = plant.milestones || {};
    MILESTONE_FIELDS.forEach((key) => {
      const val = ms[key];
      setField('milestone_' + key, (val != null && val !== 0) ? String(val) : '0');
    });
  }

  function setField(name, value) {
    const el = form.elements[name];
    if (el) el.value = value;
  }

  function setCheckbox(name, checked) {
    const el = form.elements[name];
    if (el) el.checked = checked;
  }

  function onSubmit(e) {
    e.preventDefault();

    const data = new FormData(form);

    // Validate name
    const name = (data.get('name') || '').trim();
    if (!name) {
      form.elements['name'].focus();
      return;
    }

    // Build milestones object
    const milestones = {};
    MILESTONE_FIELDS.forEach((key) => {
      const raw = data.get('milestone_' + key);
      const num = parseInt(raw, 10);
      milestones[key] = (num && num > 0) ? num : null;
    });

    // Parse tags
    const tagsRaw = (data.get('tags') || '').trim();
    const tags = tagsRaw
      ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    // Build plant object
    const plant = {
      id: (data.get('id') || '').trim() || StorageAPI.generateId(),
      name,
      variety:            (data.get('variety') || '').trim(),
      tags,
      notes:              (data.get('notes') || '').trim(),
      sun:                data.get('sun') || 'full',
      spacing_cm:         parseNumOrNull(data.get('spacing_cm')),
      sowing_depth_mm:    parseNumOrNull(data.get('sowing_depth_mm')),
      days_to_germinate:  parseNumOrNull(data.get('days_to_germinate')),
      frost_hardy:        form.elements['frost_hardy'].checked,
      lifecycle:          data.get('lifecycle') || 'annual',
      supplier:           (data.get('supplier') || '').trim(),
      colour:             (data.get('colour') || '').trim(),
      active:             form.elements['active'].checked,
      milestones,
    };

    StorageAPI.save(plant);

    document.dispatchEvent(new CustomEvent('plant-saved', { detail: { plant } }));

    closeDialog();
  }

  function parseNumOrNull(val) {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
