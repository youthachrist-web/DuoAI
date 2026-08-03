const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseWorklabCSV } = require("../src/worklab-csv");

test("parses Worklab CSV rows, including quoted commas in queixa", () => {
  const csv =
    "nome,whatsapp,ultimo_exame,queixa\n" +
    'Marta Silveira,5511987654321,2025-02-10,"cansaço, sono ruim e queda de energia"';
  const rows = parseWorklabCSV(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].nome, "Marta Silveira");
  assert.equal(rows[0].queixa, "cansaço, sono ruim e queda de energia");
});
