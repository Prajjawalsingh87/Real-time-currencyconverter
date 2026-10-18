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
- Loading and error states, and a backup rate source if the main one is down
- Responsive dark UI for phones and desktops

## 🛠 Tech Stack

React 18 · Vite 5 · Tailwind CSS 3 · [Exchange API](https://github.com/fawazahmed0/exchange-api) (free, updated daily)

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
│   └── CurrencySelect.jsx      # searchable currency picker, flag badges
├── hooks/
│   ├── UseCurrencyInfo.js      # rates for a base currency (with fallback source)
│   └── useCurrencyNames.js     # full currency names
└── utils/currency.js           # flags, number and date formatting
```

## 🚀 Deployment

Deployed on **Vercel**; every push to `main` deploys to production.
