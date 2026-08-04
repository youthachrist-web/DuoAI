const { pickPack } = require("./packs");
const { checkCompliance } = require("./compliance");
const { generateText } = require("./omniroute-client");
const { draftMessage } = require("./messages");
const { pickWhatsAppNumber } = require("./phone-br");

const SYSTEM_PROMPT = `Você é o DuoAI, assistente operacional da LabDuo, escrevendo uma mensagem de \
WhatsApp humanizada para reengajar um lead da base Worklab. Regra inegociável: nunca use a \
palavra "colesterol". Fale de energia, cansaço, histórico e risco metabólico. Seja breve, \
acolhedor, sem alarmismo, e termine convidando para agendar.`;

function money(value) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/**
 * Gera o rascunho de mensagem B2C para um lead da base Worklab.
 *
 * Três momentos, via `options.kind`: "reativacao" (padrão), "confirmacao" e
 * "resultado". Só a reativação de rotina passa pelo OmniRoute — as outras são
 * transacionais e não devem ser parafraseadas por um modelo, e a trilha de
 * alerta tem uma formulação aprovada que não vale a pena arriscar reescrever.
 *
 * Nada é enviado aqui. O retorno traz um link `wa.me` já preenchido para o
 * operador revisar e disparar do próprio número — é isso que mantém o fluxo
 * dentro dos termos do WhatsApp (um humano aperta enviar) e da LGPD (nenhum
 * dado de saúde é persistido).
 */
async function generateB2CMessage(lead, options = {}) {
  const draft = draftMessage(lead, options);
  const phone = pickWhatsAppNumber(lead.whatsapp);
  const pack = draft.pack || pickPack(lead.queixa || "");

  let text = draft.text;
  let source = "template";

  const canUseLlm = draft.kind === "reativacao" && draft.track === "rotina" && !draft.blocked;
  if (canUseLlm) {
    try {
      text = await generateText({
        system: SYSTEM_PROMPT,
        prompt:
          `Lead: ${lead.nome}. Último exame: ${lead.ultimo_exame || "desconhecido"}. ` +
          `Queixa/sintoma relatado: "${lead.queixa || "não informado"}". Pack recomendado: ` +
          `${pack.nome} (${pack.chamada}), ${money(pack.pix)} no Pix. ` +
          `Escreva a mensagem de WhatsApp.`,
      });
      source = "omniroute";
    } catch {
      // Gateway fora do ar não pode parar o fluxo: o template já é aprovado.
      text = draft.text;
      source = "template";
    }
  }

  // Compliance corre sobre o texto GERADO, não sobre a nossa boa intenção: uma
  // queixa copiada da planilha pode ela mesma trazer um termo proibido.
  const compliance = checkCompliance(text);
  const finalText = compliance.ok ? text : compliance.suggestion;

  let blocked = draft.blocked || null;
  if (!blocked && !phone.waNumber) blocked = `Sem WhatsApp: ${phone.reason}`;
  else if (!blocked && !phone.isMobile) blocked = `Telefone fixo (${phone.formatted}) — sem WhatsApp.`;

  return {
    lead: lead.nome,
    whatsapp: phone.formatted,
    isMobile: phone.isMobile,
    kind: draft.kind,
    track: draft.track,
    pack: pack.nome,
    packPrice: pack.pix,
    source,
    text: finalText,
    compliance,
    blocked,
    // Link pronto para o operador abrir e disparar do próprio número.
    whatsappUrl:
      phone.waNumber && phone.isMobile && !blocked
        ? `https://wa.me/${phone.waNumber}?text=${encodeURIComponent(finalText)}`
        : null,
  };
}

module.exports = { generateB2CMessage };
