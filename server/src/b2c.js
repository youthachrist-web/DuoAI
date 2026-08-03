const { pickPack } = require("./packs");
const { checkCompliance } = require("./compliance");
const { generateText } = require("./omniroute-client");

const SYSTEM_PROMPT = `Você é o DuoAI, assistente operacional da LabDuo, escrevendo uma mensagem de \
WhatsApp humanizada para reengajar um lead da base Worklab. Regra inegociável: nunca use a \
palavra "colesterol". Fale de energia, cansaço, histórico e risco metabólico. Seja breve, \
acolhedor, sem alarmismo, e termine convidando para agendar.`;

function firstName(full = "") {
  return full.trim().split(" ")[0] || "";
}

function templateMessage(lead, pack) {
  const nome = firstName(lead.nome);
  return (
    `Oi, ${nome}! Aqui é da LabDuo 💙\n\n` +
    `Vimos que faz um tempo desde o seu último exame (${lead.ultimo_exame || "há um bom tempo"}) e, ` +
    `pelo que você comentou — "${lead.queixa}" — vale a pena dar uma olhada em como estão seus ` +
    `indicadores de energia e bem-estar antes que isso vire rotina.\n\n` +
    `Preparamos o ${pack.nome} pensando exatamente nesse momento: ${pack.chamada}\n` +
    `Valor no Pix: R$ ${pack.pix.toFixed(2).replace(".", ",")}.\n\n` +
    `Quer que eu já separe um horário pra você? Responde aqui que eu cuido de tudo. 😊`
  );
}

/**
 * Gera o rascunho de mensagem B2C para um lead da base Worklab.
 * Tenta o OmniRoute primeiro (mensagem mais natural); se o gateway não estiver
 * disponível, cai para o template local — nunca falha o fluxo por falta de LLM.
 * Em ambos os casos, o texto passa pela checagem de compliance antes de sair.
 */
async function generateB2CMessage(lead) {
  const pack = pickPack(lead.queixa);
  let text;
  let source;

  try {
    text = await generateText({
      system: SYSTEM_PROMPT,
      prompt:
        `Lead: ${lead.nome}. Último exame: ${lead.ultimo_exame || "desconhecido"}. ` +
        `Queixa/sintoma relatado: "${lead.queixa}". Pack recomendado: ${pack.nome} ` +
        `(${pack.chamada}), R$ ${pack.pix.toFixed(2).replace(".", ",")} no Pix. ` +
        `Escreva a mensagem de WhatsApp.`,
    });
    source = "omniroute";
  } catch {
    text = templateMessage(lead, pack);
    source = "template";
  }

  const compliance = checkCompliance(text);
  return {
    lead: lead.nome,
    whatsapp: lead.whatsapp,
    pack: pack.nome,
    source,
    text: compliance.ok ? text : compliance.suggestion,
    compliance,
  };
}

module.exports = { generateB2CMessage, templateMessage };
