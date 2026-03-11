import { describe, expect, vi, it, beforeAll, afterAll } from "vitest";
import { getDateCutStr } from "../../utils.js";

describe(`getDateCut works as expected`, async() => {
  it(`returns the correct value for the simple case (no jumpbacks)`, async() => {
    const dateStr = "2026-10-03"
    const res = getDateCutStr(dateStr)
    expect(res).toBe("2026-08-03")
  })

  it(`correctly returns an error if the number is too high`, async() => {
    const dateStr = "2026-14-03"
    const res = getDateCutStr(dateStr)
    expect(res).toBeUndefined()
  })

  it(`correctly jumbsback a year when needed`, async() => {
    const dateStr = "2026-01-03"
    const res = getDateCutStr(dateStr)
    expect(res).toBe("2025-11-03")
  })

  it(`correctly lowers the day when too high to avoid Feb shenanigans`, async() => {
    const dateStr = "2026-01-31"
    const res = getDateCutStr(dateStr)
    expect(res).toBe("2025-11-28")
  })
})