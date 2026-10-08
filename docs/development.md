# Development

## Prerequisites

- Node.js 20+ and npm
- PHP 8.1+ (for linting)
- A WordPress site with **Suntourz Core** — Docker is *not* required; [WordPress Playground](https://wordpress.github.io/wordpress-playground/) works well.

## Front-end

```bash
cd frontend
npm ci
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # production bundle → ../dist
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier
npm test             # vitest
```

## Run WordPress locally with Playground

Clone the sibling repositories next to each other:

```
suntourz/
├── suntourz-theme/
└── suntourz-core/
```

Build both front ends (`npm ci && npm run build` in each `frontend/`), then:

```bash
npx @wp-playground/cli@latest server \
  --mount-dir ./suntourz-theme /wordpress/wp-content/themes/suntourz-theme \
  --mount-dir ./suntourz-core  /wordpress/wp-content/plugins/suntourz-core
```

Open the printed URL, activate the plugin and theme, then import the demo data.

> On Windows run this from PowerShell or `cmd`, not Git Bash, and use `--mount-dir` (drive letters contain colons).

## Coding standards

- PHP: WordPress coding standards, `declare(strict_types=1)`, escape late, prefix everything with `stz_`.
- TypeScript: strict mode, no `any`, small components, lazy-load page bundles.
- Never put business rules in the theme — add them to Core and expose them through REST.

## Releasing

1. Update the version in `style.css`, `functions.php` (`STZ_THEME_VERSION`) and `CHANGELOG.md`.
2. Commit, then tag: `git tag v0.1.1 && git push --tags`.
3. The **Release zip** workflow builds the bundle and attaches `suntourz-theme.zip` to the GitHub release.

## Contributing

Issues and pull requests are welcome. Please run `npm run typecheck && npm test` before opening a PR and keep changes focused. By contributing you agree that your work is licensed under GPL-2.0-or-later.
