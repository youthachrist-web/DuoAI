const { test } = require("node:test");
const assert = require("node:assert/strict");
const { draftMessage } = require("../src/messages");
const { parseWorklabCSV } = require("../src/worklab-csv");

const LINKS = {
  labLink: "https://labduo.com.br/agendar",
  specialistLink: "https://zapvida.example/atendimento",
  resultLink: "https://labduo.com.br/resultado",
  rescheduleLink: "https://labduo.com.br/reagendar",
};

test("the reactivation alert routes to a specialist and names no exam", () => {
  const [row] = parseWorklabCSV(
    "nome;telefone;último exame;queixa;alerta\n" +
      "Maria Silva;11987654321;10/02/2025;cansaço constante;sim\n",
  );
  const d = draftMessage(row, LINKS);
  assert.equal(d.kind, "reativacao");
  assert.equal(d.track, "alerta");
  assert.match(d.text, /merece uma conversa com o médico/);
  assert.match(d.text, /zapvida/);
  assert.doesNotMatch(d.text, /colesterol|triglicer|diabet/i);
});

test("the routine reactivation carries a pack and its Pix price", () => {
  const [row] = parseWorklabCSV(
    "nome;telefone;último exame;queixa\nJoão Souza;11987654321;03/11/2024;check-up de rotina\n",
  );
  const d = draftMessage(row, LINKS);
  assert.equal(d.track, "rotina");
  assert.match(d.text, /R\$ \d+,\d{2}/);
  assert.match(d.text, /Agende seu check-up/);
});

test("the confirmation carries date and place, and never a price", () => {
  const [row] = parseWorklabCSV(
    "nome;telefone;Data da consulta;Hora;Unidade\n" +
      "Maria Silva;11987654321;12/08/2026;09:30;LabDuo Centro\n",
  );
  const d = draftMessage(row, { ...LINKS, kind: "confirmacao" });
  assert.equal(d.blocked, undefined);
  assert.match(d.text, /está confirmado/);
  assert.match(d.text, /12\/08\/2026 às 09:30/);
  assert.match(d.text, /LabDuo Centro/);
  assert.doesNotMatch(d.text, /R\$/);
});

test("a confirmation with no date is refused instead of sent half-empty", () => {
  const [row] = parseWorklabCSV("nome;telefone\nMaria Silva;11987654321\n");
  const d = draftMessage(row, { ...LINKS, kind: "confirmacao" });
  assert.match(d.blocked, /data de agendamento/i);
});

test("no unit falls back to the online Zapvida service", () => {
  const [row] = parseWorklabCSV(
    "nome;telefone;data da consulta;hora\nMaria;11987654321;12/08/2026;09:30\n",
  );
  const d = draftMessage(row, { ...LINKS, kind: "confirmacao" });
  assert.match(d.text, /Atendimento online pela Zapvida/);
});

test("the result alert hands off to a professional without naming a finding", () => {
  const [row] = parseWorklabCSV("nome;telefone;alerta\nMaria Silva;11987654321;sim\n");
  const d = draftMessage(row, { ...LINKS, kind: "resultado" });
  assert.equal(d.track, "alerta");
  assert.match(d.text, /merece uma conversa com o médico/);
  assert.doesNotMatch(d.text, /colesterol|triglicer|diabet/i);
});

test("a clean result congratulates, with no upsell", () => {
  const [row] = parseWorklabCSV("nome;telefone\nJoão Souza;11987654321\n");
  const d = draftMessage(row, { ...LINKS, kind: "resultado" });
  assert.match(d.text, /dentro do esperado/);
  assert.doesNotMatch(d.text, /R\$/);
});

test("no result link anywhere blocks the row", () => {
  const [row] = parseWorklabCSV("nome;telefone\nAna;11987654321\n");
  const d = draftMessage(row, { ...LINKS, kind: "resultado", resultLink: undefined });
  assert.match(d.blocked, /link de resultado/i);
});

test("a result link is never reused as the rescheduling link", () => {
  // Caught in a production run of the sibling app: the confirmation told the
  // patient to reschedule at their own result URL.
  const [row] = parseWorklabCSV(
    "nome;telefone;data da consulta;hora;Link do resultado\n" +
      "Ana;11987654321;12/08/2026;09:30;https://portal.labduo.com.br/a1b2\n",
  );
  const d = draftMessage(row, { ...LINKS, kind: "confirmacao" });
  assert.match(d.text, /labduo\.com\.br\/reagendar/);
  assert.doesNotMatch(d.text, /a1b2/);
});

test("a per-patient result link wins over the global one", () => {
  const [row] = parseWorklabCSV(
    "nome;telefone;Link do resultado\nAna;11987654321;https://portal.labduo.com.br/a1b2\n",
  );
  const d = draftMessage(row, { ...LINKS, kind: "resultado" });
  assert.match(d.text, /a1b2/);
});

test("an unknown kind falls back to the reactivation blast", () => {
  const [row] = parseWorklabCSV("nome;telefone;queixa\nAna;11987654321;rotina\n");
  assert.equal(draftMessage(row, { ...LINKS, kind: "qualquer-coisa" }).kind, "reativacao");
});
