const { test } = require("node:test");
const assert = require("node:assert/strict");
const { checkCompliance } = require("../src/compliance");

test("flags 'colesterol' and suggests a compliant rewrite", () => {
  const result = checkCompliance("Vamos falar sobre seu colesterol alto.");
  assert.equal(result.ok, false);
  assert.match(result.suggestion, /seus indicadores de energia e risco metabólico/);
  assert.doesNotMatch(result.suggestion, /colesterol/i);
});

test("passes clean messages untouched", () => {
  const result = checkCompliance("Vamos cuidar da sua energia e bem-estar.");
  assert.equal(result.ok, true);
  assert.equal(result.suggestion, "Vamos cuidar da sua energia e bem-estar.");
});
