/**
 * O que se pode fazer com o número de uma empresa.
 *
 * No Brasil um celular tem nove dígitos depois do DDD e começa por 9. Um número
 * de oito dígitos é fixo: recebe chamada e não recebe WhatsApp. Escrever para um
 * fixo é uma mensagem que nunca chega e um lead marcado como contactado sem o
 * ter sido — por isso a distinção é feita aqui, e não à vista.
 */

/** Devolve `55DDNNNNNNNNN` se for celular, ou `null` se não for. */
export function normalizarCelular(valor: string | null | undefined): string | null {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  const semPais = digitos.startsWith("55") ? digitos.slice(2) : digitos;
  if (semPais.length !== 11 || semPais[2] !== "9") return null;
  return `55${semPais}`;
}

export function recebeWhatsApp(lead: { whatsapp?: string | null }): boolean {
  return !!lead.whatsapp && normalizarCelular(lead.whatsapp) !== null;
}

export type Sinal = { texto: string; tom: "bom" | "neutro" | "aviso" };

/** Os sinais que aparecem ao lado de cada lead na lista. */
export function sinaisDoLead(lead: {
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
}): Sinal[] {
  const sinais: Sinal[] = [];

  const digitos = String(lead.whatsapp || lead.phone || "").replace(/\D/g, "");
  const semPais = digitos.startsWith("55") ? digitos.slice(2) : digitos;
  const semDdd = semPais.slice(2);

  if (semDdd.length === 9 && semDdd.startsWith("9")) {
    sinais.push({ texto: "Celular · WhatsApp", tom: "bom" });
  } else if (semDdd.length === 8) {
    sinais.push({ texto: "Só fixo · ligar", tom: "aviso" });
  } else {
    sinais.push({ texto: "Sem telefone", tom: "aviso" });
  }

  if (lead.email) sinais.push({ texto: "Tem email", tom: "neutro" });
  if (!lead.website) sinais.push({ texto: "Sem site", tom: "neutro" });
  if (lead.linkedinUrl) sinais.push({ texto: "LinkedIn", tom: "neutro" });

  return sinais;
}
