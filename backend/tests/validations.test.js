import { test, expect } from "vitest";
import { validateInput } from "../validations.js";

test("validates type string correctly", () => {
  expect(validateInput("firstName", "string")).toStrictEqual([])
  expect(validateInput("firstName", 256)).toStrictEqual([["firstName", 256, "type"]])
  expect(validateInput("firstName", [])).toStrictEqual([["firstName", [], "type"]])
})

test("validates type number correctly", () => {
  expect(validateInput("category", 256)).toStrictEqual([])
  expect(validateInput("category", "string")).toStrictEqual([["category", "string", "type"]])
  expect(validateInput("category", NaN)).toStrictEqual([["category", NaN, "type"]])
  expect(validateInput("id", parseInt("thisisanid"))).toStrictEqual([["id", parseInt("thisisanid"), "type"]])
})

test("validates type number or null correctly", () => {
  expect(validateInput("paymentId", 256)).toStrictEqual([])
  expect(validateInput("paymentId", null)).toStrictEqual([])
  expect(validateInput("paymentId", "string")).toStrictEqual([["paymentId", "string", "type"]])
  expect(validateInput("paymentId", NaN)).toStrictEqual([["paymentId", NaN, "type"]])
})

test("validates type boolean correctly", () => {
  expect(validateInput("comissions", true)).toStrictEqual([])
  expect(validateInput("comissions", false)).toStrictEqual([])
  expect(validateInput("comissions", "true")).toStrictEqual([["comissions", "true", "type"]])
})

test("validates type datetime correctly", () => {
  expect(validateInput("date", new Date())).toStrictEqual([])
  expect(validateInput("date", new Date("invalid"))).toStrictEqual([['date', new Date("invalid"), "type"]])
  expect(validateInput("date", '22-12-1988')).toStrictEqual([['date', '22-12-1988', "type"]])
})

test("catches empty string", () => {
  expect(validateInput("firstName", "")).toStrictEqual([["firstName", "", "presence"]])
})

test("catches empty input", () => {
  expect(validateInput("firstName", null)).toStrictEqual([["firstName", null, "presence"]])
  expect(validateInput("firstName", undefined)).toStrictEqual([["firstName", undefined, "presence"]])
})

test("validates length correctly", () => {
  expect(validateInput("firstName", "string")).toStrictEqual([])
  expect(validateInput("firstName", "thisstringhasdefinitelymorethanfiftyinlengthIassureyoumygoodsir")).toStrictEqual([["firstName", "thisstringhasdefinitelymorethanfiftyinlengthIassureyoumygoodsir", "length"]])
})

test("validates exact length correctly", () => {
  expect(validateInput("birthday", "22121988")).toStrictEqual([])
  expect(validateInput("birthday", "2212198")).toStrictEqual([["birthday", "2212198", "exactLength"]])
})

test("validates email format correctly", () => {
  expect(validateInput("email", "email@gmail.com")).toStrictEqual([])
  expect(validateInput("email", "thisisarandomstring")).toStrictEqual([["email", 'thisisarandomstring', "format"]])
})

test("validates phone format correctly", () => {
  expect(validateInput("phone", '5561356226')).toStrictEqual([])
  expect(validateInput("phone", "05561356226")).toStrictEqual([["phone", '05561356226', "format"]])
})

test('validates value correctly', () => {
  expect(validateInput("role", "admin")).toStrictEqual([])
  expect(validateInput("role", "author")).toStrictEqual([["role", "author", "value"]])
  expect(validateInput("pasta", "Blanda")).toStrictEqual([])
  expect(validateInput("pasta", "Blandada")).toStrictEqual([["pasta", "Blandada", "value"]])
})

test('validates isbn format correctly', () => {
  expect(validateInput("isbn", '9786075988658')).toStrictEqual([]);
  expect(validateInput("isbn", '9786075')).toStrictEqual([['isbn', '9786075', "format"]])
})

test("validates birthday format correctly", () => {
  expect(validateInput("birthday", '22121988')).toStrictEqual([]);
  expect(validateInput("birthday", '32121988')).toStrictEqual([["birthday", "32121988", "format"]]);
  expect(validateInput("birthday", '22141988')).toStrictEqual([["birthday", '22141988', "format"]]);
  expect(validateInput("birthday", '22122054')).toStrictEqual([["birthday", '22122054', "format"]]);
  expect(validateInput("birthday", '22121900')).toStrictEqual([["birthday", '22121900', "format"]]);
})

test("validates maximum correctly", () => {
  expect(validateInput("dealPercentage", 89.6)).toStrictEqual([]);
  expect(validateInput("dealPercentage", 102)).toStrictEqual([["dealPercentage", 102, "maximum"]]);
})

test("validates minimum correctly", () => {
  expect(validateInput("dealPercentage", 89.6)).toStrictEqual([]);
  expect(validateInput("dealPercentage", -3)).toStrictEqual([["dealPercentage", -3, "minimum"]]);
})

test("validates time ranges correctly", () => {
  expect(validateInput("date", new Date())).toStrictEqual([]);
  expect(validateInput("date", new Date().setFullYear(new Date().getFullYear() + 1))).toStrictEqual([["date", new Date().setFullYear(new Date().getFullYear() + 1), "timerange"]])
})

test("validates range correctly", () => {
  expect(validateInput("regalias", 100.52)).toStrictEqual([]);
  expect(validateInput("regalias", -2563.21)).toStrictEqual([['regalias', -2563.21, "range"]])
})

test("validates clabe format correctly", () => {
  expect(validateInput("clabe", "123456789012345678")).toStrictEqual([]);
  expect(validateInput("clabe", "12345678901234567")).toStrictEqual([['clabe', "12345678901234567", "format"]]);
  expect(validateInput("clabe", "1234567890123456789")).toStrictEqual([['clabe', "1234567890123456789", "format"]]);
  expect(validateInput("clabe", "1234567abc1234567")).toStrictEqual([['clabe', "1234567abc1234567", "format"]]);
})

test("validates swift format correctly", () => {
  expect(validateInput("swift", "DEUTDEFF")).toStrictEqual([]);
  expect(validateInput("swift", "BNMXMXMMXXX")).toStrictEqual([]);
  expect(validateInput("swift", "DEUTDEFFF500")).toStrictEqual([['swift', "DEUTDEFFF500", "format"]]);
  expect(validateInput("swift", "1234DEFF")).toStrictEqual([['swift', "1234DEFF", "format"]]);
})

test("validates type string or null correctly", () => {
  expect(validateInput("isbn", null)).toStrictEqual([])
  expect(validateInput("isbn", "9786078974146")).toStrictEqual([])
  expect(validateInput("isbn", 9786078974146)).toStrictEqual([["isbn", 9786078974146, "type"]])
})