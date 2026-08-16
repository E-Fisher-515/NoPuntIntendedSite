# No Punt Intended — League Archive

Official digital archive for the **No Punt Intended** fantasy football league. Championship banners, manager careers, the record book, and season history are generated from ESPN — the same source as the weekly newsletter.

This is not an ESPN clone. It is the league's record book.

Repo: [https://github.com/E-Fisher-515/NoPuntIntendedSite](https://github.com/E-Fisher-515/NoPuntIntendedSite)

## Local development

```bash
npm install
cp .env.example .env   # add ESPN_S2 and ESPN_SWID for private-league ingest
pip install -r ingest/requirements.txt
python ingest/ingest.py
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What is ESPN vs editorial

| Page | Source |
| --- | --- |
| Standings, scores, championships, records | ESPN (`espn-api`) |
| Hall of Fame, constitution, countdown banner, extra timeline events, custom awards | `public/editorial.json`, edited from `/admin` |

Secrets never ship in the Next.js bundle. Commit derived JSON in `data/archive/` so the public site can build without cookies.

## Commissioner admin

The public site is static GitHub Pages, so editorial edits are saved with a GitHub token (Contents write on this repo). Open the discreet **Commissioner** link in the footer, paste a PAT, and edit:

- Countdown banner (draft day, playoffs, or off)
- Constitution
- Hall of Fame suggestions, approvals, and rejections
- Timeline notes
- Custom awards

The token stays in sessionStorage in that browser only. Do not commit tokens or `.env`.

## Refreshing data

```bash
python ingest/ingest.py
```

Re-run after the NFL week turns, then commit updated `data/archive/` files.

## Public site

GitHub Pages (after the first Actions deploy):

https://e-fisher-515.github.io/NoPuntIntendedSite/

To publish on Vercel as well:

```bash
npx vercel login
npx vercel --prod --yes
```

Or import https://github.com/E-Fisher-515/NoPuntIntendedSite in the Vercel dashboard.
