import { describe, expect, it } from "vitest"
import {
  addCode,
  buildShareQuery,
  cleanPairs,
  compareRows,
  convert,
  moveCode,
  normalizeAmount,
  parseShareQuery,
  removeCode,
  resolveInitialState,
  toggleFavourite,
} from "./fxState"

describe("parseShareQuery", () => {
  it("reads amount, from, target and compare list", () => {
    expect(parseShareQuery("?amt=100&from=USD&to=INR,EUR,GBP")).toEqual({
      amount: "100",
      from: "usd",
      to: "inr",
      compare: ["eur", "gbp"],
    })
  })

  it("accepts a separate cmp list and de-duplicates", () => {
    expect(parseShareQuery("?from=usd&to=inr&cmp=eur,EUR,inr,usd,jpy").compare).toEqual(["eur", "jpy"])
  })

  it("skips a target equal to the base currency", () => {
    expect(parseShareQuery("?from=usd&to=USD,EUR")).toEqual({ from: "usd", to: "eur" })
  })

  it("drops invalid values", () => {
    expect(parseShareQuery("?amt=12abc&from=<script>&to=,,x")).toEqual({})
    expect(parseShareQuery("?amt=-5")).toEqual({})
    expect(parseShareQuery("")).toEqual({})
  })

  it("normalises amounts with thousands separators", () => {
    expect(parseShareQuery("?amt=1,000.5").amount).toBe("1000.5")
  })
})

describe("buildShareQuery", () => {
  it("writes upper-case codes with readable commas", () => {
    expect(buildShareQuery({ amount: "100", from: "usd", to: "inr", compare: ["eur", "gbp"] })).toBe("?amt=100&from=USD&to=INR,EUR,GBP")
  })

  it("round-trips through parseShareQuery", () => {
    const state = { amount: "2500.75", from: "eur", to: "jpy", compare: ["btc", "xau"] }
    expect(parseShareQuery(buildShareQuery(state))).toEqual(state)
  })

  it("omits an empty amount and repeats of the pair in the compare list", () => {
    expect(buildShareQuery({ amount: "", from: "usd", to: "inr", compare: ["inr", "usd"] })).toBe("?from=USD&to=INR")
  })
})

describe("resolveInitialState", () => {
  it("prefers the URL over saved state", () => {
    const s = resolveInitialState("?from=gbp&to=eur,jpy", { from: "usd", to: "inr", compare: ["aed"] })
    expect(s).toMatchObject({ from: "gbp", to: "eur", compare: ["jpy"], fromUrl: true })
  })

  it("keeps the saved compare list when the link has none", () => {
    const s = resolveInitialState("?to=eur", { compare: ["aed", "eur", "bad code"] })
    expect(s).toMatchObject({ from: "usd", to: "eur", compare: ["aed"] })
  })

  it("falls back to defaults", () => {
    expect(resolveInitialState("", {})).toEqual({ amount: "100", from: "usd", to: "inr", compare: [], fromUrl: false })
  })
})

describe("conversion", () => {
  it("multiplies amount by rate", () => {
    expect(convert("100", 88.5)).toBe(8850)
    expect(convert("", 2)).toBe(0)
    expect(convert("10", undefined)).toBeNull()
    expect(convert("10", 0)).toBeNull()
  })

  it("builds compare rows with unknown rates as null", () => {
    expect(compareRows("10", { eur: 0.9, jpy: 150 }, ["eur", "jpy", "zzz"])).toEqual([
      { code: "eur", rate: 0.9, value: 9 },
      { code: "jpy", rate: 150, value: 1500 },
      { code: "zzz", rate: null, value: null },
    ])
  })

  it("normalizeAmount rejects junk", () => {
    expect(normalizeAmount(".")).toBeNull()
    expect(normalizeAmount("1e5")).toBeNull()
    expect(normalizeAmount("0.25")).toBe("0.25")
  })
})

describe("compare list operations", () => {
  it("adds, removes and reorders", () => {
    let list = addCode([], "EUR")
    list = addCode(list, "gbp")
    list = addCode(list, "eur")
    expect(list).toEqual(["eur", "gbp"])
    expect(moveCode(list, "gbp", -1)).toEqual(["gbp", "eur"])
    expect(moveCode(list, "eur", -1)).toBe(list)
    expect(removeCode(list, "eur")).toEqual(["gbp"])
    expect(removeCode(list, "zzz")).toBe(list)
  })

  it("respects the maximum size", () => {
    expect(addCode(["a1", "b1"], "c1", 2)).toEqual(["a1", "b1"])
  })
})

describe("favourite pairs", () => {
  it("toggles a pair on and off, newest first", () => {
    let favs = toggleFavourite([], "usd", "inr")
    favs = toggleFavourite(favs, "eur", "gbp")
    expect(favs).toEqual([{ from: "eur", to: "gbp" }, { from: "usd", to: "inr" }])
    expect(toggleFavourite(favs, "usd", "inr")).toEqual([{ from: "eur", to: "gbp" }])
  })

  it("cleans saved data", () => {
    expect(cleanPairs([{ from: "usd", to: "usd" }, null, { from: "USD", to: "inr" }, { from: "usd", to: "inr" }])).toEqual([{ from: "usd", to: "inr" }])
  })
})
