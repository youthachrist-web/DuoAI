// Regra de ouro da saúde (B2C): nunca citar termos de diagnóstico direto que
// possam gerar alarmismo. A lista é pequena e explícita de propósito — cada
// termo bloqueado precisa de uma reescrita aprovada, não de uma substituição genérica.

const BLOCKED_TERMS = [
  {
    pattern: /colesterol/gi,
    replacement: "seus indicadores de energia e risco metabólico",
  },
];

/**
 * Verifica se um texto contém termos bloqueados pela regra de compliance B2C.
 * Não reescreve automaticamente por padrão: sinaliza para revisão humana
 * (regra do "último olho" herdada do Método Orion) e devolve uma sugestão de
 * reescrita para quem for revisar aprovar rapidamente.
 */
function checkCompliance(text) {
  const flaggedTerms = [];
  let suggestion = text;

  for (const { pattern, replacement } of BLOCKED_TERMS) {
    if (pattern.test(text)) {
      flaggedTerms.push(pattern.source);
      suggestion = suggestion.replace(pattern, replacement);
    }
  }

  return {
    ok: flaggedTerms.length === 0,
    flaggedTerms,
    suggestion,
  };
}

module.exports = { checkCompliance, BLOCKED_TERMS };
