import { describe, expect, it } from "vitest"
import { RANGES, sampleDates, shiftDate } from "./useRateHistory"

describe("history sampling", () => {
  it("shifts dates across month and year boundaries", () => {
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31")
    expect(shiftDate("2024-02-28", 1)).toBe("2024-02-29")
  })

  it("samples every range oldest first, before the end date", () => {
    for (const key of Object.keys(RANGES)) {
      const dates = sampleDates("2026-10-20", key)
      expect(dates[0]).toBe(shiftDate("2026-10-20", -RANGES[key].days))
      expect([...dates].sort()).toEqual(dates)
      expect(dates.at(-1) < "2026-10-20").toBe(true)
    }
  })

  it("keeps a year to a few dozen requests", () => {
    const dates = sampleDates("2026-10-20", "1Y")
    expect(dates[0]).toBe("2025-10-20")
    expect(dates.length).toBeLessThanOrEqual(27)
  })
})
