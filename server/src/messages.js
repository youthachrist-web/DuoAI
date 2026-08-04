// Os três momentos de WhatsApp da LabDuo, como templates puros (sem LLM).
//
// São transacionais por natureza: uma confirmação de agendamento e um aviso de
// resultado não devem ser parafraseados por um modelo, porque o valor deles está
// exatamente em dizer a mesma coisa, sempre, sem inventar. Só a reativação de
// rotina passa pelo OmniRoute (ver b2c.js) para soar mais natural.
//
// REGRA DE OURO: nenhuma destas mensagens nomeia um exame ou um valor. Quando um
// resultado pede atenção, a mensagem diz que "merece uma conversa com o médico" e
// encaminha para um profissional — nomear seria alarmista e seria uma leitura
// clínica que não estamos fazendo a partir de uma planilha.

const { pickPack } = require("./packs");

/** Os três tipos de mensagem que o operador pode gerar. */
const KINDS = ["reativacao", "confirmacao", "resultado"];

function firstName(full = "") {
  const name = String(full).trim().split(/\s+/)[0] || "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function money(value) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/** Template 1 — reativação, trilha de alerta. */
function reactivationAlert(row, links) {
  const nome = firstName(row.nome);
  const queixa = (row.queixa || "").trim();
  const quando = row.ultimo_exame || "há algum tempo";
  return (
    `Oi, ${nome}! Aqui é o LabDuo 💙\n\n` +
    (queixa
      ? `Você comentou sobre ${queixa.toLowerCase()} — e no seu último exame (${quando}) há um ponto que merece uma conversa com o médico.\n\n`
      : `No seu último exame (${quando}) há um ponto que merece uma conversa com o médico.\n\n`) +
    `Não é motivo pra pânico, mas também não vale deixar pra depois.\n\n` +
    (links.specialistLink ? `👉 Fale agora com um especialista: ${links.specialistLink}\n` : "") +
    `👉 Atualize seus exames: ${links.labLink}`
  );
}

/** Template 1 — reativação, trilha de rotina (com pack e preço no Pix). */
function reactivationRoutine(row, links, pack) {
  const nome = firstName(row.nome);
  return (
    `Oi, ${nome}! Faz um tempinho desde seu último exame no LabDuo` +
    (row.ultimo_exame ? ` (${row.ultimo_exame})` : "") +
    ` — e seu corpo pode ter mudado desde então 😉\n\n` +
    (row.queixa
      ? `Pelo que você comentou (${row.queixa.toLowerCase()}), vale ver como você está hoje.\n\n`
      : `Que tal ver como você está hoje?\n\n`) +
    `Preparamos o ${pack.nome} pensando nesse momento: ${pack.chamada}\n` +
    `Valor no Pix: ${money(pack.pix)}.\n\n` +
    `👉 Agende seu check-up de atualização: ${links.labLink}`
  );
}

/**
 * Template 2 — confirmação / lembrete de agendamento.
 *
 * A data é obrigatória: uma confirmação com o horário em branco é pior do que
 * mensagem nenhuma, então a linha é recusada em vez de ser preenchida com texto.
 */
function confirmation(row, links) {
  if (!row.data_consulta) {
    return {
      text: "",
      blocked:
        "Sem data de agendamento na planilha — a confirmação precisa da coluna " +
        "'data da consulta' (e idealmente 'hora').",
    };
  }
  const nome = firstName(row.nome);
  const quando = row.hora ? `📅 ${row.data_consulta} às ${row.hora}` : `📅 ${row.data_consulta}`;
  const onde = row.unidade ? `📍 ${row.unidade}` : `📍 Atendimento online pela Zapvida`;
  const remarcar = row.link_reagendamento || row.link || links.rescheduleLink;

  return {
    text:
      `Oi, ${nome}! Sua consulta/exame no LabDuo está confirmado ✅\n\n` +
      `${quando}\n${onde}\n\n` +
      `Chegue com 10 minutos de antecedência e leve um documento com foto.\n\n` +
      (remarcar
        ? `👉 Precisa remarcar? Toque aqui: ${remarcar}`
        : `👉 Precisa remarcar? Responda esta mensagem.`),
  };
}

/** Template 3 — resultado disponível, nas duas trilhas. */
function result(row, links) {
  const resultLink = row.link_resultado || row.link || links.resultLink;
  if (!resultLink) {
    return {
      text: "",
      blocked:
        "Sem link de resultado — informe o link do portal do paciente ou " +
        "adicione uma coluna 'link do resultado' na planilha.",
    };
  }
  const nome = firstName(row.nome);
  if (row.alerta) {
    return {
      text:
        `Oi, ${nome}! Seu resultado já está disponível 💙\n\n` +
        `Notamos algo que merece uma conversa com o médico — não é motivo de alarme, ` +
        `mas vale entender melhor com um profissional.\n\n` +
        `👉 Acesse seu resultado e fale com um especialista: ${resultLink}` +
        (links.specialistLink && links.specialistLink !== resultLink
          ? `\n👉 Especialista pela Zapvida: ${links.specialistLink}`
          : ""),
    };
  }
  return {
    text:
      `Oi, ${nome}! Seu resultado já está disponível 💙\n\n` +
      `Está tudo dentro do esperado — parabéns por cuidar da sua saúde!\n\n` +
      `👉 Veja seu resultado completo aqui: ${resultLink}`,
  };
}

/**
 * Escreve a mensagem de uma linha para o momento pedido.
 *
 * Devolve `{ text, blocked, track, pack }`. `blocked` preenchido significa que a
 * planilha não tem o que esse tipo de mensagem exige — quem chama não deve
 * disparar a linha.
 */
function draftMessage(row, options = {}) {
  const kind = KINDS.includes(options.kind) ? options.kind : "reativacao";
  const links = {
    labLink: options.labLink || "https://labduo.com.br",
    specialistLink: options.specialistLink,
    resultLink: options.resultLink,
    rescheduleLink: options.rescheduleLink || options.labLink,
  };
  const pack = pickPack(`${row.queixa || ""} ${row.ultimo_exame || ""}`);
  const track = row.alerta ? "alerta" : "rotina";

  if (kind === "confirmacao") {
    return { kind, track, pack, ...confirmation(row, links) };
  }
  if (kind === "resultado") {
    return { kind, track, pack, ...result(row, links) };
  }
  const text = row.alerta
    ? reactivationAlert(row, links)
    : reactivationRoutine(row, links, pack);
  return { kind, track, pack, text };
}

module.exports = { draftMessage, KINDS, firstName };
