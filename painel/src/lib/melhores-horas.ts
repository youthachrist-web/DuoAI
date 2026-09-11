/**
 * A que horas vale a pena escrever a cada setor.
 *
 * Não é um modelo estatístico — é conhecimento de quem já ligou para estas
 * empresas. Uma pedreira começa a lavra ao amanhecer e às 9h já ninguém atende
 * no escritório; um frigorífico tem a manhã inteira tomada pelo abate; uma
 * transportadora só respira depois de a frota sair. Escrever fora da janela não
 * ofende ninguém, apenas não é lido.
 *
 * As janelas são em hora de Brasília, qualquer que seja o fuso de quem vê o
 * painel.
 */

export const FUSO = "America/Sao_Paulo";

export type Janela = { inicioHora: number; fimHora: number; razao: string };

/** Quando o setor não bate com nenhum padrão: horário de escritório. */
export const JANELA_POR_OMISSAO: Janela = {
  inicioHora: 9,
  fimHora: 11,
  razao: "Manhã, horário de escritório — RH e SESMT disponíveis.",
};

const POR_SETOR: [RegExp, Janela][] = [
  [
    /estaleiro|naval|constru[çc][ãa]o naval|shipyard|embarca[çc]/i,
    { inicioHora: 8, fimHora: 10, razao: "Início da manhã, antes do calor e da troca de turno no dique." },
  ],
  [
    /port[uo]|estiva|estivador|mar[ií]tim|doca|terminal portu/i,
    { inicioHora: 9, fimHora: 11, razao: "Manhã — escritório operacional entre as janelas de atracação." },
  ],
  [
    /metalurg|fundi[çc]|siderurg|forja|smelter|a[çc]o/i,
    { inicioHora: 8, fimHora: 10, razao: "Primeiro turno, antes do pico de produção." },
  ],
  [
    /estruturas met[áa]lic|serralh|caldeiraria|carpintaria|marcenaria|madeirei|serrari/i,
    { inicioHora: 8, fimHora: 10, razao: "Início da manhã, antes de a equipa sair para montagem." },
  ],
  [
    /qu[íi]mic|farmac[êe]utic|petroqu[íi]mic|energ[ée]tic|refinari|g[áa]s|tintas/i,
    { inicioHora: 9, fimHora: 11, razao: "Manhã — estrutura corporativa, SESMT no escritório." },
  ],
  [
    /extra[çc][ãa]o|pedreira|mineraç|min[ée]ri|mina|britagem|quarry/i,
    { inicioHora: 7, fimHora: 9, razao: "Muito cedo — a frente de lavra começa ao amanhecer." },
  ],
  [
    /papel|celulose|papelei|cartona/i,
    { inicioHora: 9, fimHora: 11, razao: "Manhã — máquina contínua, administração no escritório." },
  ],
  [
    /res[íi]duo|lixo|limpeza urbana|reciclag|aterro|saneament|efluent|ferro-velho|sucata/i,
    { inicioHora: 9, fimHora: 11, razao: "Depois da coleta da manhã, quando a frota já saiu." },
  ],
  [
    /constru[çc][ãa]o civil|obras|empreiteir|construtora|engenhari|terraplan|pavimenta/i,
    { inicioHora: 7, fimHora: 9, razao: "Bem cedo — engenheiro e mestre de obra antes do canteiro encher." },
  ],
  [
    /log[íi]stic|armaz[ée]|distribui[çc]|dep[óo]sito|transportadora|centro de distribui|warehouse/i,
    { inicioHora: 14, fimHora: 16, razao: "Início da tarde, depois do pico de expedição da manhã." },
  ],
  [
    /transporte|frota|caminh[ãa]o|rodovi[áa]ri|ferrovi[áa]ri|carga pesada|[ôo]nibus/i,
    { inicioHora: 14, fimHora: 16, razao: "Tarde — depois da saída da frota, antes do fecho do dia." },
  ],
  [
    /manuten[çc][ãa]o|eletromec[âa]nic|el[ée]tric|refrigera[çc]|clim|caldeira|automa[çc]/i,
    { inicioHora: 8, fimHora: 10, razao: "Início da manhã, antes de as equipas saírem para chamados." },
  ],
  [
    /aliment|frigor[íi]fic|abatedour|frigor|latic[íi]ni|pescad|cervejari/i,
    { inicioHora: 14, fimHora: 16, razao: "Tarde — a manhã é o pico de abate e produção." },
  ],
  [
    /academia|gin[áa]sio|fitness|crossfit|pilates|musculac|studio de treino/i,
    { inicioHora: 14, fimHora: 17, razao: "Meio da tarde — fora dos picos das 6h e das 18h." },
  ],
  [
    /ind[úu]stri|f[áa]bric|metalomec[âa]nic|manufatur|usinag|transformador|produ[çc][ãa]o/i,
    { inicioHora: 9, fimHora: 11, razao: "Manhã, horário de escritório — RH e SESMT disponíveis." },
  ],
];

export function janelaDoSetor(setor: string | null | undefined): Janela {
  if (setor) {
    for (const [padrao, janela] of POR_SETOR) {
      if (padrao.test(setor)) return janela;
    }
  }
  return JANELA_POR_OMISSAO;
}

export function textoDaJanela(j: Janela): string {
  const h = (n: number) => `${String(n).padStart(2, "0")}h`;
  return `${h(j.inicioHora)}–${h(j.fimHora)}`;
}

/** A hora de Brasília, seja qual for o fuso do aparelho que está a ver o painel. */
export function horaEmBrasilia(quando = new Date()): number {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO,
    hour: "numeric",
    hour12: false,
  }).formatToParts(quando);
  const h = Number(partes.find((p) => p.type === "hour")?.value ?? "0");
  // Meia-noite vem como 24 neste formatador.
  return h === 24 ? 0 : h;
}

export function relogioDeBrasilia(quando = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(quando);
}

export function janelaAberta(j: Janela, quando = new Date()): boolean {
  const h = horaEmBrasilia(quando);
  return h >= j.inicioHora && h < j.fimHora;
}
