import { useId, useMemo, useState } from 'react'
import { CurrencyBadge } from './CurrencySelect'
import { MAX_COMPARE, compareRows } from '../utils/fxState'
import { formatAmount } from '../utils/currency'

const iconProps = { className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }

// Converts the current amount into every currency of the user's compare list.
function ComparePanel({ amount, from, to, rates, names, codes, onAdd, onRemove, onMove, onPick, message }) {
  const [pick, setPick] = useState("")
  const titleId = useId()
  const selectId = useId()
  const base = from.toUpperCase()
  const rows = compareRows(amount, rates, codes)

  // Everything with a rate that is not already shown, by code.
  const choices = useMemo(
    () => Object.keys(rates).filter((c) => c !== from && c !== to && !codes.includes(c)).sort(),
    [rates, from, to, codes]
  )
  const full = codes.length >= MAX_COMPARE

  const add = (e) => {
    e.preventDefault()
    if (!pick) return
    onAdd(pick)
    setPick("")
  }

  return (
    <section aria-labelledby={titleId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={titleId} className="font-semibold text-slate-900">Compare currencies</h2>
        <span className="text-xs text-slate-500">{formatAmount(Number(amount) || 0)} {base} in each</span>
      </div>

      <form onSubmit={add} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor={selectId} className="sr-only">Currency to compare</label>
        <select
          id={selectId}
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          disabled={full || choices.length === 0}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-900"
        >
          <option value="">{full ? `Up to ${MAX_COMPARE} currencies` : "Choose a currency…"}</option>
          {choices.map((c) => (
            <option key={c} value={c}>{c.toUpperCase()}{names[c] ? ` · ${names[c]}` : ""}</option>
          ))}
        </select>
        <button type="submit" disabled={!pick} className="studio-button studio-primary !py-2 disabled:opacity-50">Add</button>
      </form>
      <p className="studio-note mt-1 min-h-[1.25rem]" role="status">{message}</p>

      {rows.length === 0 ? (
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-600">
          Add currencies to see {base} converted into all of them at once. The list is saved on this device.
        </p>
      ) : (
        <ol className="mt-2 space-y-1">
          {rows.map(({ code, rate, value }, i) => {
            const label = code.toUpperCase()
            return (
              <li key={code} className="flex items-center gap-2 rounded-xl bg-slate-50 py-2 pl-3 pr-1">
                <button
                  type="button"
                  onClick={() => onPick(code)}
                  title={`Convert ${base} to ${label}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
                >
                  <CurrencyBadge code={code} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{label}</span>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{value === null ? "—" : formatAmount(value)}</span>
                    </span>
                    <span className="block truncate text-xs tabular-nums text-slate-600">
                      {rate ? `1 ${base} = ${formatAmount(rate)}` : "No rate available"}
                      {names[code] ? <span className="hidden sm:inline"> · {names[code]}</span> : null}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center">
                  <button type="button" onClick={() => onMove(code, -1)} disabled={i === 0} aria-label={`Move ${label} up`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-white hover:text-indigo-700 disabled:opacity-30">
                    <svg {...iconProps}><path d="M6 15l6-6 6 6" /></svg>
                  </button>
                  <button type="button" onClick={() => onMove(code, 1)} disabled={i === rows.length - 1} aria-label={`Move ${label} down`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-white hover:text-indigo-700 disabled:opacity-30">
                    <svg {...iconProps}><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  <button type="button" onClick={() => onRemove(code)} aria-label={`Remove ${label}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-white hover:text-rose-700">
                    <svg {...iconProps}><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default ComparePanel
