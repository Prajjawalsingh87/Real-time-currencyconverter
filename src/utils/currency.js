// Real (ISO 4217) currencies; everything else in the API is crypto or a commodity.
const FIAT = new Set(
  (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("currency") : []).map((c) => c.toLowerCase())
)

export const POPULAR = ["usd", "inr", "eur", "gbp", "jpy", "aed", "cad", "aud", "sgd", "chf", "cny", "btc"]

export function isFiat(code) {
  return FIAT.has(code)
}

// Flag emoji from the first two letters of the code (USD -> US, INR -> IN, EUR -> EU).
export function flagOf(code) {
  if (!isFiat(code) || code.startsWith("x")) return null
  return code
    .slice(0, 2)
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
}

export function formatAmount(value) {
  if (!Number.isFinite(value)) return "0"
  if (value === 0) return "0"
  const abs = Math.abs(value)
  if (abs >= 1) return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)
  return new Intl.NumberFormat("en-IN", { maximumSignificantDigits: 4 }).format(value)
}

export function formatDate(iso) {
  if (!iso) return ""
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}
