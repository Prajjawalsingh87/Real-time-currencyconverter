import { useEffect, useState } from 'react'
import { fetchApi } from '../hooks/UseCurrencyInfo'
import { formatAmount } from '../utils/currency'

const KEY = "fx:alerts"
const MAX_ALERTS = 10
const CODE = /^[a-z0-9]{2,12}$/

function loadAlerts() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(saved)
      ? saved
          .filter((a) => a && CODE.test(a.from) && CODE.test(a.to) && (a.dir === "above" || a.dir === "below") && Number.isFinite(a.target) && a.target > 0)
          .slice(0, MAX_ALERTS)
      : []
  } catch {
    return []
  }
}

function saveAlerts(alerts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(alerts))
    return true
  } catch {
    return false
  }
}

const hit = (a, rate) => (a.dir === "above" ? rate > a.target : rate < a.target)

// Local rate alerts: "tell me when USD→INR goes above X". Stored on this device
// and checked against the latest rates each time the page loads.
function RateAlerts({ from, to, rate }) {
  const [alerts, setAlerts] = useState(loadAlerts)
  const [dir, setDir] = useState("above")
  const [target, setTarget] = useState("")
  const [current, setCurrent] = useState({}) // "usd:inr" -> latest rate
  const [message, setMessage] = useState("")

  // On load, fetch the latest rate for each saved alert's base currency.
  useEffect(() => {
    const bases = [...new Set(loadAlerts().map((a) => a.from))]
    let cancelled = false
    bases.forEach((base) =>
      fetchApi(`currencies/${base}.min.json`)
        .then((res) => {
          if (cancelled) return
          const rates = res[base] || {}
          setCurrent((c) => {
            const next = { ...c }
            for (const [quote, r] of Object.entries(rates)) next[`${base}:${quote}`] = r
            return next
          })
        })
        .catch(() => {})
    )
    return () => {
      cancelled = true
    }
  }, [])

  const rateOf = (a) => (a.from === from && a.to === to && rate ? rate : current[`${a.from}:${a.to}`])

  const update = (next, note) => {
    setAlerts(next)
    setMessage(saveAlerts(next) ? note : "Saved for this session only; browser storage is unavailable.")
  }

  const add = (e) => {
    e.preventDefault()
    const value = Number(target)
    if (!(value > 0) || !Number.isFinite(value)) return setMessage("Enter a target rate above zero.")
    if (alerts.length >= MAX_ALERTS) return setMessage(`You can keep up to ${MAX_ALERTS} alerts.`)
    update([...alerts, { id: Date.now().toString(36), from, to, dir, target: value }], "Alert saved. It's checked each time you open the app.")
    setTarget("")
  }

  const triggered = alerts.filter((a) => rateOf(a) && hit(a, rateOf(a)))

  return (
    <section aria-labelledby="alerts-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60 sm:p-6">
      <h2 id="alerts-title" className="font-semibold text-slate-900">Rate alerts</h2>
      <p className="text-xs text-slate-500">Saved on this device and checked when the page loads.</p>

      {triggered.length > 0 && (
        <div role="alert" className="mt-3 space-y-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {triggered.map((a) => (
            <p key={a.id}>
              🔔 {a.from.toUpperCase()}→{a.to.toUpperCase()} is {formatAmount(rateOf(a))}, {a.dir} your target of {formatAmount(a.target)}.
            </p>
          ))}
        </div>
      )}

      <form onSubmit={add} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-600">Tell me when 1 {from.toUpperCase()} → {to.toUpperCase()} goes</span>
        <select aria-label="Direction" value={dir} onChange={(e) => setDir(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900">
          <option value="above">above</option>
          <option value="below">below</option>
        </select>
        <input
          aria-label="Target rate"
          inputMode="decimal"
          value={target}
          onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && e.target.value.length <= 16 && setTarget(e.target.value)}
          placeholder={rate ? formatAmount(rate).replace(/,/g, "") : "rate"}
          className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900"
        />
        <button type="submit" className="studio-button studio-primary !py-1.5">Add alert</button>
      </form>
      <p className="studio-note mt-1" role="status">{message}</p>

      {alerts.length > 0 && (
        <ul className="mt-2 space-y-1">
          {alerts.map((a) => {
            const r = rateOf(a)
            const on = r && hit(a, r)
            return (
              <li key={a.id} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${on ? "bg-amber-50" : "bg-slate-50"}`}>
                <span className="text-slate-700">
                  {a.from.toUpperCase()}→{a.to.toUpperCase()} {a.dir} <strong className="tabular-nums">{formatAmount(a.target)}</strong>
                  <span className="ml-2 text-xs text-slate-500">{r ? `now ${formatAmount(r)}` : "checking…"}</span>
                </span>
                <button type="button" aria-label={`Remove alert ${a.from.toUpperCase()} to ${a.to.toUpperCase()} ${a.dir} ${a.target}`} onClick={() => update(alerts.filter((x) => x.id !== a.id), "Alert removed.")} className="rounded-lg px-2 text-slate-500 hover:bg-white hover:text-rose-700">
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default RateAlerts
