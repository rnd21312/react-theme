# Theme guide

## Templates

| File | Used for |
| --- | --- |
| `front-page.php` | Home page (static front page) |
| `home.php` | Blog index ("Blog & Guide") |
| `single.php` | Guide article |
| `page.php` | Generic pages (About, Terms …) |
| `archive-stz_tour.php` | `/tours/` — filterable tour archive |
| `single-stz_tour.php` | A tour: details, itinerary, reviews, booking card |
| `taxonomy-stz_destination.php`, `taxonomy-stz_style.php` | Destination and travel-style archives |
| `template-plan-my-trip.php` | Page template **Plan My Trip** (trip request form) |
| `template-booking-success.php` | Page template **Booking success** (shows the booking code) |
| `404.php`, `index.php` | Fallbacks |

Each template prints a `#stz-root` mount point plus a JSON payload; the React app in `frontend/src/site` reads it and renders the right page component (`Home`, `ToursArchive`, `TourSingle`, `PlanMyTrip`, `BookingSuccess`, `Articles`, `Article`, `Page`, `NotFound`).

## Page types in the React app

`frontend/src/site/pages/*` — one lazily loaded bundle per page type, so the home page does not download the booking form or trip planner.

## Branding

All brand settings come from **Suntourz → Settings → General** (provided by Suntourz Core):

- Site name, tagline, logo (+ dark-background logo), favicon
- Logo badge text and subtitle
- Primary, accent and background colours → CSS custom properties (`inc/brand.php`)
- Footer description and contact details

For anything beyond that, use the [Suntourz Visual Editor](https://github.com/rnd21312/visual-editor) or a child theme.

## SEO

`inc/seo.php` prints title, meta description, canonical, robots, Open Graph, Twitter cards and JSON-LD. `inc/seo-fields.php` adds the *Search engine & sharing* box to pages, posts, tours and taxonomy terms.

The theme exposes two filters so other plugins (such as the Visual Editor) can override values per page:

```php
add_filter( 'stz_seo_override',  fn ( array $seo ) => $seo );
add_filter( 'stz_seo_canonical', fn ( string $url ) => $url );
```

If Yoast SEO or Rank Math is active, the theme steps back and lets them print the tags.

## Tour data contract

The theme never queries tours directly in templates; `inc/queries.php` and `inc/render.php` ask the Core plugin's catalog services and serialize the result into the page. See the Core repository's REST API docs for the JSON shape (`GET /wp-json/stz/v1/tours`).

## Customising

- **CSS tokens**: `frontend/src/styles/tokens.css`.
- **Section order on the home page**: `frontend/src/site/pages/Home.tsx` (or the Visual Editor, no code).
- **Child theme**: create `react-theme-child` with `Template: react-theme` and override any PHP template.
