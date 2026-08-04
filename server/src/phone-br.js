// Telefones brasileiros para WhatsApp.
//
// Os números chegam como as pessoas escrevem: "(11) 98765-4321", "11987654321",
// "+55 11 98765-4321", "0800 123 4567". Este módulo transforma isso no que o
// wa.me precisa (só dígitos, sem '+') e diz se o número pode plausivelmente ter
// uma conta de WhatsApp — no Brasil, só celular tem.

const DEFAULT_CC = process.env.DEFAULT_COUNTRY_CODE || "55";

/** DDDs válidos. Qualquer outro é erro de digitação ou não é telefone. */
const BR_AREA_CODES = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/**
 * Interpreta um número brasileiro.
 *
 * Celular: 9 dígitos começando em 9. Fixo: 8 dígitos começando em 2–5.
 * Devolve `null` quando não dá para tratar como telefone atendível.
 */
function parseBrazilPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;

  // 0800/0300 e afins não recebem WhatsApp e não são de paciente.
  if (/^0(800|300|500)/.test(digits)) {
    return { waNumber: null, formatted: digits, isMobile: false, reason: "número 0800/0300" };
  }

  let local = digits;
  if (local.startsWith(DEFAULT_CC) && local.length > 11) local = local.slice(DEFAULT_CC.length);
  // Prefixo de operadora para interurbano ("0 11 9...").
  if (local.length > 11 && local.startsWith("0")) local = local.replace(/^0+/, "");

  if (local.length < 10 || local.length > 11) {
    return { waNumber: null, formatted: digits, isMobile: false, reason: "quantidade de dígitos inválida" };
  }

  const ddd = Number(local.slice(0, 2));
  if (!BR_AREA_CODES.has(ddd)) {
    return { waNumber: null, formatted: digits, isMobile: false, reason: `DDD ${ddd} inexistente` };
  }

  const subscriber = local.slice(2);
  const isMobile = subscriber.length === 9 && subscriber.startsWith("9");
  const isLandline = subscriber.length === 8 && /^[2-5]/.test(subscriber);
  if (!isMobile && !isLandline) {
    return { waNumber: null, formatted: digits, isMobile: false, reason: "não parece celular nem fixo" };
  }

  const waNumber = `${DEFAULT_CC}${local}`;
  const formatted = `+${DEFAULT_CC} ${local.slice(0, 2)} ${subscriber.slice(0, subscriber.length - 4)}-${subscriber.slice(-4)}`;
  return { waNumber, formatted, isMobile, reason: isMobile ? "celular" : "fixo" };
}

/**
 * Escolhe o melhor número de uma célula que pode conter vários.
 * Prefere celular; só devolve fixo quando não há celular nenhum, e nesse caso
 * `isMobile` fica false para quem chama saber que não dá disparo.
 */
function pickWhatsAppNumber(raw) {
  const candidates = String(raw || "")
    .split(/[\/|,;]+|\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (candidates.length === 0) {
    return { waNumber: null, formatted: null, isMobile: false, reason: "sem telefone na planilha" };
  }

  const parsed = candidates.map(parseBrazilPhone).filter(Boolean);
  const mobile = parsed.find((p) => p.isMobile);
  if (mobile) return mobile;
  const landline = parsed.find((p) => p.waNumber);
  if (landline) return landline;
  return parsed[0] || { waNumber: null, formatted: null, isMobile: false, reason: "telefone ilegível" };
}

module.exports = { parseBrazilPhone, pickWhatsAppNumber, BR_AREA_CODES };
