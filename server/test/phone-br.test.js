const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseBrazilPhone, pickWhatsAppNumber } = require("../src/phone-br");

test("reads a mobile written the way people actually write it", () => {
  for (const raw of ["(11) 98765-4321", "11987654321", "+55 11 98765-4321", "5511987654321"]) {
    const p = parseBrazilPhone(raw);
    assert.equal(p.waNumber, "5511987654321", raw);
    assert.equal(p.isMobile, true, raw);
  }
});

test("a landline parses but is marked as having no WhatsApp", () => {
  const p = parseBrazilPhone("11 3678-7777");
  assert.equal(p.waNumber, "551136787777");
  assert.equal(p.isMobile, false);
});

test("an invalid area code is rejected rather than dialled", () => {
  const p = parseBrazilPhone("(10) 98765-4321");
  assert.equal(p.waNumber, null);
  assert.match(p.reason, /DDD 10/);
});

test("0800 numbers are not patient WhatsApp numbers", () => {
  assert.equal(parseBrazilPhone("0800 123 4567").waNumber, null);
});

test("a cell with two numbers prefers the mobile", () => {
  const p = pickWhatsAppNumber("11 3678-7777 / 11 98765-4321");
  assert.equal(p.waNumber, "5511987654321");
  assert.equal(p.isMobile, true);
});

test("only a landline available still reports it, flagged", () => {
  const p = pickWhatsAppNumber("11 3678-7777");
  assert.equal(p.isMobile, false);
  assert.equal(p.waNumber, "551136787777");
});

test("an empty cell says so instead of throwing", () => {
  const p = pickWhatsAppNumber("");
  assert.equal(p.waNumber, null);
  assert.match(p.reason, /sem telefone/i);
});
