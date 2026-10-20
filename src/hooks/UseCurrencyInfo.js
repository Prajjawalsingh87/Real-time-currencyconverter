import { useEffect, useState } from "react"

// Free currency API (https://github.com/fawazahmed0/exchange-api), updated daily.
// The jsDelivr CDN is the main source; Cloudflare Pages is the documented fallback.
const SOURCES = [
  (path) => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/${path}`,
  (path) => `https://latest.currency-api.pages.dev/v1/${path}`,
]

export async function fetchApi(path) {
  let lastError
  for (const source of SOURCES) {
    try {
      const res = await fetch(source(path))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

// Rates for one base currency: { rates: { inr: 88.7, ... }, date: "2026-10-18", loading, error }
function useCurrencyInfo(currency) {
  const [state, setState] = useState({ base: currency, rates: {}, date: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ base: currency, rates: {}, date: null, loading: true, error: null })
    fetchApi(`currencies/${currency}.json`)
      .then((res) => {
        if (!cancelled) setState({ base: currency, rates: res[currency] || {}, date: res.date, loading: false, error: null })
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: "Couldn't load exchange rates. Check your connection." }))
      })
    return () => {
      cancelled = true
    }
  }, [currency])

  return state.base === currency ? state : { rates: {}, date: null, loading: true, error: null }
}

export default useCurrencyInfo
