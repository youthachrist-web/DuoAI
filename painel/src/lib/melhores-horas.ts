/**
 * As janelas em que vale a pena escrever a uma empresa.
 *
 * São o horário comercial brasileiro, não um modelo: manhã depois de as pessoas
 * assentarem, e tarde depois do almoço. Está escrito assim, e não como uma
 * previsão, porque não há dados de resposta suficientes para afirmar mais do que
 * isto — e um número inventado num painel é pior do que nenhum.
 */

export type Janela = { nome: string; inicio: number; fim: number };

export const JANELAS: Janela[] = [
  { nome: "Manhã", inicio: 9, fim: 12 },
  { nome: "Tarde", inicio: 14, fim: 18 },
];

/** A hora de Brasília, seja qual for o fuso do aparelho que está a ver o painel. */
export function agoraEmBrasilia(): { hora: number; minuto: number; diaDaSemana: number; texto: string } {
  const f = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const partes = Object.fromEntries(f.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const hora = Number(partes.hour);
  const minuto = Number(partes.minute);

  // O dia da semana vem do formatador para respeitar o fuso, não o do aparelho.
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const curto = (partes.weekday ?? "").toLowerCase().slice(0, 3);
  const diaDaSemana = Math.max(0, dias.indexOf(curto));

  return { hora, minuto, diaDaSemana, texto: `${partes.hour}:${partes.minute}` };
}

export function janelaAberta(janela: Janela, hora: number, diaDaSemana: number): boolean {
  const diaUtil = diaDaSemana >= 1 && diaDaSemana <= 5;
  return diaUtil && hora >= janela.inicio && hora < janela.fim;
}
