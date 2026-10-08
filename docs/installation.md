# Installation

## Requirements

| | Minimum |
| --- | --- |
| WordPress | 6.5 |
| PHP | 8.1 |
| Plugin | [Suntourz Core](https://github.com/rnd21312/suntourz-core) |
| Node.js (source builds only) | 20 |

## Option A — release zips (recommended)

1. Download `suntourz-core.zip` and `suntourz-theme.zip` from the releases of the two repositories.
2. **Plugins → Add New → Upload Plugin** → `suntourz-core.zip` → **Install Now** → **Activate**.
3. **Appearance → Themes → Add New → Upload Theme** → `suntourz-theme.zip` → **Install Now** → **Activate**.

> Install the plugin first. If the theme is active without Core, WordPress shows a notice asking you to activate it.

## Option B — build from source

```bash
git clone https://github.com/rnd21312/suntourz-theme.git
cd suntourz-theme/frontend
npm ci
npm run build          # writes ../dist (with .vite/manifest.json)
```

Copy the whole `suntourz-theme` folder (including `dist/`, excluding `frontend/` if you like) to `wp-content/themes/`.

## Demo content

1. **Suntourz → Settings → Demo data → Import demo tours**
   (or `wp stz demo import` with WP-CLI).
2. This creates tours with departures, sample bookings, pages (Home, Blog, About, Contact, Plan My Trip, Booking Success, Terms), menus, destinations and guide articles.
3. **Remove demo data** deletes only what the importer created.

## First-time setup

1. **Appearance → Menus** → assign a menu to **Primary** and **Footer**.
2. **Settings → Reading** → *A static page* → Homepage: *Home*, Posts page: *Blog* (the demo does this for you).
3. **Settings → Permalinks → Save** if pretty URLs give a 404.
4. **Suntourz → Settings** → *General* (name, logo, colours), *Company & contact*, *Currency*, *Booking rules*.

## Updating

Upload the new zip over the old one; WordPress offers to replace it. Database changes are handled by the Core plugin.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Site looks unstyled / blank | You installed the source folder. Build `dist/` or use the release zip. |
| Admin notice "Suntourz Core is required" | Activate the Core plugin. |
| 404 on tour or destination URLs | **Settings → Permalinks → Save**. |
| Hero / card images missing locally | The demo importer downloads sample photos; offline installs skip them. Upload your own images. |
