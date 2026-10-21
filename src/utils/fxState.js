// Pure helpers for the converter's state: URL query, compare list, favourites
// and conversion. Kept free of React and browser globals so they can be unit tested.

export const CODE = /^[a-z0-9]{2,12}$/
export const MAX_COMPARE = 12
export const MAX_FAVOURITES = 8
const AMOUNT = /^\d{0,12}(\.\d{0,8})?$/

export const DEFAULT_STATE = { amount: "100", from: "usd", to: "inr", compare: [] }

export function normalizeCode(value) {
  const code = String(value ?? "").trim().toLowerCase()
  return CODE.test(code) ? code : null
}

// "1,000.50" -> "1000.50"; anything that is not a plain positive decimal -> null.
export function normalizeAmount(value) {
  const amount = String(value ?? "").trim().replace(/,/g, "")
  return amount !== "" && amount !== "." && AMOUNT.test(amount) ? amount : null
}

// Unique valid codes, in order, without `exclude`, capped at `max`.
export function cleanCodes(values, { exclude = [], max = MAX_COMPARE } = {}) {
  const out = []
  for (const v of Array.isArray(values) ? values : []) {
    const code = normalizeCode(v)
    if (code && !exclude.includes(code) && !out.includes(code)) out.push(code)
    if (out.length >= max) break
  }
  return out
}

const splitList = (raw) => (raw ? raw.split(",") : [])

// Reads ?amt=100&from=USD&to=INR,EUR,GBP. The first `to` code is the converter's
// target; the rest form the compare list (`cmp=` is accepted as well). Returns
// only the fields that were present and valid, so callers can fall back to saved state.
export function parseShareQuery(search) {
  let params
  try {
    params = new URLSearchParams(search || "")
  } catch {
    return {}
  }
  const out = {}
  const amount = normalizeAmount(params.get("amt"))
  if (amount !== null) out.amount = amount
  const from = normalizeCode(params.get("from"))
  if (from) out.from = from

  const toList = cleanCodes(splitList(params.get("to")), { max: MAX_COMPARE + 1 })
  const target = toList.find((c) => c !== (out.from ?? null))
  if (target) out.to = target
  // An empty list is left out, so a plain ?to=INR link keeps the visitor's saved compare list.
  const extra = [...toList.filter((c) => c !== target), ...splitList(params.get("cmp"))]
  const compare = cleanCodes(extra, { exclude: [out.from, out.to].filter(Boolean) })
  if (compare.length) out.compare = compare
  return out
}

// Inverse of parseShareQuery: "?amt=100&from=USD&to=INR,EUR".
export function buildShareQuery({ amount, from, to, compare = [] }) {
  const params = new URLSearchParams()
  const amt = normalizeAmount(amount)
  if (amt !== null) params.set("amt", amt)
  if (normalizeCode(from)) params.set("from", from.toUpperCase())
  const list = [to, ...cleanCodes(compare, { exclude: [from, to] })].filter((c) => normalizeCode(c))
  if (list.length) params.set("to", list.map((c) => c.toUpperCase()).join(","))
  // URLSearchParams escapes "," as %2C; commas are safe in a query string and easier to read.
  const qs = params.toString().replace(/%2C/gi, ",")
  return qs ? `?${qs}` : ""
}

// Initial state: URL beats saved values beats defaults.
export function resolveInitialState(search, saved = {}) {
  const fromUrl = parseShareQuery(search)
  const from = fromUrl.from ?? normalizeCode(saved.from) ?? DEFAULT_STATE.from
  let to = fromUrl.to ?? normalizeCode(saved.to) ?? DEFAULT_STATE.to
  if (to === from) to = from === "usd" ? "inr" : "usd"
  const compare = cleanCodes(fromUrl.compare ?? saved.compare ?? [], { exclude: [from, to] })
  return { amount: fromUrl.amount ?? DEFAULT_STATE.amount, from, to, compare, fromUrl: Object.keys(fromUrl).length > 0 }
}

export function convert(amount, rate) {
  const value = Number(amount)
  if (!Number.isFinite(value) || !Number.isFinite(rate) || rate <= 0) return null
  return value * rate
}

// One row per compare code: { code, rate, value }; rate/value are null while unknown.
export function compareRows(amount, rates, codes) {
  return codes.map((code) => {
    const rate = Number.isFinite(rates?.[code]) && rates[code] > 0 ? rates[code] : null
    return { code, rate, value: rate === null ? null : convert(amount, rate) }
  })
}

export function addCode(list, code, max = MAX_COMPARE) {
  const c = normalizeCode(code)
  if (!c || list.includes(c) || list.length >= max) return list
  return [...list, c]
}

export function removeCode(list, code) {
  return list.filter((c) => c !== code)
}

// Moves `code` by `delta` places (-1 up, +1 down); out-of-range moves are no-ops.
export function moveCode(list, code, delta) {
  const i = list.indexOf(code)
  const j = i + delta
  if (i < 0 || j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export const pairKey = (p) => `${p.from}-${p.to}`

export function cleanPairs(values, max = MAX_FAVOURITES) {
  const out = []
  for (const p of Array.isArray(values) ? values : []) {
    const from = normalizeCode(p?.from)
    const to = normalizeCode(p?.to)
    if (from && to && from !== to && !out.some((q) => q.from === from && q.to === to)) out.push({ from, to })
    if (out.length >= max) break
  }
  return out
}

export const isFavourite = (pairs, from, to) => pairs.some((p) => p.from === from && p.to === to)

// Adds the pair to the front, or removes it if it is already a favourite.
export function toggleFavourite(pairs, from, to, max = MAX_FAVOURITES) {
  if (isFavourite(pairs, from, to)) return pairs.filter((p) => p.from !== from || p.to !== to)
  return cleanPairs([{ from, to }, ...pairs], max)
}
