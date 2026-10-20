import { useEffect, useState } from "react"

// Dated snapshots of the Exchange API: one JSON per base currency per day.
const DATED_SOURCES = [
  (date, path) => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/${path}`,
  (date, path) => `https://${date}.currency-api.pages.dev/v1/${path}`,
]

// Days covered by each range and the spacing between sampled points, so that
// 90 days costs ~14 requests instead of 90.
export const RANGES = {
  "7D": { days: 7, step: 1 },
  "30D": { days: 30, step: 3 },
  "90D": { days: 90, step: 7 },
}

const MAX_BACKFILL = 2 // when a day has no snapshot, try up to 2 earlier days
const CACHE_PREFIX = "fx:hist:v1:"
const MISSING = 0 // cached marker for "no snapshot for this day"
const inflight = new Map()

export function shiftDate(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Dates to sample for a range ending at `end` (exclusive of `end` itself,
// which comes from the live rate), oldest first.
export function sampleDates(end, rangeKey) {
  const { days, step } = RANGES[rangeKey]
  const dates = []
  for (let offset = days; offset > 0; offset -= step) dates.push(shiftDate(end, -offset))
  return dates
}

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

function writeCache(key, value) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage full or blocked: the in-memory request cache still helps */
  }
}

// Rate base->quote on one date; null when the snapshot does not exist.
// Throws only when every source fails for a reason other than "not found".
async function fetchDayRate(base, quote, date) {
  const key = `${base}:${quote}:${date}`
  const cached = readCache(key)
  if (cached !== undefined) return cached === MISSING ? null : cached
  if (inflight.has(key)) return inflight.get(key)

  const task = (async () => {
    let notFound = 0
    let lastError
    for (const source of DATED_SOURCES) {
      try {
        const res = await fetch(source(date, `currencies/${base}.min.json`))
        if (res.status === 404) {
          notFound += 1
          continue
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const rate = json?.[base]?.[quote]
        const value = Number.isFinite(rate) && rate > 0 ? rate : MISSING
        writeCache(key, value)
        return value || null
      } catch (err) {
        lastError = err
      }
    }
    if (notFound === DATED_SOURCES.length) {
      writeCache(key, MISSING)
      return null
    }
    throw lastError || new Error("Snapshot unavailable")
  })()

  inflight.set(key, task)
  try {
    return await task
  } finally {
    inflight.delete(key)
  }
}

// Falls back to earlier days when a snapshot is missing (weekends, outages).
async function fetchPoint(base, quote, date, floor) {
  for (let back = 0; back <= MAX_BACKFILL; back++) {
    const day = shiftDate(date, -back)
    if (floor && day <= floor) break
    const rate = await fetchDayRate(base, quote, day)
    if (rate) return { date: day, rate }
  }
  return null
}

// { points: [{date, rate}], loading, error } for base->quote over a range.
// `end`/`endRate` are the latest date and rate, already loaded by the page.
export default function useRateHistory(base, quote, rangeKey, end, endRate) {
  const [state, setState] = useState({ key: null, points: [], error: null })
  const key = end && endRate ? `${base}:${quote}:${rangeKey}:${end}` : null

  useEffect(() => {
    if (!key) return
    let cancelled = false
    const dates = sampleDates(end, rangeKey)
    Promise.allSettled(dates.map((d, i) => fetchPoint(base, quote, d, i > 0 ? dates[i - 1] : null)))
      .then((results) => {
        if (cancelled) return
        const seen = new Set()
        const points = []
        for (const r of results) {
          if (r.status === "fulfilled" && r.value && !seen.has(r.value.date)) {
            seen.add(r.value.date)
            points.push(r.value)
          }
        }
        const failed = results.filter((r) => r.status === "rejected").length
        points.push({ date: end, rate: endRate })
        setState({
          key,
          points,
          error: points.length < 2 ? (failed ? "Couldn't load rate history. Check your connection." : "Not enough history for this pair.") : null,
        })
      })
    return () => {
      cancelled = true
    }
    // endRate is read once per key; live rate updates don't refetch history
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!key) return { points: [], loading: true, error: null }
  if (state.key !== key) return { points: [], loading: true, error: null }
  return { points: state.points, loading: false, error: state.error }
}
