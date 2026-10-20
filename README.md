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
- **Rate history chart** for the selected pair: 7 / 30 / 90 days with low, high and change %, drawn as a lightweight inline SVG (no chart library), with a screen-reader summary and data table
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
│   ├── RateHistory.jsx         # 7/30/90-day SVG line chart
│   ├── CommandPalette.jsx      # Ctrl+K MiniSearch currency search
│   └── RateAlerts.jsx          # local above/below rate alerts
├── hooks/
│   ├── UseCurrencyInfo.js      # rates for a base currency (with fallback source)
│   ├── useRateHistory.js       # sampled dated snapshots, sessionStorage cache
│   └── useCurrencyNames.js     # full currency names
└── utils/
    ├── currency.js             # flags, number and date formatting
    └── countries.js            # countries/aliases per currency for search
```

## 📈 How the rate history works

The Exchange API publishes a dated snapshot per day (`@fawazahmed0/currency-api@YYYY-MM-DD`, with
`YYYY-MM-DD.currency-api.pages.dev` as fallback). To keep requests low the chart samples points:
daily for 7 days (7 requests), every 3 days for 30 days (10) and weekly for 90 days (13), plus today's
live rate. Each day's rate is cached in `sessionStorage`; when a snapshot is missing the app tries up
to two earlier days and otherwise leaves the gap out of the line.

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
