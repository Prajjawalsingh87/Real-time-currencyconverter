import { isFiat } from "./currency"

// Countries and nicknames that the two-letter region in the code does not cover:
// shared currencies (EUR, XOF, ...), dollarised economies and common aliases.
const EXTRA = {
  eur: "Eurozone Europe Germany France Italy Spain Netherlands Belgium Austria Portugal Ireland Finland Greece Slovakia Slovenia Estonia Latvia Lithuania Luxembourg Malta Cyprus Croatia Montenegro Kosovo Andorra Monaco San Marino Vatican",
  usd: "America USA Ecuador El Salvador Panama Puerto Rico Timor-Leste Zimbabwe Guam",
  gbp: "UK Britain England Scotland Wales Northern Ireland pound sterling",
  inr: "Bhutan rupee",
  aud: "Kiribati Nauru Tuvalu",
  nzd: "Cook Islands Niue Pitcairn",
  chf: "Liechtenstein",
  dkk: "Greenland Faroe Islands",
  zar: "Lesotho Namibia Eswatini",
  ang: "Curacao Sint Maarten",
  xof: "West Africa Benin Burkina Faso Ivory Coast Cote d'Ivoire Guinea-Bissau Mali Niger Senegal Togo CFA",
  xaf: "Central Africa Cameroon Central African Republic Chad Congo Equatorial Guinea Gabon CFA",
  xcd: "Eastern Caribbean Antigua Barbuda Dominica Grenada Saint Kitts Nevis Saint Lucia Saint Vincent Grenadines Anguilla Montserrat",
  xpf: "French Polynesia New Caledonia Wallis Futuna",
  jpy: "yen",
  cny: "renminbi yuan",
  krw: "won Korea",
  btc: "crypto bitcoin",
  eth: "crypto ethereum ether",
  xau: "gold metal",
  xag: "silver metal",
  xpt: "platinum metal",
  xpd: "palladium metal",
}

let regionNames
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" })
} catch {
  regionNames = null
}

// Country/region names associated with a currency code, as one searchable string.
export function countriesOf(code) {
  const parts = []
  if (regionNames && isFiat(code) && !code.startsWith("x")) {
    const region = code.slice(0, 2).toUpperCase()
    try {
      const name = regionNames.of(region)
      if (name && name !== region && name !== "Unknown Region") parts.push(name)
    } catch {
      /* not a region */
    }
  }
  if (EXTRA[code]) parts.push(EXTRA[code])
  return parts.join(" ")
}
