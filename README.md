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
| Hall of Fame, constitution, extra timeline events, custom awards | `content/` JSON and markdown |

Secrets never ship in the Next.js bundle. Commit derived JSON in `data/archive/` so the public site can build without cookies.

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
