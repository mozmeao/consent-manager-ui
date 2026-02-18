# Consent Manager UI

Mozilla's fork of the [Transcend Consent Manager reference UI](https://github.com/transcend-io/consent-manager-ui). This repo contains visual rendering playgrounds for consent banners.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/) 4 (the repo uses Yarn PnP — no `node_modules`)
- A `.env` file at the project root with the Transcend bundle ID:

```
BUNDLE_ID=<bundle-id>
```

Ask a team member for the bundle ID if you don't have it.

## Getting Started

```sh
git clone git@github.com:mozmeao/consent-manager-ui.git
cd consent-manager-ui
yarn install
```

## Local Development

### Standard page (dist/index.html)

These commands build the UI and serve `dist/` on `http://localhost:8080`. The page loads the Transcend airgap.js script from CDN and renders the consent banner.

| Command | Description |
|---|---|
| `yarn start` | All assets loaded from localhost (local UI, CSS, translations) |
| `yarn start:cm-test` | All assets from CDN (cm-test environment) |
| `yarn start:prod` | All assets from CDN (production environment) |
| `yarn start:cm-test:local-css` | CDN UI + local CSS (test your CSS changes against cm-test) |
| `yarn start:prod:local-css` | CDN UI + local CSS (test your CSS changes against prod) |

Changes to source files auto-rebuild via esbuild watch mode.

### Custom permutations

For any combination not covered above, use `build:custom` with flags:

```sh
# Build with granular control, then serve
yarn build:custom --cm-test --local-ui --local-css
yarn live-server --host=localhost dist/
```

Available flags (combine with `--cm-test` or `--cm`):

| Flag | Effect |
|---|---|
| `--local-ui` | Load `ui.js` from localhost instead of CDN |
| `--local-css` | Load `cm.css` from localhost instead of CDN |
| `--local-messages` | Load translations from localhost instead of CDN |

Without `--cm-test` or `--cm`, all assets default to localhost (local mode).

### Playground

The playground is an interactive tool for testing different consent banner view states, editing config JSON, viewing consent event logs, and switching between CSS sources (local vs CDN).

| Command | Description |
|---|---|
| `yarn playground` | Local build |
| `yarn playground:cm-test` | cm-test build |
| `yarn playground:prod` | Production build |

The playground opens at `http://localhost:8080/src/playground/index.html` and includes:

- **Config** — edit `loadOptions` and `getPurposeTypes()` via a JSON editor with schema validation
- **Environment** — toggle GPC/DNT privacy signals
- **Asset source** — switch CSS between local, CDN cm-test, and CDN prod (applies on reload)
- **View states** — launch any consent banner variant
- **Consent log** — see `airgap.setConsent()`, `optIn()`, `optOut()` calls

## Customizing CSS

Edit `src/cm.css` — this is the stylesheet that controls the consent banner appearance. During local development it's copied to `dist/cm.css` on each build.

To preview your CSS changes against the CDN-deployed UI (ensuring your styles work with the production JavaScript), use:

```sh
yarn start:cm-test:local-css
```

Or in the playground, use the **Asset source** dropdown to switch between local and CDN CSS.

## Testing

```sh
yarn test              # run all tests
yarn test:watch        # interactive watch mode with snapshot review
yarn test:update       # update snapshots
```

Tests use [Jest](https://jestjs.io/) with [@testing-library/preact](https://testing-library.com/docs/preact-testing-library/intro/) and include HTML snapshots of each view state to catch regressions.

## Linting & Formatting

```sh
yarn lint              # ESLint
yarn format            # Prettier
```

## Build Scripts Reference

| Command | Description |
|---|---|
| `yarn build` | Build for local mode (all `data-*` attrs point to localhost) |
| `yarn build:cm-test` | Build for cm-test (CDN assets) |
| `yarn build:prod` | Build for production (CDN assets) |
| `yarn build:custom` | Build with custom flags (see above) |
| `yarn build:base` | Core build only (esbuild + copy translations/CSS, no index.html) |
| `yarn clean` | Clean TypeScript build artifacts |
