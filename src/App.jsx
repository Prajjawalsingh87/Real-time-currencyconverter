import { useEffect, useMemo, useState } from 'react'
import { InputBox, CurrencyBadge } from './components'
import useCurrencyInfo from './hooks/UseCurrencyInfo'
import useCurrencyNames from './hooks/useCurrencyNames'
import useOnlineStatus from './hooks/useOnlineStatus'
import RateHistory from './components/RateHistory'
import RateAlerts from './components/RateAlerts'
import CommandPalette from './components/CommandPalette'
import { POPULAR, formatAmount, formatDate } from './utils/currency'

const QUICK_AMOUNTS = ["1", "10", "100", "1000", "10000"]

function App() {
  const [amount, setAmount] = useState("100")
  const [from, setFrom] = useState("usd")
  const [to, setTo] = useState("inr")
  const [spin, setSpin] = useState(0)
  const [copied, setCopied] = useState(false)
  const [savedPairs, setSavedPairs] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem("fx:pairs")); return Array.isArray(saved) ? saved.filter(p => p && /^[a-z0-9]{2,12}$/.test(p.from) && /^[a-z0-9]{2,12}$/.test(p.to)).slice(0, 6) : [] } catch { return [] }
  })
  const [pairMessage, setPairMessage] = useState("")
  // ?q=yen opens the currency search pre-filled (shareable search links)
  const [initialQuery] = useState(() => {
    try { return (new URLSearchParams(window.location.search).get("q") || "").slice(0, 60) } catch { return "" }
  })
  const [paletteOpen, setPaletteOpen] = useState(() => initialQuery !== "")

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  const savePair = () => {
    const next = [{ from, to }, ...savedPairs.filter(p => p.from !== from || p.to !== to)].slice(0, 6)
    setSavedPairs(next)
    try { localStorage.setItem("fx:pairs", JSON.stringify(next)); setPairMessage("Pair saved on this device.") }
    catch { setPairMessage("Pair saved for this session only; browser storage is unavailable.") }
  }

  const { rates, date, loading, error } = useCurrencyInfo(from)
  const names = useCurrencyNames()
  const online = useOnlineStatus()
  const options = useMemo(() => Object.keys(rates), [rates])

  const rate = rates[to]
  const value = Number(amount) || 0
  const converted = rate ? value * rate : 0
  const convertedText = rate ? formatAmount(converted) : ""

  // Live conversion, so swapping just flips the pair; the amount stays what the user typed.
  const swap = () => {
    setFrom(to)
    setTo(from)
    setSpin((s) => s + 180)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${convertedText} ${to.toUpperCase()}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }

  const popular = POPULAR.filter((c) => c !== from && rates[c])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-sans text-slate-700 antialiased">
      {/* soft background glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6">
        {/* header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 shadow-lg shadow-indigo-500/30">
              <svg className="h-5 w-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7h11l-3-3M17 17H6l3 3" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-slate-900">FX Live</p>
              <p className="text-xs text-slate-500">Daily exchange rates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-keyshortcuts="Control+K Meta+K"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <span className="hidden sm:inline">Search currencies</span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-sans text-[10px]">Ctrl K</kbd>
          </button>
          <span className="hidden items-center gap-2 rounded-full border sm:flex border-emerald-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            {date ? `Rates of ${formatDate(date)}` : "Loading rates"}
          </span>
          </div>
        </header>

        <main className="grid flex-1 grid-cols-1 items-start gap-6 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:pt-10">
          <div className="flex min-w-0 flex-col gap-6">
          {/* converter */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60 backdrop-blur-xl sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Convert <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">any currency</span>, instantly
            </h1>
            <p className="mt-1 text-sm text-slate-600">200+ currencies, including crypto and metals. Results update as you type.</p>

            <div className="mt-6">
              <InputBox
                label="You send"
                amount={amount}
                onAmountChange={setAmount}
                currencyOptions={options}
                currencyNames={names}
                onCurrencyChange={setFrom}
                selectCurrency={from}
              />

              <div className="relative z-10 -my-3 flex justify-center">
                <button
                  type="button"
                  onClick={swap}
                  aria-label="Swap currencies"
                  className="grid h-12 w-12 place-items-center rounded-full border-4 border-slate-900 bg-gradient-to-br from-indigo-500 to-emerald-500 text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  <svg
                    className="h-5 w-5 transition-transform duration-500"
                    style={{ transform: `rotate(${spin}deg)` }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
                  </svg>
                </button>
              </div>

              <InputBox
                label="They get"
                amount={convertedText}
                currencyOptions={options}
                currencyNames={names}
                onCurrencyChange={setTo}
                selectCurrency={to}
                amountDisable
                loading={loading && !rate}
              />
            </div>

            <div className="studio-toolbar">
              <button className="studio-button" onClick={savePair}>Save pair</button>
              {savedPairs.map(p => <button className="studio-button" key={`${p.from}-${p.to}`} onClick={() => { setFrom(p.from); setTo(p.to); }}>{p.from.toUpperCase()} → {p.to.toUpperCase()}</button>)}
            </div>
            <p className="studio-note" role="status">{pairMessage}</p>
            {/* quick amounts */}
            <div className="mt-5 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    amount === q
                      ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-700"
                      : "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-indigo-50"
                  }`}
                >
                  {formatAmount(Number(q))}
                </button>
              ))}
            </div>

            {!online && date && !error && (
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M2 8.8a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01M3 3l18 18" /></svg>
                Offline — showing saved rates from {formatDate(date)}.
              </p>
            )}

            {/* result summary */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 p-5">
              {error ? (
                <p className="text-sm text-rose-700" role="alert">{online ? error : "You're offline and no saved rates are available for this currency yet."}</p>
              ) : (
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-600">
                      {formatAmount(value)} {from.toUpperCase()} =
                    </p>
                    <p className="mt-1 break-all text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                      {rate ? convertedText : "—"} <span className="text-xl font-semibold text-indigo-700">{to.toUpperCase()}</span>
                    </p>
                    {rate && (
                      <p className="mt-2 text-sm text-slate-600">
                        1 {from.toUpperCase()} = {formatAmount(rate)} {to.toUpperCase()}
                        <span className="mx-2 text-slate-600">·</span>
                        1 {to.toUpperCase()} = {formatAmount(1 / rate)} {from.toUpperCase()}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={copy}
                    disabled={!rate}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 disabled:opacity-40"
                  >
                    {copied ? (
                      <>
                        <svg className="h-4 w-4 text-indigo-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>
                        Copy result
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>

          {rate && date ? (
            <RateHistory from={from} to={to} date={date} rate={rate} />
          ) : null}
          <RateAlerts from={from} to={to} rate={rate} />
          </div>

          {/* popular rates */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-semibold text-slate-900">Popular rates</h2>
              <span className="text-xs text-slate-500">for {formatAmount(value)} {from.toUpperCase()}</span>
            </div>
            <ul className="space-y-1">
              {loading && popular.length === 0
                ? Array.from({ length: 8 }, (_, i) => <li key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)
                : popular.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        onClick={() => setTo(c)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-100 ${
                          c === to ? "bg-slate-100 ring-1 ring-indigo-400/40" : ""
                        }`}
                      >
                        <CurrencyBadge code={c} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{c.toUpperCase()}</span>
                          <span className="block truncate text-xs text-slate-600">{names[c] || ""}</span>
                        </span>
                        <span className="text-right text-sm font-medium tabular-nums text-slate-700">
                          {formatAmount(value * rates[c])}
                        </span>
                      </button>
                    </li>
                  ))}
            </ul>
          </aside>
        </main>

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          codes={options}
          names={names}
          initialQuery={initialQuery}
          onPickTo={(c) => { if (c === from) setFrom(to); setTo(c) }}
          onPickFrom={(c) => { if (c === to) setTo(from); setFrom(c) }}
        />

        <footer className="pb-6 text-center text-xs text-slate-600">
          Rates from the free{" "}
          <a className="text-slate-600 underline-offset-2 hover:underline" href="https://github.com/fawazahmed0/exchange-api" target="_blank" rel="noreferrer">
            Exchange API
          </a>
          , updated daily. For reference only.
        </footer>
      </div>
    </div>
  )
}

export default App
