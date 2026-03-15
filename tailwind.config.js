/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './_layouts/**/*.html',
    './_includes/**/*.html',
    './*.html',
    './**/*.html',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary:        'var(--color-primary)',
        secondary:      'var(--color-secondary)',
        bg:             'var(--color-bg)',
        fg:             'var(--color-fg)',
        surface:        'var(--color-surface)',
        border:         'var(--color-border)',
        muted:          'var(--color-muted)',
        'sow-indoors':  'var(--color-sow-indoors)',
        'transplant':   'var(--color-transplant)',
        'direct-sow':   'var(--color-direct-sow)',
        'flowering':    'var(--color-flowering)',
        'fruiting':     'var(--color-fruiting)',
        'harvest-start':'var(--color-harvest-start)',
        'harvest-end':  'var(--color-harvest-end)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
