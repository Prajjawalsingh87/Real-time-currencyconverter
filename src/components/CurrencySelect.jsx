import { useEffect, useMemo, useRef, useState } from 'react'
import { POPULAR, flagOf } from '../utils/currency'

export function CurrencyBadge({ code, size = "md" }) {
  const flag = flagOf(code)
  const box = size === "sm" ? "h-7 w-7 text-base" : "h-9 w-9 text-xl"
  const initials = size === "sm" ? "text-[8px]" : "text-[10px]"
  if (flag) return <span className={`${box} grid place-items-center rounded-full bg-indigo-50 leading-none`}>{flag}</span>
  return (
    <span className={`${box} grid place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 ${initials} font-bold tracking-tight text-slate-900`}>
      {code.slice(0, 3).toUpperCase()}
    </span>
  )
}

// Searchable currency picker: popular currencies first, then everything else A–Z.
function CurrencySelect({ value, onChange, options = [], names = {}, label }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = options.filter((c) => !q || c.includes(q) || (names[c] || "").toLowerCase().includes(q))
    const popular = POPULAR.filter((c) => matches.includes(c))
    const rest = matches.filter((c) => !POPULAR.includes(c)).sort()
    return { popular, rest }
  }, [options, names, query])

  const pick = (code) => {
    onChange(code)
    setOpen(false)
    setQuery("")
  }

  const row = (code) => (
    <li key={code}>
      <button
        type="button"
        onClick={() => pick(code)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-indigo-50 ${
          code === value ? "bg-indigo-500/20 ring-1 ring-indigo-400/40" : ""
        }`}
      >
        <CurrencyBadge code={code} size="sm" />
        <span className="w-12 font-semibold text-slate-900">{code.toUpperCase()}</span>
        <span className="truncate text-sm text-slate-600">{names[code] || ""}</span>
      </button>
    </li>
  )

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`${value.toUpperCase()}, ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-100 py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <CurrencyBadge code={value} />
        <span className="text-lg font-semibold tracking-wide text-slate-900">{value.toUpperCase()}</span>
        <svg className={`h-4 w-4 text-slate-600 transition ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="border-b border-slate-200 p-3">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search currency or country…"
              className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-indigo-400"
            />
          </div>
          <ul className="max-h-80 overflow-y-auto p-2">
            {list.popular.length > 0 && (
              <li className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Popular</li>
            )}
            {list.popular.map(row)}
            {list.rest.length > 0 && (
              <li className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">All currencies</li>
            )}
            {list.rest.map(row)}
            {list.popular.length + list.rest.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-500">No currency matches “{query}”</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CurrencySelect
