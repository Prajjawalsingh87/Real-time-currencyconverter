import { useEffect, useId, useMemo, useRef, useState } from 'react'
import MiniSearch from 'minisearch'
import { CurrencyBadge } from './CurrencySelect'
import { POPULAR } from '../utils/currency'
import { countriesOf } from '../utils/countries'

// Builds a MiniSearch index over currency codes, names and countries.
export function buildIndex(codes, names) {
  const index = new MiniSearch({
    fields: ["code", "name", "countries"],
    storeFields: ["code"],
    searchOptions: {
      boost: { code: 4, name: 2 },
      prefix: true,
      // typo tolerance: ~1 edit for short words, 2 for longer ones
      fuzzy: (term) => (term.length <= 3 ? 0 : term.length <= 6 ? 1 : 2),
      combineWith: "AND",
    },
  })
  index.addAll(codes.map((code) => ({ id: code, code, name: names[code] || "", countries: countriesOf(code) })))
  return index
}

// Ctrl/Cmd+K global currency search. Enter converts to the currency,
// Alt+Enter (or the "From" button) sets it as the currency you send.
function CommandPalette({ open, onClose, codes, names, onPickTo, onPickFrom, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery)
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const listId = useId()

  const index = useMemo(() => (codes.length ? buildIndex(codes, names) : null), [codes, names])

  const results = useMemo(() => {
    const q = query.trim()
    if (!q || !index) return POPULAR.filter((c) => codes.includes(c))
    let hits = index.search(q)
    if (hits.length === 0) hits = index.search(q, { combineWith: "OR" })
    return hits.slice(0, 30).map((h) => h.id)
  }, [query, index, codes])

  useEffect(() => {
    if (open) {
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" })
  }, [active])

  if (!open) return null

  const pick = (code, asFrom) => {
    if (asFrom) onPickFrom(code)
    else onPickTo(code)
    setQuery("")
    onClose()
  }

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault()
      pick(results[active], e.altKey)
    } else if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    } else if (e.key === "Tab") {
      e.preventDefault() // keep focus inside the dialog
    }
  }

  const optionId = (code) => `${listId}-${code}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Search currencies" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <svg className="h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 60))}
            onKeyDown={onKeyDown}
            placeholder="Search code, name or country… (try “jpn yen” or “brazl”)"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? optionId(results[active]) : undefined}
            className="h-14 w-full bg-transparent text-base text-slate-900 placeholder-slate-400 outline-none focus-visible:outline-none"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500 sm:block">Esc</kbd>
        </div>
        <ul ref={listRef} id={listId} role="listbox" aria-label="Currencies" className="max-h-[50vh] overflow-y-auto p-2">
          {!query.trim() && <li role="presentation" className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Popular</li>}
          {results.map((code, i) => (
            <li
              key={code}
              id={optionId(code)}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => pick(code, false)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${i === active ? "bg-indigo-50 ring-1 ring-indigo-300" : ""}`}
            >
              <CurrencyBadge code={code} size="sm" />
              <span className="w-12 font-semibold text-slate-900">{code.toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-700">{names[code] || ""}</span>
                <span className="block truncate text-xs text-slate-500">{countriesOf(code)}</span>
              </span>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => { e.stopPropagation(); pick(code, true) }}
                className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
              >
                From
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-500">No currency matches “{query}”</li>}
        </ul>
        <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500">
          ↑↓ to move · Enter: convert to · Alt+Enter: convert from · typos are OK
        </p>
      </div>
    </div>
  )
}

export default CommandPalette
