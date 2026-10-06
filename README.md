# Albion Production Base

Mobile-first Albion Online production planner for Albion East.

## Files

- `index.html` — website
- `functions/api/prices.js` — Cloudflare Pages Function for `/api/prices`

## Cloudflare deployment

Use a GitHub-connected Cloudflare Pages project. Pages Functions in the
`functions` directory are deployed with the project. Direct dashboard
drag-and-drop does not compile a `functions` directory.

Project structure:

    albion-production-base/
    ├── index.html
    └── functions/
        └── api/
            └── prices.js

The website already calls `/api/prices`, so no API URL needs to be entered
in the browser app.

The API proxy requests market data from Albion Data Project East.
