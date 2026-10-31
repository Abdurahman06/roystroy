# Roystroy

Construction company website built with Next.js 15, React 19, TypeScript,
Tailwind CSS, Three.js and Leaflet.

## Local development

Use Node.js 24 (also specified in `.node-version`).

```sh
npm ci --include=dev
npm run dev
```

Open http://localhost:3000. To run the production build instead:

```sh
npm run build
npm start
```

Stop the development/production server before rebuilding in the same directory.

## Render deployment

The repository includes `render.yaml` for a **Free Node Web Service**.
In Render, create a Blueprint from this repository, review the Free plan,
and deploy. Alternatively, create a Web Service with these settings:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Runtime | Node |
| Root directory | Repository root (leave empty) |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start -- --hostname 0.0.0.0 --port $PORT` |
| Instance type | Free |

`PORT` is supplied by Render. No API keys or database are currently required.
The contact form opens WhatsApp; it does not store or email submissions.

Free web services sleep after 15 minutes of inactivity. The next request can
take about a minute to wake the service. Bandwidth/build limits also apply;
use this configuration for review, not as an availability guarantee for a
business website. See [Render's free service limits](https://render.com/docs/free)
and [Next.js deployment guide](https://render.com/docs/deploy-nextjs-app).

## Media and privacy

- The repository includes the optimized media needed to run the site.
- Original videos in `Reels/` and `animation/`, original models in `3д/`,
  design studies, local backups and test screenshots are excluded from Git.
  Keep a separate backup of those files; cloning this repo will not restore them.
- Reel preview files and exact Instagram destinations are mapped in
  `src/data/instagram-reels.json`.
- `scripts/prepare-instagram-reels.py` regenerates previews when the original
  local videos and Python's `imageio-ffmpeg` package are available. It is not
  part of the deployment build.
- Do not commit `.env` files, access tokens or customer submissions. Add future
  secrets through Render's environment settings.
- A public repository does not grant reuse rights to company branding, footage
  or third-party models. Check media permissions before a public launch.

Google Fonts are fetched during the build. External images use Unsplash;
the map uses OpenStreetMap tiles and retains their attribution. Some catalog
images and demo scenes remain illustrative, not verified company projects.

## Checks

```sh
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

Browser regression scripts are in `scripts/verify-*.cjs` and expect a running
local server and Playwright with Chrome. Set `PLAYWRIGHT_MODULE` to an installed
Playwright module if it is not available in the default Node resolution path.
Map tests mock map tiles rather than fetching them in bulk.

The targeted PostCSS override keeps Next.js 15 on a patched PostCSS 8 release.
Recheck this override and run the production build when upgrading Next.js.

## Demo routes

- `/demo/filters`: catalog filter design variations.
- `/demo/house`: separate imported-house experiment; the main viewer is unchanged.
