# Architecture

## Design principle

> The theme only renders. Business logic lives in `suntourz-core`.

WordPress stays the source of truth for URLs, content, SEO and permissions. The theme turns each request into HTML + a JSON payload, and React takes over the interactive parts.

```
Request ──► WordPress routing ──► theme template (PHP)
                                      │
                         ┌────────────┴─────────────┐
                         │ SEO tags, <head>, brand  │  inc/seo.php, inc/brand.php
                         │ #stz-root + JSON payload │  inc/render.php
                         │ <noscript>/fallback HTML │  inc/fallback.php
                         └────────────┬─────────────┘
                                      ▼
                         Vite bundle (dist/) — React 19
                         frontend/src/site/main.tsx
                                      │  fetch (REST, nonce-less public routes)
                                      ▼
                         suntourz-core  /wp-json/stz/v1/*
```

## Vite ↔ PHP bridge

`inc/vite.php` reads `dist/.vite/manifest.json`, enqueues the entry's CSS and module script, and emits `modulepreload` links for its imports. When the manifest is missing (source checkout) it prints nothing and the fallback render keeps the site readable.

Critical CSS for the splash screen is inlined so first paint is never unstyled. The `html.stz-js` / `html.stz-ready` classes drive the splash and the scroll-reveal system (`frontend/src/lib/reveal.ts`).

## Folder map

| Path | Purpose |
| --- | --- |
| `inc/setup.php` | Theme supports, menus, image sizes |
| `inc/plugin-check.php` | Notice when Core is inactive |
| `inc/vite.php` | Manifest loader, critical CSS, preloads |
| `inc/render.php` | Mount point + JSON payload per route |
| `inc/fallback.php` | Server-rendered fallback markup |
| `inc/queries.php` | Query helpers for the tour archive and listings |
| `inc/seo.php`, `inc/seo-fields.php` | Meta, Open Graph, JSON-LD, admin SEO boxes |
| `inc/brand.php` | CSS variables from settings |
| `frontend/src/site` | React app (`main.tsx`, `pages/*`) |
| `frontend/src/components` | Cards, forms, layout, overlays, sections |
| `frontend/src/lib` | public API client, formatting, wishlist, scroll reveal, WP data bootstrap |
| `frontend/src/styles` | Tailwind tokens and site CSS |

## Data flow for a booking

1. Guest chooses a departure and plan on the tour page → `POST /stz/v1/quote` returns a live price.
2. Submitting the form → `POST /stz/v1/bookings` (rate-limited, optional Cloudflare Turnstile).
3. Core creates the booking in the `stz_bookings` table, holds seats and returns a booking code.
4. The theme redirects to the *Booking success* page which looks up `GET /stz/v1/bookings/{code}`.

## Testing

Unit tests (Vitest) cover pure helpers: price formatting and the public API client. Run `npm test` in `frontend/`.
