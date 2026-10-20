import { useId, useMemo, useState } from 'react'
import useRateHistory, { RANGES } from '../hooks/useRateHistory'
import { formatAmount, formatDate } from '../utils/currency'

const W = 600
const H = 170
const PAD = { top: 12, right: 6, bottom: 4, left: 6 }

function shortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

// Small dependency-free line chart of the selected pair over 7/30/90 days.
function RateHistory({ from, to, date, rate }) {
  const [range, setRange] = useState("30D")
  const [hover, setHover] = useState(null)
  const { points, loading, error } = useRateHistory(from, to, range, date, rate)
  const titleId = useId()
  const descId = useId()
  const gradId = `fx-grad-${descId.replace(/[^a-zA-Z0-9]/g, "")}`

  const chart = useMemo(() => {
    if (points.length < 2) return null
    const rates = points.map((p) => p.rate)
    const min = Math.min(...rates)
    const max = Math.max(...rates)
    const span = max - min || max * 0.01 || 1
    const t0 = Date.parse(points[0].date)
    const t1 = Date.parse(points[points.length - 1].date)
    const x = (d) => PAD.left + ((Date.parse(d) - t0) / (t1 - t0 || 1)) * (W - PAD.left - PAD.right)
    const y = (r) => PAD.top + (1 - (r - min) / span) * (H - PAD.top - PAD.bottom)
    const coords = points.map((p) => ({ ...p, x: x(p.date), y: y(p.rate) }))
    const line = coords.map((c, i) => `${i ? "L" : "M"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")
    const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${H - PAD.bottom} L${coords[0].x.toFixed(1)},${H - PAD.bottom} Z`
    const first = rates[0]
    const last = rates[rates.length - 1]
    const change = ((last - first) / first) * 100
    return { coords, line, area, min, max, change, first, last }
  }, [points])

  const pair = `${from.toUpperCase()} → ${to.toUpperCase()}`
  const up = chart && chart.change >= 0
  const stroke = up ? "#059669" : "#e11d48"
  const active = chart && hover !== null ? chart.coords[hover] : null

  const onMove = (e) => {
    if (!chart) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    chart.coords.forEach((c, i) => {
      if (Math.abs(c.x - px) < Math.abs(chart.coords[best].x - px)) best = i
    })
    setHover(best)
  }

  return (
    <section aria-labelledby={titleId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={titleId} className="font-semibold text-slate-900">Rate history · {pair}</h2>
          <p className="text-xs text-slate-500">Daily snapshots{range === "90D" ? ", sampled weekly" : range === "30D" ? ", every 3 days" : ""}</p>
        </div>
        <div role="group" aria-label="History range" className="flex gap-1 rounded-full bg-slate-100 p-1">
          {Object.keys(RANGES).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={range === k}
              onClick={() => { setRange(k); setHover(null) }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${range === k ? "bg-white text-indigo-700 shadow" : "text-slate-600 hover:text-slate-900"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Low", chart && formatAmount(chart.min)],
          ["High", chart && formatAmount(chart.max)],
          ["Change", chart && `${chart.change >= 0 ? "+" : ""}${chart.change.toFixed(2)}%`],
        ].map(([label, val]) => (
          <div key={label} className="rounded-xl bg-slate-50 px-2 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`mt-0.5 text-sm font-semibold tabular-nums ${label === "Change" && chart ? (up ? "text-emerald-700" : "text-rose-700") : "text-slate-900"}`}>
              {val || "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="relative mt-4">
        {loading ? (
          <div className="h-[180px] animate-pulse rounded-xl bg-slate-100" aria-label="Loading rate history" role="status" />
        ) : error || !chart ? (
          <p className="grid h-[180px] place-items-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500" role="status">{error}</p>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full touch-none"
              role="img"
              aria-labelledby={descId}
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            >
              <title id={descId}>
                {`${pair} over ${RANGES[range].days} days: from ${formatAmount(chart.first)} to ${formatAmount(chart.last)} (${chart.change >= 0 ? "+" : ""}${chart.change.toFixed(2)}%), low ${formatAmount(chart.min)}, high ${formatAmount(chart.max)}.`}
              </title>
              <defs>
                <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#e2e8f0" />
              <path d={chart.area} fill={`url(#${gradId})`} />
              <path d={chart.line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {active && (
                <>
                  <line x1={active.x} x2={active.x} y1={PAD.top} y2={H - PAD.bottom} stroke="#94a3b8" strokeDasharray="3 3" />
                  <circle cx={active.x} cy={active.y} r="4.5" fill="#fff" stroke={stroke} strokeWidth="2.5" />
                </>
              )}
            </svg>
            <div className="flex justify-between text-[11px] text-slate-500" aria-hidden="true">
              <span>{shortDate(chart.coords[0].date)}</span>
              <span>{shortDate(chart.coords[chart.coords.length - 1].date)}</span>
            </div>
            <p className="mt-1 h-5 text-xs text-slate-600" aria-live="polite">
              {active ? `${formatDate(active.date)}: 1 ${from.toUpperCase()} = ${formatAmount(active.rate)} ${to.toUpperCase()}` : `${points.length} data points · hover the chart for daily values`}
            </p>
            <table className="sr-only">
              <caption>{pair} rate by date</caption>
              <thead><tr><th scope="col">Date</th><th scope="col">Rate</th></tr></thead>
              <tbody>
                {points.map((p) => <tr key={p.date}><td>{formatDate(p.date)}</td><td>{formatAmount(p.rate)}</td></tr>)}
              </tbody>
            </table>
          </>
        )}
      </div>
    </section>
  )
}

export default RateHistory
