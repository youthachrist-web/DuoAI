/**
 * Cliente da API do DuoAI.
 *
 * O servidor já existia quando este painel foi reescrito, por isso os nomes dos
 * campos são os dele e não se traduzem: renomear aqui só criaria uma segunda
 * verdade sobre a mesma coisa. O que se traduz são os textos que o utilizador lê.
 */

const BASE = "/api";

export class ErroDaApi extends Error {
  constructor(readonly estado: number, mensagem: string) {
    super(mensagem);
  }
}

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + caminho, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
  });
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

/* ---------------------------------------------------------------- estado */

export type Verificacao = { name: string; ok: boolean; detail?: string };
export type Estado = { status: "ok" | "degradado" | string; checks: Verificacao[] };
export const estado = () => pedir<Estado>("/status");

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
  lastContactedAt: string | null;
  ultimoWhatsApp: string | null;
  linkedinUrl: string | null;
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

export const leads = (limite = 200) => pedir<Lead[]>(`/leads?limit=${limite}`);

/* ------------------------------------------------------------- WhatsApp */

export type EstadoWhatsApp = {
  ok: boolean;
  detail: string;
  state: string;
  instancia: string;
  envios: { ok: boolean; recusasSeguidas: number; aviso: string | null };
};
export const estadoWhatsApp = () => pedir<EstadoWhatsApp>("/whatsapp/status");

export type CodigoQr = { state: string; image?: string; expiraEmMs?: number; detail?: string };
export const codigoQr = () => pedir<CodigoQr>("/whatsapp/qr");

export type ItemDaFila = {
  id: number;
  empresa: string;
  cidade: string;
  setor: string;
  pontuacao: number;
  numero: string;
  numeroFormatado: string;
  decisor: string | null;
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

/** Devolve o link da conversa. O envio directo depende do WhatsApp estar ligado. */
export const linkDaConversa = (id: number) =>
  pedir<{ url: string; mensagem?: string }>(`/leads/${id}/whatsapp-link`);

export const enviarWhatsApp = (id: number) =>
  pedir<{ sent: boolean; url?: string; usarLink?: boolean; detail?: string }>(
    `/leads/${id}/whatsapp-send`,
    { method: "POST" },
  );

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
  pedir<Corrida>("/prospecting/runs", {
    method: "POST",
    body: JSON.stringify({ niche, city, limit }),
  });

/* ------------------------------------------------------------ relatórios */

export type Relatorio = { id: number; reportDate: string; title: string; markdown: string };
export const relatorios = () => pedir<Relatorio[]>("/reports");

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

export type Actividade = { id: number; agent: string; event: string; detail: string | null; createdAt?: string };
export const actividade = () => pedir<Actividade[]>("/agents/activity");

/* ------------------------------------------------------------- LinkedIn */

export type ResumoLinkedin = { quantos: number; recusa: string | null; linhas: string[]; nota?: string };
export const resumoLinkedin = () => pedir<ResumoLinkedin>("/control/resumo-linkedin");
