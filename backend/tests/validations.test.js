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

test("validates type boolean correctly", () => {
  expect(validateInput("comissions", true)).toStrictEqual([])
  expect(validateInput("comissions", false)).toStrictEqual([])
  expect(validateInput("comissions", "true")).toStrictEqual([["true", "type"]])
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

test("validates exact length correctly", () => {
  expect(validateInput("birthday", "22121988")).toStrictEqual([])
  expect(validateInput("birthday", "2212198")).toStrictEqual([["2212198", "exactLength"]])
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
  expect(validateInput("pasta", "Blanda")).toStrictEqual([])
  expect(validateInput("pasta", "Blandada")).toStrictEqual([["Blandada", "value"]])
})

test('validates isbn format correctly', () => {
  expect(validateInput("isbn", 9786075988658)).toStrictEqual([]);
  expect(validateInput("isbn", 9786075)).toStrictEqual([[9786075, "format"]])
})

test("validates birthday format correctly", () => {
  expect(validateInput("birthday", '22121988')).toStrictEqual([]);
  expect(validateInput("birthday", '32121988')).toStrictEqual([["32121988", "format"]]);
  expect(validateInput("birthday", '22141988')).toStrictEqual([['22141988', "format"]]);
  expect(validateInput("birthday", '22122054')).toStrictEqual([['22122054', "format"]]);
  expect(validateInput("birthday", '22121900')).toStrictEqual([['22121900', "format"]]);
})

test("validates maximum correctly", () => {
  expect(validateInput("dealPercentage", 89.6)).toStrictEqual([]);
  expect(validateInput("dealPercentage", 102)).toStrictEqual([[102, "maximum"]]);
})

test("validates minimum correctly", () => {
  expect(validateInput("dealPercentage", 89.6)).toStrictEqual([]);
  expect(validateInput("dealPercentage", -3)).toStrictEqual([[-3, "minimum"]]);
})