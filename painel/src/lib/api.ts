/**
 * Cliente da API do painel da FourLife.
 *
 * O servidor já existia quando este painel foi reescrito, por isso os nomes dos
 * campos são os dele e não se traduzem: renomear aqui só criaria uma segunda
 * verdade sobre a mesma coisa. O que se traduz são os textos que o utilizador lê.
 */

const BASE = "/api";

export class ErroDaApi extends Error {
  constructor(
    readonly estado: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/** Ao fim disto desiste-se: um painel a rodar para sempre não diz nada a ninguém. */
const LIMITE_MS = 45_000;

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  const desistir = AbortSignal.timeout(LIMITE_MS);
  let r: Response;
  try {
    r = await fetch(BASE + caminho, {
      ...init,
      signal: desistir,
      headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
    });
  } catch (e) {
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new ErroDaApi(408, "A API não respondeu a tempo. Tenta outra vez daqui a alguns segundos.");
    }
    throw e;
  }
  if (r.status === 401) {
    // A sessão caiu. Recarregar traz a página de entrada servida pela porta, em
    // vez de deixar o painel a mostrar erros que não explicam nada.
    window.location.reload();
    throw new ErroDaApi(401, "Sessão expirada. Entra outra vez.");
  }
  if (!r.ok) {
    // O servidor responde em JSON quando sabe explicar-se e em HTML quando rebentou.
    const texto = await r.text();
    let mensagem = texto.slice(0, 300);
    try {
      const j = JSON.parse(texto);
      mensagem = j.error ?? j.message ?? mensagem;
    } catch {
      if (mensagem.startsWith("<")) mensagem = `o servidor respondeu ${r.status}`;
    }
    throw new ErroDaApi(r.status, mensagem);
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

const post = <T>(caminho: string, corpo?: unknown) =>
  pedir<T>(caminho, { method: "POST", body: corpo === undefined ? undefined : JSON.stringify(corpo) });

/* ---------------------------------------------------------------- estado */

export type Verificacao = { name: string; ok: boolean; detail?: string };
export type Estado = { status: string; checks: Verificacao[] };
export const estado = () => pedir<Estado>("/status");

export type Fonte = { name: string; ok: boolean; detail?: string };
export const fontes = () => pedir<{ fontes: Fonte[] }>("/sdr/fontes");

/* ------------------------------------------------------------- dashboard */

export type Resumo = {
  totalLeads: number;
  tierALeads: number;
  tierBLeads: number;
  proposalsSent: number;
  videosOpened: number;
  responses: number;
  negotiations: number;
  contractsSent: number;
  paymentsDone: number;
  revenueToday: number;
  revenueMonth: number;
  conversionRate: number;
  dailyRevenueTarget: number;
};
export const resumo = () => pedir<Resumo>("/dashboard/summary");

export type Etapa = { name: string; count: number; value: number };
export const pipeline = () => pedir<{ stages: Etapa[] }>("/dashboard/pipeline");

export type DiaDeReceita = { date: string; revenue: number; leads: number };
export const trajetoria = () => pedir<DiaDeReceita[]>("/dashboard/revenue");

/* --------------------------------------------------------------- agentes */

export type Agente = {
  name: string;
  status: string;
  todayCount: number;
  successCount: number;
  lastRunAt: string | null;
  currentTask?: string | null;
};
export const agentes = () => pedir<Record<string, Agente>>("/agents/status");

export type Actividade = {
  id: number;
  agent: string;
  event: string;
  detail: string | null;
  leadId: number | null;
  businessName: string | null;
  timestamp: string;
};
export const actividade = () => pedir<Actividade[]>("/agents/activity");

export type Origens = {
  total: number;
  contagens: { linkedin: number; mapa: number; porGargalo: Record<string, number> };
};
export const origens = () => pedir<Origens>("/control/lead-origins");

/* ----------------------------------------------------------------- leads */

export type Lead = {
  id: number;
  businessName: string;
  ownerName: string | null;
  niche: string;
  city: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  score: number;
  tier: string;
  stage: string;
  hasSite: boolean | null;
  bottleneck: string | null;
  bottleneckKind: string | null;
  analysisSummary: string | null;
  lastContactedAt: string | null;
  ultimoWhatsApp: string | null;
  linkedinUrl: string | null;
  employeeCount: number | null;
  optOutAt: string | null;
};

export type Facetas = {
  total: number;
  today: number;
  cities: { value: string; count: number }[];
  sectors: { value: string; count: number }[];
  tiers: { value: string; count: number }[];
  contact: { whatsapp: number; telefone: number; email: number };
  uncontacted: number;
};
export const facetas = () => pedir<Facetas>("/leads/facets");
export const leads = (limite = 1000) => pedir<Lead[]>(`/leads?limit=${limite}`);
export const ultimaExportacao = () => pedir<{ at: string | null }>("/leads/last-export");

export const rascunhoDeMensagem = (id: number) =>
  post<{ message: string; ai?: boolean }>(`/leads/${id}/draft-message`);

export const rascunhoDeEmail = (id: number) =>
  post<{ subject: string; body: string; ai?: boolean }>(`/leads/${id}/draft-email`);

export const enviarEmail = (id: number, dados: { subject: string; body: string; email?: string }) =>
  post<{ sent?: boolean; to?: string; error?: string }>(`/leads/${id}/send-email`, dados);

export const procurarDecisor = (id: number) =>
  post<{ decisor?: string | null; detail?: string }>(`/leads/${id}/decisor`);

/* ------------------------------------------------------------- WhatsApp */

export type EstadoWhatsApp = {
  ok: boolean;
  detail: string;
  state: string;
  instancia: string;
  since?: string | null;
  canal?: string | null;
  provider?: string | null;
  envios: { ok: boolean; recusasSeguidas: number; aviso: string | null };
};
export const estadoWhatsApp = () => pedir<EstadoWhatsApp>("/whatsapp/status");

export type CodigoQr = { state: string; image?: string; expiraEmMs?: number; detail?: string };
export const codigoQr = () => pedir<CodigoQr>("/whatsapp/qr");

export type Decisor = { nome: string; cargo?: string | null };

export type ItemDaFila = {
  id: number;
  empresa: string;
  cidade: string;
  setor: string;
  pontuacao: number;
  numero: string;
  numeroFormatado: string | null;
  decisor: Decisor | null;
  mensagem: string;
  url: string;
};
export type Fila = {
  estado: { restantesHoje: number; enviadosHoje: number; tecto: number; esperarMs: number };
  resumo: string;
  itens: ItemDaFila[];
  elegiveis: number;
  postosDeParte: number;
  motivosDeParte?: string;
};
export const fila = (limite = 25) => pedir<Fila>(`/control/fila-whatsapp?limite=${limite}`);

/** O link da conversa, já com a mensagem que está no ecrã. */
export const linkDaConversa = (id: number, mensagem?: string) =>
  post<{ url: string }>(`/leads/${id}/whatsapp-link`, { message: mensagem });

/**
 * Tenta enviar por API. Se o WhatsApp recusar, o servidor devolve na mesma um
 * `url` para abrir a conversa — a copy fica escrita e o envio é à mão.
 */
export const enviarWhatsApp = (id: number, mensagem?: string) =>
  post<{ sent?: boolean; url?: string; aviso?: string; messageId?: string; message?: string }>(
    `/leads/${id}/whatsapp-send`,
    { message: mensagem },
  );

/* --------------------------------------------------------- os interruptores */

export const zerarContactados = () => post<ResultadoDeLimpeza>("/control/reset-contacts");
export const limparRelatorios = () => post<ResultadoDeLimpeza>("/control/reset-reports");

/* ------------------------------------------------------------ prospeção */

export type Corrida = {
  id: number;
  niche: string;
  city: string;
  status: string;
  requestedLimit: number;
  foundCount: number | null;
  importedCount: number | null;
  createdAt: string;
};
export const corridas = () => pedir<Corrida[]>("/prospecting/runs");
export const lancarCorrida = (niche: string, city: string, limit: number) =>
  post<Corrida>("/prospecting/runs", { niche, city, limit });

export type ResumoLinkedin = { quantos: number; recusa: string | null; linhas: string[]; nota?: string };
export const resumoLinkedin = () => pedir<ResumoLinkedin>("/control/resumo-linkedin");

/* ------------------------------------------------- propostas e contratos */

export type Proposta = {
  id: number;
  leadId: number | null;
  packageName?: string | null;
  status: string;
  totalValue?: number | null;
  createdAt?: string;
};
export const propostas = () => pedir<Proposta[]>("/proposals");
export const enviarProposta = (id: number, corpo?: { email: string }) =>
  post<unknown>(`/proposals/${id}/send-email`, corpo ?? {});

export type Contrato = {
  id: number;
  leadId: number | null;
  status: string;
  monthlyValue?: number | null;
  setupFee?: number | null;
  createdAt?: string;
};
export const contratos = () => pedir<Contrato[]>("/contracts");
export const linkDePagamento = (id: number) =>
  post<{ url?: string; error?: string }>(`/contracts/${id}/checkout-session`);
export const confirmarPagamento = (id: number) => post<unknown>(`/contracts/${id}/verify-payment`);

/* ------------------------------------------------------------ relatórios */

export type Relatorio = { id: number; reportDate: string; title: string; markdown: string };
export const relatorios = () => pedir<Relatorio[]>("/reports");
export const gerarRelatorio = () => post<Relatorio>("/reports/generate", {});

/* ------------------------------------------------------------- lembretes */

export type Lembrete = {
  id: number;
  leadId?: number | null;
  message?: string;
  scheduledFor?: string;
  cadence?: string;
  active?: boolean;
};
export const lembretes = () => pedir<Lembrete[]>("/reminders");
export const criarLembrete = (dados: unknown) => post<Lembrete>("/reminders", dados);
export const apagarLembrete = (id: number) => pedir<void>(`/reminders/${id}`, { method: "DELETE" });

/* ------------------------------------------------------------ comunicações */

export type Comunicacao = {
  id: number;
  channel: string;
  direction: string;
  status: string;
  type?: string | null;
  toAddress?: string | null;
  subject?: string | null;
  createdAt?: string;
};
export const comunicacoes = (limite = 50) => pedir<Comunicacao[]>(`/communications?limit=${limite}`);

/* -------------------------------------------------------------- assistente */

export type Conversa = { id: number; title?: string | null; createdAt?: string };
export const conversas = () => pedir<Conversa[]>("/conversations");
export const mensagensDaConversa = (id: number) =>
  pedir<{ id: number; role: string; content: string }[]>(`/conversations/${id}/messages`);
export type Fala = { role: "user" | "assistant"; content: string };

/**
 * Pergunta ao assistente e vai entregando a resposta à medida que ela chega.
 *
 * O servidor responde em fluxo, linha a linha, no formato de eventos do browser:
 * `data: {"content":"..."}` até `data: {"done":true}`. Mostrar só no fim daria
 * uma espera de dezenas de segundos com o ecrã parado.
 */
export async function perguntar(
  mensagens: Fala[],
  aoReceber: (pedaco: string) => void,
  sinal?: AbortSignal,
): Promise<void> {
  const r = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: mensagens }),
    signal: sinal,
  });
  if (r.status === 401) {
    window.location.reload();
    throw new ErroDaApi(401, "sessão terminada");
  }
  if (!r.ok || !r.body) throw new ErroDaApi(r.status, `o servidor respondeu ${r.status}`);

  const leitor = r.body.getReader();
  const descodificar = new TextDecoder();
  let sobra = "";
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    sobra += descodificar.decode(value, { stream: true });
    // Uma linha só chega inteira quando vem o \n; o resto fica para a volta seguinte.
    const linhas = sobra.split("\n");
    sobra = linhas.pop() ?? "";
    for (const linha of linhas) {
      if (!linha.startsWith("data:")) continue;
      const corpo = linha.slice(5).trim();
      if (!corpo) continue;
      try {
        const j = JSON.parse(corpo) as { content?: string; done?: boolean; error?: string };
        if (j.error) throw new Error(j.error);
        if (j.content) aoReceber(j.content);
        if (j.done) return;
      } catch (e) {
        if (e instanceof Error && e.message && !e.message.startsWith("Unexpected")) throw e;
      }
    }
  }
}

export type MensagemWorklab = {
  name: string;
  phone: string | null;
  kind: string;
  track: string;
  pack?: string | null;
  packPrice?: number | null;
  text: string;
  blocked?: string | null;
  whatsappUrl?: string | null;
};

export type BaseWorklab = {
  total: number;
  sendable: number;
  blocked: number;
  messages: MensagemWorklab[];
};

export type LinksWorklab = {
  labLink?: string;
  specialistLink?: string;
  resultLink?: string;
  rescheduleLink?: string;
};

/** O CSV do Worklab. `kind` diz que tipo de mensagem sai de cada linha. */
export async function enviarBaseWorklab(
  ficheiro: File,
  kind: "reativacao" | "confirmacao" | "resultado",
  links: LinksWorklab = {},
): Promise<BaseWorklab> {
  const forma = new FormData();
  forma.append("file", ficheiro);
  forma.append("kind", kind);
  for (const [chave, valor] of Object.entries(links)) {
    if (valor?.trim()) forma.append(chave, valor.trim());
  }
  const r = await fetch(`${BASE}/worklab/upload`, { method: "POST", body: forma });
  if (r.status === 401) {
    window.location.reload();
    throw new ErroDaApi(401, "sessão terminada");
  }
  const texto = await r.text();
  if (!r.ok) {
    let mensagem = `o servidor respondeu ${r.status}`;
    try {
      mensagem = (JSON.parse(texto) as { error?: string }).error ?? mensagem;
    } catch {
      /* fica a mensagem genérica */
    }
    throw new ErroDaApi(r.status, mensagem);
  }
  return JSON.parse(texto) as BaseWorklab;
}

/* ------------------------------------------------- exportação dos leads */

export type FiltrosDeExportacao = {
  period?: "today" | "week" | "month" | "all" | "new";
  cidades?: string[];
  setores?: string[];
  has?: string[];
  tiers?: string[];
  scoreMin?: number;
  naoContactados?: boolean;
};

export function parametrosDeExportacao(f: FiltrosDeExportacao): string {
  const p = new URLSearchParams();
  if (f.period) p.set("period", f.period);
  if (f.cidades?.length) p.set("cidades", f.cidades.join(","));
  if (f.setores?.length) p.set("setores", f.setores.join(","));
  if (f.has?.length) p.set("has", f.has.join(","));
  if (f.tiers?.length) p.set("tiers", f.tiers.join(","));
  if (f.scoreMin && f.scoreMin > 0) p.set("scoreMin", String(f.scoreMin));
  if (f.naoContactados) p.set("naoContactados", "1");
  return p.toString();
}

/**
 * Pede ao servidor a folha de cálculo já filtrada e devolve-a como ficheiro.
 *
 * A exportação é do servidor e não do browser de propósito: ele conhece a base
 * inteira, e o painel só tem em memória o que já carregou. Um ficheiro montado
 * aqui seria uma lista mais curta com o mesmo nome — a pior espécie de erro.
 */
export async function exportarLeads(f: FiltrosDeExportacao): Promise<Blob> {
  const r = await fetch(`${BASE}/leads/export.csv?${parametrosDeExportacao(f)}`);
  if (r.status === 401) {
    window.location.reload();
    throw new ErroDaApi(401, "sessão terminada");
  }
  if (!r.ok) throw new ErroDaApi(r.status, `não consegui baixar: o servidor respondeu ${r.status}`);
  const blob = await r.blob();
  if (blob.size === 0) throw new ErroDaApi(204, "o servidor devolveu um ficheiro vazio");
  return blob;
}

/** Regista o que o lead pediu. Fica na ficha dele e muda a copy seguinte. */
export const registarPedido = (id: number, tipo: string) =>
  post<unknown>(`/leads/${id}/request`, { type: tipo });

export type EstadoDoOutreach = { enabled: boolean; startedAt: string | null };
export const estadoDoOutreach = () => pedir<EstadoDoOutreach>("/control/outreach");
export const mudarOutreach = (enabled: boolean) =>
  post<EstadoDoOutreach>("/control/outreach", { enabled });

export type ResultadoDeLimpeza = {
  leadsLimpos?: number;
  comunicacoesRemovidas?: number;
  followupsRemovidos?: number;
  relatoriosRemovidos?: number;
};

/* ------------------------------------------------------------ transcrição */

export type Transcricao = {
  id: number;
  text?: string;
  language?: string | null;
  source?: string | null;
  createdAt?: string;
};

export const historicoDeTranscricoes = () => pedir<Transcricao[]>("/transcribe/history");

export const transcreverPorUrl = (url: string) => post<Transcricao>("/transcribe/url", { url });

export async function transcreverFicheiro(ficheiro: File): Promise<Transcricao> {
  const forma = new FormData();
  forma.append("file", ficheiro);
  const r = await fetch(`${BASE}/transcribe`, { method: "POST", body: forma });
  if (r.status === 401) {
    window.location.reload();
    throw new ErroDaApi(401, "sessão terminada");
  }
  const texto = await r.text();
  if (!r.ok) {
    let mensagem = `o servidor respondeu ${r.status}`;
    try {
      mensagem = (JSON.parse(texto) as { error?: string }).error ?? mensagem;
    } catch {
      /* fica a mensagem genérica */
    }
    throw new ErroDaApi(r.status, mensagem);
  }
  return JSON.parse(texto) as Transcricao;
}

/* ------------------------------------------------------ caixa de entrada */

export type EmailRecebido = {
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  instruction: string;
};

/** Escreve um rascunho de resposta ao email que foi colado. */
export const rascunharResposta = (recebido: EmailRecebido) =>
  post<{ subject?: string; draft?: string; error?: string }>("/inbox/draft", recebido);

/** Envia a resposta pela Resend. `to` é livre — não precisa de ser um lead. */
export const enviarResposta = (para: string, assunto: string, corpo: string) =>
  post<{ error?: string }>("/inbox/send", { to: para, subject: assunto, body: corpo });

/** Muda o estado de uma proposta — por exemplo, marcá-la como aceite. */
export const actualizarProposta = (id: number, mudanca: Record<string, unknown>) =>
  pedir<Proposta>(`/proposals/${id}`, { method: "PATCH", body: JSON.stringify(mudanca) });

export const apagarConversa = (id: number) =>
  pedir<void>(`/conversations/${id}`, { method: "DELETE" });
