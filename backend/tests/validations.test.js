import { test, expect } from "vitest";
import { validateInput } from "../validations.js";

test("validates type string correctly", () => {
  expect(validateInput("firstName", "string")).toStrictEqual([])
  expect(validateInput("firstName", 256)).toStrictEqual([[256, "type"]])
  expect(validateInput("firstName", [])).toStrictEqual([[[], "type"]])
})

test("validates type number correctly", () => {
  expect(validateInput("category", 256.3)).toStrictEqual([])
  expect(validateInput("category", 256.3)).toStrictEqual([])
  expect(validateInput("category", "string")).toStrictEqual([["string", "type"]])
  expect(validateInput("category", NaN)).toStrictEqual([[NaN, "type"]])
})

test("catches empty string", () => {
  expect(validateInput("firstName", "")).toStrictEqual([["", "presence"]])
})

test("catches empty input", () => {
  expect(validateInput("firstName", null)).toStrictEqual([[null, "presence"]])
  expect(validateInput("firstName", undefined)).toStrictEqual([[undefined, "presence"]])
})

test("validates length correctly", () => {
  expect(validateInput("firstName", "string")).toStrictEqual([])
  expect(validateInput("firstName", "thisstringhasdefinitelymorethanfiftyinlengthIassureyoumygoodsir")).toStrictEqual([["thisstringhasdefinitelymorethanfiftyinlengthIassureyoumygoodsir", "length"]])
})

test("validates email format correctly", () => {
  expect(validateInput("email", "email@gmail.com")).toStrictEqual([])
  expect(validateInput("email", "thisisarandomstring")).toStrictEqual([['thisisarandomstring', "format"]])
})

test("validates phone format correctly", () => {
  expect(validateInput("phone", '5561356226')).toStrictEqual([])
  expect(validateInput("phone", "05561356226")).toStrictEqual([['05561356226', "format"]])
})

test('validates value correctly', () => {
  expect(validateInput("role", "admin")).toStrictEqual([])
  expect(validateInput("role", "author")).toStrictEqual([["author", "value"]])
})
