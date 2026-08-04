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

test("reads a semicolon export with a BOM and accented headers", () => {
  // The Excel pt-BR default, which is what actually comes out of Worklab.
  const csv =
    "﻿Nome;Telefone;Último Exame;Queixa;Alerta\n" +
    "Maria Silva;(11) 98765-4321;10/02/2025;cansaço constante;sim\n" +
    "João Souza;11 3678-7777;03/11/2024;check-up;\n";
  const rows = parseWorklabCSV(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].nome, "Maria Silva");
  assert.equal(rows[0].alerta, true);
  assert.equal(rows[1].alerta, false);
});

test("appointment columns survive the broad 'data' rule", () => {
  const [row] = parseWorklabCSV(
    "nome;telefone;Data da consulta;Hora;Unidade\n" +
      "Maria;11987654321;12/08/2026;09:30;LabDuo Centro\n",
  );
  assert.equal(row.data_consulta, "12/08/2026");
  assert.equal(row.hora, "09:30");
  assert.equal(row.unidade, "LabDuo Centro");
});

test("link columns are told apart by purpose", () => {
  const [row] = parseWorklabCSV(
    "nome;telefone;Link do resultado;Link de reagendamento\n" +
      "Ana;11987654321;https://p.example/r1;https://p.example/g1\n",
  );
  assert.equal(row.link_resultado, "https://p.example/r1");
  assert.equal(row.link_reagendamento, "https://p.example/g1");
});

test("unrecognised columns are kept instead of dropped", () => {
  const [row] = parseWorklabCSV("nome;telefone;Convênio\nAna;11987654321;Unimed\n");
  assert.equal(row.extra["Convênio"], "Unimed");
});

test("a spacer line with no name and no phone is not a patient", () => {
  const rows = parseWorklabCSV("nome;telefone;queixa\nAna;11987654321;rotina\n;;\n");
  assert.equal(rows.length, 1);
});
