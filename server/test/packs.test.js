const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pickPack, PACKS } = require("../src/packs");

test("matches Mounjaro complaints to the metabolic follow-up pack", () => {
  const pack = pickPack("em tratamento com Mounjaro, quer acompanhar exames");
  assert.equal(pack.id, "mounjaro");
});

test("matches multi-symptom metabolic complaints to the cardiometabolic pack", () => {
  const pack = pickPack("cansaço extremo, ganhou peso e sente a pressão alterada");
  assert.equal(pack.id, "cardiometabolico");
});

test("ties on a single shared tag resolve to the pack declared first", () => {
  // "cansaço" alone is shared by several packs (mulher, cardiometabolico, atleta...);
  // pickPack breaks ties by catalog order, it does not diagnose.
  const pack = pickPack("cansaço constante e sono ruim");
  assert.equal(pack.id, "mulher");
});

test("falls back to the entry pack when nothing matches", () => {
  const pack = pickPack("");
  assert.equal(pack.id, PACKS[0].id);
});

test("an explicit age outranks the tags", () => {
  // "68 anos, várias medicações" matches no tag at all and used to land on the
  // entry pack, which is the wrong recommendation for that patient.
  assert.equal(pickPack("68 anos, várias medicações").id, "melhor-idade");
  assert.equal(pickPack("meu filho de 8 anos").id, "infantil");
  assert.equal(pickPack("72 anos, muito cansaço").id, "melhor-idade");
});
