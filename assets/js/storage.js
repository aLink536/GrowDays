/**
 * StorageAPI — global object for all localStorage plant data operations.
 * All methods are synchronous except seedDefaults (async fetch).
 */
const StorageAPI = {
  STORAGE_KEY: 'seed-cal-plants',

  /** Return all plants as an array. Returns [] if storage is empty or invalid. */
  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /** Return a single plant by id, or null if not found. */
  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },

  /**
   * Upsert a plant by id.
   * If a plant with the same id exists it is replaced; otherwise appended.
   */
  save(plant) {
    const plants = this.getAll();
    const idx = plants.findIndex(p => p.id === plant.id);
    if (idx >= 0) {
      plants[idx] = plant;
    } else {
      plants.push(plant);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plants));
  },

  /** Remove a plant by id. No-op if not found. */
  delete(id) {
    const plants = this.getAll().filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plants));
  },

  /**
   * On first visit (no existing localStorage data), fetch the bundled
   * default plants from the static JSON asset and seed localStorage.
   */
  async seedDefaults() {
    if (localStorage.getItem(this.STORAGE_KEY)) return;
    try {
      const base = window.SITE_BASEURL || '';
      const res = await fetch(base + '/assets/data/plants.json');
      if (!res.ok) throw new Error('Failed to fetch default plants');
      const plants = await res.json();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plants));
    } catch (err) {
      console.warn('[StorageAPI] Could not seed defaults:', err);
    }
  },

  /**
   * Trigger a browser download of the current plant data as a JSON file.
   */
  exportJSON() {
    const data = this.getAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seed-calendar-data.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Read a JSON File object, parse it, and replace localStorage contents.
   * Returns a Promise that resolves with the imported plant array.
   */
  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const plants = JSON.parse(e.target.result);
          if (!Array.isArray(plants)) throw new Error('Expected a JSON array');
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plants));
          resolve(plants);
        } catch (err) {
          reject(new Error('Invalid JSON file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsText(file);
    });
  },

  /**
   * Generate a simple unique ID for new plants.
   */
  generateId() {
    return 'plant-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },
};
