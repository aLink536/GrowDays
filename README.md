# GrowDays

A personal garden seed planner that helps you manage your plant growing timeline throughout the year. Track when to sow, transplant, flower, fruit, and harvest — all in one place.

## Features

- **Dashboard** — See upcoming milestones for the current month and a summary of active plants
- **Seed Calendar** — Color-coded 12-month grid showing every active plant's full lifecycle at a glance
- **Plant Library** — Add, edit, search, and toggle plants between active and inactive
- **Plant Detail Pages** — Per-plant metadata including spacing, sow depth, germination days, frost hardiness, and growing notes
- **Import / Export** — Back up or share your plant collection as JSON
- **Local-first** — All data lives in your browser's localStorage; no account or server required

## Tech Stack

- [Jekyll](https://jekyllrb.com/) — static site generator
- [Tailwind CSS](https://tailwindcss.com/) v3 — utility-first styling
- [PostCSS](https://postcss.org/) — CSS processing
- Vanilla JavaScript — no frameworks

## Getting Started

### Prerequisites

- Ruby & Bundler (for Jekyll)
- Node.js & npm (for Tailwind / PostCSS)

### Install

```bash
bundle install
npm install
```

### Development

Compile CSS and serve the site locally:

```bash
npm run build      # compile Tailwind CSS
bundle exec jekyll serve
```

Then open [http://localhost:4000](http://localhost:4000) in your browser.

> On first load, GrowDays seeds your library with 8 example plants (tomato, courgette, broad bean, sweet pea, chilli, basil, sunflower, and lettuce) so you can see the app in action straight away.

## Project Structure

```
seed-cal/
├── _config.yml          # Jekyll configuration
├── _layouts/
│   └── default.html     # Base page template
├── _includes/           # Reusable HTML components
├── _data/
│   └── plants.json      # Default plant library
├── assets/
│   ├── css/             # Tailwind entry point, design tokens, compiled output
│   └── js/              # Page-level scripts and shared utilities
├── index.html           # Dashboard
├── calendar.html        # 12-month calendar
├── library.html         # Plant library
└── plant/index.html     # Plant detail page (?id= param)
```

## Milestone Color Key

| Color | Stage |
|---|---|
| Purple | Sow indoors |
| Light green | Direct sow / transplant |
| Orange | Flowering |
| Red | Fruiting / harvest |

## License

MIT
