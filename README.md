# 💱 FX Live — Real-time Currency Converter

Convert between **200+ currencies, crypto and metals** with live exchange rates. Built with React, Vite and Tailwind CSS.

**🔗 Live:** https://real-time-currencyconverter.vercel.app

## ✨ Features

- **Converts as you type**: no Convert button needed
- **Searchable currency picker**: flags and full names, search by code or name ("yen", "rupee"), popular currencies first
- **Swap** the two currencies with one click
- **Quick amounts**: 1 / 10 / 100 / 1,000 / 10,000
- **Rate in both directions** (e.g. `1 USD = 95.03 INR · 1 INR = 0.01052 USD`) plus the date of the rates
- **Popular rates panel**: your amount in 11 common currencies; click one to convert to it
- **Copy result** to the clipboard
- **Compare many currencies**: convert one amount into your own list of up to 12 currencies at once, each row with its rate and value; add, remove and reorder rows, and tap a row to make it the target. The list is saved on this device
- **Shareable links**: the address bar always reflects the view (`?amt=100&from=USD&to=INR,EUR`), so copying the URL reproduces it; **Copy link** button, plus **Share** via the native share sheet where the browser supports it
- **Favourite pairs**: star the current pair and switch between up to 8 favourites with one tap
- **Rate history chart** for the selected pair: 7 / 30 / 90 days or 1 year with low, high and change %, drawn as a lightweight inline SVG (no chart library), with a screen-reader summary and data table
- **Global currency search** (`Ctrl+K` / `⌘K`): typo-tolerant search across codes, names and countries ("brazl", "ivory coast", "swiss"), powered by [MiniSearch](https://github.com/lucaong/minisearch). `Enter` converts to the currency, `Alt+Enter` converts from it; `?q=yen` opens the search pre-filled
- **Rate alerts**: "tell me when USD → INR goes above 95", saved on this device and checked against the latest rates whenever the app opens
- Loading and error states, and a backup rate source if the main one is down
- Responsive light UI for phones and desktops
- **Installable & offline**: install it to your home screen or desktop with the **Install app** button; it keeps working without a connection, using the last saved rates
- **Light / dark theme**: follows your system by default; the toggle in the top bar remembers your choice

## 🛠 Tech Stack

React 18 · Vite 5 · Tailwind CSS 3 · MiniSearch · [Exchange API](https://github.com/fawazahmed0/exchange-api) (free, updated daily)

## ▶️ Run locally

```bash
git clone https://github.com/Prajjawalsingh87/Real-time-currencyconverter.git
cd Real-time-currencyconverter
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## 📂 Project structure

```
src/
├── App.jsx                     # page layout, conversion logic
├── components/
│   ├── InputBox.jsx            # amount + currency field
│   ├── CurrencySelect.jsx      # searchable currency picker, flag badges
│   ├── ComparePanel.jsx        # one amount in many currencies
│   ├── RateHistory.jsx         # 7D/30D/90D/1Y SVG line chart
│   ├── CommandPalette.jsx      # Ctrl+K MiniSearch currency search
│   └── RateAlerts.jsx          # local above/below rate alerts
├── hooks/
│   ├── UseCurrencyInfo.js      # rates for a base currency (with fallback source)
│   ├── useRateHistory.js       # sampled dated snapshots, sessionStorage cache
│   └── useCurrencyNames.js     # full currency names
└── utils/
    ├── currency.js             # flags, number and date formatting
    ├── fxState.js              # URL query, compare list, favourites, conversion (pure)
    └── countries.js            # countries/aliases per currency for search
```

## 📈 How the rate history works

The Exchange API publishes a dated snapshot per day (`@fawazahmed0/currency-api@YYYY-MM-DD`, with
`YYYY-MM-DD.currency-api.pages.dev` as fallback). To keep requests low the chart samples points:
daily for 7 days (7 requests), every 3 days for 30 days (10), weekly for 90 days (13) and every two
weeks for a year (27), plus today's live rate. The API has no time-series endpoint, so the chart is built
from these per-date calls. Each day's rate is cached in `sessionStorage`; when a snapshot is missing the app tries up
to two earlier days and otherwise leaves the gap out of the line.

## 🔗 Shareable links

| Parameter | Example | Meaning |
|-----------|---------|---------|
| `amt`  | `amt=100` | amount to convert |
| `from` | `from=USD` | base currency |
| `to`   | `to=INR,EUR,GBP` | first code is the converter's target; the rest form the compare list |
| `cmp`  | `cmp=JPY` | optional extra compare codes (accepted when reading) |
| `q`    | `q=yen` | opens the currency search pre-filled |

The app rewrites the query with `history.replaceState` as you change things, so the address bar is always a
working link. Invalid codes and amounts are ignored. A link with only one `to` code keeps the visitor's own
saved compare list; opening a link never overwrites the list saved on the device until it is edited.

## ⭐ Compare list & favourites

The compare list (`fx:compare`) and favourite pairs (`fx:pairs`, which also keeps pairs saved by earlier
versions) live in `localStorage`. Compare rows use the rates already loaded for the base currency, so they
work offline with the saved rates too.

## 🧪 Tests

```bash
npm test           # vitest: URL state, conversion, compare list, favourites, history sampling
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests and the build on every pull request.

## 📲 Install & offline (PWA)

`vite-plugin-pwa` generates `manifest.webmanifest` and a Workbox service worker (`sw.js`) at build time.
The service worker precaches the built app so it opens offline, and updates itself automatically when a
new version is deployed. Exchange rates use a **NetworkFirst** runtime cache with a 3-second timeout: when you are offline (or the network is slow) the app shows the last saved rates with an "Offline — showing saved rates" note, and past-date rates for the history chart are cached first since they never change. The **Install app** button only appears when the browser offers installation
(the `beforeinstallprompt` event). Icons (`public/pwa-*.png`, maskable and Apple touch icons) are rendered
from the app's SVG logo. `vercel.json` serves `sw.js`, `registerSW.js` and the manifest with
`Cache-Control: no-cache` so updates are picked up promptly.

## 🌗 Theme

The app follows `prefers-color-scheme` until you pick a theme with the toggle (`src/shell/`); the choice is
saved in `localStorage` (`color-theme`) and applied before first paint. Dark-mode colours are CSS variables in
`src/theme.css`, wired into Tailwind by `tailwind.theme.js`, so the light design keeps Tailwind's stock colours.

## 🚀 Deployment

Deployed on **Vercel**; every push to `main` deploys to production.


## October 2026 improvements

Save up to six currency pairs on this device and reopen them with one click. Switching the base currency clears old rates while the new rates load. Exchange API rates update daily, not tick-by-tick.


## Terminal verification and deployment

```bash
npm ci
npm run lint
npm test
npm run build
npm run dev
```

Node.js 24 is used on Vercel. The production build is written to `dist/`.

```bash
vercel link --project real-time-currencyconverter
vercel deploy          # preview
vercel deploy --prod   # publish production
```

The local `.vercel/` link is ignored by Git. Deployment credentials belong in
the CLI's login session, never in this repository.
