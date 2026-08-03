// Cliente mínimo para o OmniRoute (github.com/diegosouzapw/OmniRoute), o gateway
// de LLM open-source que substitui chamadas diretas a APIs proprietárias.
// OmniRoute expõe uma API compatível com OpenAI em /v1/chat/completions.

const DEFAULT_BASE_URL = process.env.OMNIROUTE_BASE_URL || "http://localhost:20128/v1";
const DEFAULT_MODEL = process.env.OMNIROUTE_MODEL || "auto";

/**
 * Gera texto via OmniRoute. Se o gateway não estiver acessível (ex.: ambiente
 * de teste/CI sem o OmniRoute rodando), lança um erro identificável para que o
 * chamador decida cair para um template local em vez de travar o fluxo.
 */
async function generateText({ system, prompt, baseUrl = DEFAULT_BASE_URL, model = DEFAULT_MODEL } = {}) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OmniRoute respondeu ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OmniRoute não devolveu conteúdo utilizável");
  }
  return content;
}

module.exports = { generateText, DEFAULT_BASE_URL, DEFAULT_MODEL };
