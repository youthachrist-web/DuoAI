const { generateText } = require("./omniroute-client");

const SYSTEM_PROMPT = `Você é o DuoAI, assistente operacional da LabDuo, escrevendo uma abordagem \
comercial curta para uma clínica/empresa encontrada no Google Maps, propondo parceria em exames \
complementares e saúde ocupacional, e convidando para uma reunião de 15 minutos pelo WhatsApp.`;

function templateMessage(lead, waLink) {
  return (
    `Olá, equipe ${lead.nome}! Aqui é da LabDuo — medicina diagnóstica.\n\n` +
    `Notamos o trabalho de vocês em ${lead.especialidade} e queremos conversar sobre uma parceria: ` +
    `apoio em exames complementares e saúde ocupacional para os pacientes/clientes de vocês, com ` +
    `agendamento facilitado e condições especiais para indicação.\n\n` +
    `Consegue 15 minutos essa semana para uma reunião rápida? Pode falar direto com a nossa equipe ` +
    `comercial por aqui: ${waLink}`
  );
}

/**
 * Gera a abordagem comercial B2B para um lead mapeado no Google Maps.
 * Mesma lógica de fallback do B2C: OmniRoute primeiro, template local se o
 * gateway estiver fora do ar.
 */
async function generateB2BMessage(lead, waLink) {
  let text;
  let source;

  try {
    text = await generateText({
      system: SYSTEM_PROMPT,
      prompt:
        `Empresa: ${lead.nome}. Especialidade: ${lead.especialidade}. ` +
        `Link do WhatsApp comercial da LabDuo para incluir na mensagem: ${waLink}. ` +
        `Escreva a abordagem.`,
    });
    source = "omniroute";
  } catch {
    text = templateMessage(lead, waLink);
    source = "template";
  }

  return {
    lead: lead.nome,
    especialidade: lead.especialidade,
    whatsapp: lead.whatsapp,
    email: lead.email,
    source,
    text,
  };
}

function parseLeadsInput(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nome = "", especialidade = "saúde", whatsapp = "", email = ""] = line
        .split(";")
        .map((s) => s.trim());
      return { nome, especialidade, whatsapp, email };
    });
}

module.exports = { generateB2BMessage, templateMessage, parseLeadsInput };
