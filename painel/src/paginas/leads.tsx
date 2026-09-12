import { useEffect, useMemo, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero, data } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio, campo } from "../componentes/base";
import { TIPOS_DE_PEDIDO } from "../lib/nichos";
import { janelaAberta, janelaDoSetor, textoDaJanela } from "../lib/melhores-horas";
import { normalizarCelular, sinaisDoLead } from "../lib/telefone";
import { buscarFicheiro, guardarFicheiro, type Destino, type Ficheiro } from "../lib/ficheiro";

/* Os valores são os que o servidor entende. "since-last" tem de ser escrito
   assim: qualquer outra palavra passa despercebida e ele devolve a base toda —
   um ficheiro que parece o certo e não é. */
const PERIODOS = [
  { valor: "since-last", nome: "Novos desde o último download" },
  { valor: "today", nome: "Só os de hoje" },
  { valor: "week", nome: "Desta semana" },
  { valor: "month", nome: "Deste mês" },
  { valor: "all", nome: "Toda a base de leads" },
] as const;

type Periodo = (typeof PERIODOS)[number]["valor"];

/* ------------------------------------------------------- filtros lado a lado */

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-borda py-3 first:pt-0 last:border-0">
      <p className="etiqueta mb-2">{titulo}</p>
      {children}
    </div>
  );
}

function ListaDeMarcas({
  opcoes,
  escolhidas,
  aoMudar,
  altura = "max-h-44",
}: {
  opcoes: { value: string; count: number }[];
  escolhidas: string[];
  aoMudar: (v: string[]) => void;
  altura?: string;
}) {
  if (!opcoes.length) return <p className="text-xs text-suave">Nada mapeado ainda.</p>;
  return (
    <>
      <div className="mb-1.5 flex gap-3 text-xs">
        <button type="button" className="text-turquesa" onClick={() => aoMudar(opcoes.map((o) => o.value))}>
          selecionar tudo
        </button>
        <button type="button" className="text-suave" onClick={() => aoMudar([])}>
          limpar
        </button>
      </div>
      <div className={`${altura} space-y-1 overflow-y-auto pr-1`}>
        {opcoes.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 accent-turquesa"
              checked={escolhidas.includes(o.value)}
              onChange={(e) =>
                aoMudar(
                  e.target.checked
                    ? [...escolhidas, o.value]
                    : escolhidas.filter((v) => v !== o.value),
                )
              }
            />
            <span className="min-w-0 flex-1 truncate">{o.value}</span>
            <span className="shrink-0 font-mono text-xs text-tenue">{o.count}</span>
          </label>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------ a copy do lead */

function Copy({ lead, aoFechar }: { lead: api.Lead; aoFechar: () => void }) {
  const [texto, definirTexto] = useState<string | null>(null);
  const [aCarregar, definirACarregar] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);
  const [copiado, definirCopiado] = useState(false);
  const [pedido, definirPedido] = useState<string>("");
  const [notaDoPedido, definirNotaDoPedido] = useState<string | null>(null);

  const janela = janelaDoSetor(lead.niche);
  const boaHora = janelaAberta(janela);

  async function gerar() {
    definirErro(null);
    definirACarregar(true);
    try {
      const r = await api.rascunhoDeMensagem(lead.id);
      definirTexto(r.message ?? "");
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirACarregar(false);
    }
  }

  async function disparar() {
    definirErro(null);
    // A janela abre antes de qualquer espera, senão o browser bloqueia-a como popup.
    const nova = window.open("", "_blank", "noopener");
    try {
      const r = await api.linkDaConversa(lead.id, texto ?? undefined);
      if (r.url && nova) nova.location.href = r.url;
      else {
        nova?.close();
        definirErro("Este lead não tem número — usa o email ou procura o contacto no site.");
      }
    } catch (e) {
      nova?.close();
      definirErro(e instanceof Error ? e.message : String(e));
    }
  }

  async function registar() {
    if (!pedido) return;
    definirErro(null);
    try {
      await api.registarPedido(lead.id, pedido);
      definirNotaDoPedido("Pedido registado.");
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    }
  }

  // A copy pede-se uma vez, ao abrir. Chamar isto durante o render fazia um ciclo.
  useEffect(() => {
    void gerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onClick={aoFechar}
    >
      <div
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-borda bg-cartao sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-borda px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-semibold leading-snug">{lead.businessName}</h2>
            <p className="text-xs text-suave">
              {lead.city} · {lead.niche}
            </p>
          </div>
          <button type="button" onClick={aoFechar} className="etiqueta shrink-0">
            fechar
          </button>
        </header>

        <div className="space-y-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${boaHora ? "border-turquesa bg-turquesa-tenue text-turquesa" : "border-borda text-suave"}`}>
            <strong>{textoDaJanela(janela)}</strong> · {janela.razao}
            {boaHora && " É boa hora agora."}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="etiqueta">Copy modelada para o setor</p>
              <div className="flex gap-2">
                <Botao pequeno variante="contorno" onClick={gerar} disabled={aCarregar}>
                  {aCarregar ? "a escrever…" : "Regerar"}
                </Botao>
                <Botao
                  pequeno
                  variante="contorno"
                  disabled={!texto}
                  onClick={async () => {
                    if (!texto) return;
                    await navigator.clipboard.writeText(texto);
                    definirCopiado(true);
                    setTimeout(() => definirCopiado(false), 1800);
                  }}
                >
                  {copiado ? "copiado" : "copiar"}
                </Botao>
              </div>
            </div>
            {aCarregar && texto === null ? (
              <ACarregar>a modelar a copy…</ACarregar>
            ) : (
              <p className="whitespace-pre-wrap rounded-xl bg-fundo p-3 text-sm leading-relaxed">
                {texto || "O servidor não devolveu texto."}
              </p>
            )}
          </div>

          {erro && <Aviso tom="erro">{erro}</Aviso>}

          {(() => {
            const celular = normalizarCelular(lead.whatsapp ?? lead.phone);
            const temAlgum = !!(lead.whatsapp || lead.phone);
            return (
              <>
                <Botao onClick={disparar} className="w-full" disabled={!celular}>
                  <I.Conversa className="h-4 w-4" />
                  {celular
                    ? "DISPARAR NO WHATSAPP"
                    : temAlgum
                      ? "Sem celular — este número não recebe WhatsApp"
                      : "Sem nº telemóvel associado"}
                </Botao>
                <p className="text-center text-xs text-suave">
                  {celular
                    ? "O WhatsApp abre com o texto pronto; és tu que confirmas o envio."
                    : "Este lead não tem número de celular — usa o email ou procura o contacto no site."}
                </p>
              </>
            );
          })()}

          <div className="border-t border-borda pt-4">
            <p className="etiqueta mb-2">Registar interesse / pedido do lead</p>
            <div className="flex gap-2">
              <select className={campo} value={pedido} onChange={(e) => definirPedido(e.target.value)}>
                <option value="">Escolher…</option>
                {TIPOS_DE_PEDIDO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.nome}
                  </option>
                ))}
              </select>
              <Botao variante="contorno" onClick={registar} disabled={!pedido}>
                Registar
              </Botao>
            </div>
            {notaDoPedido && <p className="mt-2 text-sm text-bom">{notaDoPedido}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------- o diálogo de download */

function Download({
  filtros,
  quantos,
  activos,
  limparFiltros,
  aoFechar,
  painelDeFiltros,
}: {
  filtros: api.FiltrosDeExportacao;
  quantos: number;
  /** Quantos filtros estão ligados, para se poder limpá-los daqui. */
  activos: number;
  limparFiltros: () => void;
  aoFechar: () => void;
  painelDeFiltros: React.ReactNode;
}) {
  const [aBaixar, definirABaixar] = useState<api.FormatoDeExportacao | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [ficheiro, definirFicheiro] = useState<Ficheiro | null>(null);
  const [destino, definirDestino] = useState<Destino | null>(null);

  async function baixar(formato: api.FormatoDeExportacao) {
    definirErro(null);
    definirDestino(null);
    definirABaixar(formato);
    try {
      const f = await buscarFicheiro(
        api.enderecoDaExportacao(formato, filtros),
        `fourlife-leads.${formato}`,
      );
      definirFicheiro(f);
      // Entrega logo: no telemóvel, o menu de partilha só abre enquanto o toque
      // do botão ainda conta como gesto do utilizador.
      try {
        definirDestino(await guardarFicheiro(f));
      } catch {
        definirDestino(null);
      }
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirABaixar(null);
    }
  }

  async function guardarOutraVez() {
    if (!ficheiro) return;
    try {
      definirDestino(await guardarFicheiro(ficheiro));
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    }
  }

  const vazio = quantos === 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onClick={aoFechar}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-borda bg-cartao sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-borda px-4 py-3">
          <div>
            <h2 className="titulo font-bold">Baixar lista</h2>
            <p className="text-xs text-suave">Escolhe o que entra no ficheiro antes de guardar.</p>
          </div>
          <button type="button" onClick={aoFechar} className="etiqueta shrink-0">
            fechar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">{painelDeFiltros}</div>

        <div className="border-t border-borda p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {erro && (
            <div className="mb-3">
              <Aviso tom="erro">Não foi possível baixar: {erro}</Aviso>
            </div>
          )}

          {ficheiro && (
            <div className="mb-3 flex flex-col gap-2 rounded-xl border border-borda bg-fundo p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-sm">
                <p className="flex items-center gap-1.5 font-semibold">
                  <I.Documento className="h-3.5 w-3.5 shrink-0 text-turquesa" />
                  <span className="min-w-0 truncate">{ficheiro.nome}</span>
                </p>
                <p className="text-xs text-suave">
                  {ficheiro.tamanho}
                  {destino === "download" && " · guardado nos teus downloads"}
                  {destino === "share" && " · entregue ao menu de partilha"}
                  {destino === null && " · toca em guardar para escolher onde"}
                </p>
              </div>
              <Botao variante="contorno" pequeno onClick={() => void guardarOutraVez()}>
                <I.Descarregar className="h-4 w-4" />
                {destino === null ? "Guardar ficheiro" : "Guardar outra vez"}
              </Botao>
            </div>
          )}

          <p className="mb-2 text-sm">
            <b className="numero text-lg">{numero(quantos)}</b>{" "}
            <span className="text-suave">
              {quantos === 1 ? "empresa entra no ficheiro" : "empresas entram no ficheiro"}
            </span>
            {activos > 0 && (
              <button
                type="button"
                onClick={limparFiltros}
                className="ml-3 text-xs text-suave underline hover:text-texto"
              >
                limpar filtros
              </button>
            )}
          </p>

          {/* Dois formatos porque servem duas coisas: a folha é para trabalhar a
              lista, o Word é o dossier que se leva impresso para a reunião. */}
          <div className="grid grid-cols-2 gap-2">
            <Botao
              variante="contorno"
              onClick={() => void baixar("csv")}
              disabled={vazio || aBaixar !== null}
            >
              <I.Tabela className="h-4 w-4" />
              CSV
            </Botao>
            <Botao onClick={() => void baixar("docx")} disabled={vazio || aBaixar !== null}>
              <I.Documento className="h-4 w-4" />
              Word
            </Botao>
          </div>

          {aBaixar !== null && (
            <p className="mt-2 text-xs text-suave">
              {aBaixar === "docx"
                ? `A montar o dossier de ${numero(quantos)} ${quantos === 1 ? "empresa" : "empresas"} em Word — pode levar alguns segundos.`
                : "A preparar a folha de cálculo…"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ página */

export function Leads() {
  const lista = usarDados(() => api.leads(2000), { intervaloMs: 180_000 });
  const facetas = usarDados(api.facetas, { intervaloMs: 180_000 });
  const exportacao = usarDados(api.ultimaExportacao);

  const [procura, definirProcura] = useState("");
  const [periodo, definirPeriodo] = useState<Periodo>("all");
  const [cidades, definirCidades] = useState<string[]>([]);
  const [setores, definirSetores] = useState<string[]>([]);
  const [tiers, definirTiers] = useState<string[]>([]);
  const [contacto, definirContacto] = useState<string[]>([]);
  const [site, definirSite] = useState<"" | "sim" | "nao">("");
  const [scoreMin, definirScoreMin] = useState(0);
  const [naoContactados, definirNaoContactados] = useState(false);
  const [quantos, definirQuantos] = useState(50);
  const [aberto, definirAberto] = useState<api.Lead | null>(null);
  const [filtrosAbertos, definirFiltrosAbertos] = useState(false);
  const [downloadAberto, definirDownloadAberto] = useState(false);

  const filtros: api.FiltrosDeExportacao = {
    period: periodo,
    cidades,
    setores,
    tiers,
    has: contacto,
    scoreMin,
    naoContactados,
  };

  const filtrados = useMemo(() => {
    const p = procura.trim().toLowerCase();
    return (lista.dados ?? []).filter((l) => {
      if (cidades.length && !cidades.includes(l.city)) return false;
      if (setores.length && !setores.includes(l.niche)) return false;
      if (tiers.length && !tiers.includes(l.tier)) return false;
      if (scoreMin && l.score < scoreMin) return false;
      if (naoContactados && l.lastContactedAt) return false;
      if (site === "sim" && !l.website) return false;
      if (site === "nao" && l.website) return false;
      if (contacto.includes("whatsapp") && !l.whatsapp) return false;
      if (contacto.includes("email") && !l.email) return false;
      if (contacto.includes("telefone") && !l.phone && !l.whatsapp) return false;
      if (!p) return true;
      return (
        l.businessName.toLowerCase().includes(p) ||
        (l.email ?? "").toLowerCase().includes(p) ||
        (l.city ?? "").toLowerCase().includes(p) ||
        (l.phone ?? "").includes(p) ||
        (l.whatsapp ?? "").includes(p)
      );
    });
  }, [lista.dados, procura, cidades, setores, tiers, contacto, site, scoreMin, naoContactados]);

  const nFiltros =
    cidades.length +
    setores.length +
    tiers.length +
    contacto.length +
    (site ? 1 : 0) +
    (scoreMin ? 1 : 0) +
    (periodo !== "all" ? 1 : 0) +
    (naoContactados ? 1 : 0);

  function limparFiltros() {
    definirPeriodo("all");
    definirCidades([]);
    definirSetores([]);
    definirTiers([]);
    definirContacto([]);
    definirSite("");
    definirScoreMin(0);
    definirNaoContactados(false);
  }

  /* A data a partir da qual o período deixa entrar os leads. O diálogo de
     download tem de contar pelo mesmo critério do servidor, senão anuncia um
     número e o ficheiro traz outro — e aí não se sabe qual está errado. */
  const desde = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (periodo === "today") return hoje;
    if (periodo === "week") {
      const diasDesdeSegunda = (hoje.getDay() + 6) % 7;
      return new Date(hoje.getTime() - diasDesdeSegunda * 86_400_000);
    }
    if (periodo === "month") return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    if (periodo === "since-last" && exportacao.dados?.at) return new Date(exportacao.dados.at);
    return null;
  }, [periodo, exportacao.dados?.at]);

  /* O que entra mesmo no ficheiro: os filtros todos, mais o período, menos
     quem pediu para não ser contactado — que o servidor nunca exporta. */
  const paraOFicheiro = useMemo(
    () =>
      filtrados.filter(
        (l) => !l.optOutAt && !(desde && l.createdAt && new Date(l.createdAt) < desde),
      ).length,
    [filtrados, desde],
  );

  const painelDeFiltros = (
    <div className="rounded-2xl border border-borda bg-cartao p-4">
      <Grupo titulo="Período">
        <select className={campo} value={periodo} onChange={(e) => definirPeriodo(e.target.value as Periodo)}>
          {PERIODOS.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.nome}
            </option>
          ))}
        </select>
      </Grupo>

      <Grupo titulo="Cidade">
        <ListaDeMarcas opcoes={facetas.dados?.cities ?? []} escolhidas={cidades} aoMudar={definirCidades} />
      </Grupo>

      <Grupo titulo="Setor">
        <ListaDeMarcas opcoes={facetas.dados?.sectors ?? []} escolhidas={setores} aoMudar={definirSetores} />
      </Grupo>

      <Grupo titulo="Tier">
        <ListaDeMarcas
          opcoes={facetas.dados?.tiers ?? []}
          escolhidas={tiers}
          aoMudar={definirTiers}
          altura="max-h-28"
        />
      </Grupo>

      <Grupo titulo="Contacto">
        {(
          [
            ["whatsapp", "Com WhatsApp"],
            ["email", "Com email"],
            ["telefone", "Com telefone"],
          ] as const
        ).map(([v, nome]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-turquesa"
              checked={contacto.includes(v)}
              onChange={(e) =>
                definirContacto(e.target.checked ? [...contacto, v] : contacto.filter((c) => c !== v))
              }
            />
            {nome}
          </label>
        ))}
        <label className="mt-1 flex cursor-pointer items-center gap-2 py-0.5 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-turquesa"
            checked={naoContactados}
            onChange={(e) => definirNaoContactados(e.target.checked)}
          />
          Ainda não contactados
        </label>
      </Grupo>

      <Grupo titulo="Site">
        <select className={campo} value={site} onChange={(e) => definirSite(e.target.value as "" | "sim" | "nao")}>
          <option value="">Tanto faz</option>
          <option value="sim">Com site</option>
          <option value="nao">Sem site</option>
        </select>
      </Grupo>

      <Grupo titulo={`Score mínimo${scoreMin ? `: ${scoreMin}` : ""}`}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={scoreMin}
          onChange={(e) => definirScoreMin(Number(e.target.value))}
          className="w-full accent-turquesa"
        />
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
          {(
            [
              [0, "Qualquer score"],
              [50, "50 ou mais"],
              [65, "65 ou mais"],
              [80, "80 ou mais — só os mais quentes"],
            ] as const
          ).map(
            ([v, nome]) => (
              <button
                key={v}
                type="button"
                onClick={() => definirScoreMin(v)}
                className={scoreMin === v ? "font-semibold text-turquesa" : "text-suave"}
              >
                {nome}
              </button>
            ),
          )}
        </div>
      </Grupo>

      {nFiltros > 0 && (
        <div className="pt-3">
          <Botao
            variante="contorno"
            pequeno
            onClick={limparFiltros}
          >
            Limpar filtros ({nFiltros})
          </Botao>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Pipeline B2B · SST"
        descricao="Empresas de risco operacional mapeadas em Santa Catarina, Rio Grande do Sul e São Paulo. Abre a copy para ver a mensagem já modelada para o setor e disparar."
      />

      <Cartao>
        <div className="flex flex-wrap items-center gap-2">
          <Botao variante="contorno" onClick={() => definirDownloadAberto(true)}>
            <I.Descarregar className="h-4 w-4" />
            Baixar lista
          </Botao>
          <span className="text-xs text-suave">
            {exportacao.dados?.at
              ? `Último download: ${data(exportacao.dados.at)}`
              : exportacao.aCarregar
                ? "A ver quando foi o último download…"
                : "Ainda não houve nenhum download — desta vez sai a base toda."}
          </span>
        </div>
        <div className="relative mt-3">
          <I.Lupa className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" />
          <input
            className={`${campo} pl-9`}
            placeholder="Procurar empresa, email, número"
            value={procura}
            onChange={(e) => definirProcura(e.target.value)}
          />
        </div>

        <div className="mt-2 lg:hidden">
          <Botao variante="contorno" pequeno onClick={() => definirFiltrosAbertos((a) => !a)}>
            {filtrosAbertos ? "Esconder filtros" : `Filtros${nFiltros ? ` (${nFiltros})` : ""}`}
          </Botao>
        </div>
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className={filtrosAbertos ? "" : "hidden lg:block"}>{painelDeFiltros}</div>

        <Cartao
          titulo={`${numero(filtrados.length)} de ${numero(lista.dados?.length ?? 0)} leads`}
          semPadding
        >
          {lista.aCarregar && !lista.dados ? (
            <ACarregar>A carregar a lista — podes baixar já, o servidor tem os mesmos dados.</ACarregar>
          ) : !filtrados.length ? (
            <Vazio>Nenhum lead corresponde a estes filtros.</Vazio>
          ) : (
            <>
              <ul className="divide-y divide-borda/60">
                {filtrados.slice(0, quantos).map((l) => (
                  <li key={l.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{l.businessName}</p>
                        <p className="mt-0.5 text-xs text-suave">
                          {l.city} · {l.niche}
                          {l.stage && l.stage !== "identified" && ` · ${l.stage}`}
                        </p>
                        <p className="mt-1 font-mono text-xs text-suave">
                          {l.whatsapp ?? l.phone ?? l.email ?? "sem contacto"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {sinaisDoLead(l).map((s) => (
                            <Selo key={s.texto} tom={s.tom}>
                              {s.texto}
                            </Selo>
                          ))}
                          {/* A hora do setor decide mais disparos do que a copy:
                              ligar à pedreira às três da tarde é falar com ninguém. */}
                          {janelaAberta(janelaDoSetor(l.niche)) && (
                            <Selo tom="turquesa">boa hora agora</Selo>
                          )}
                          {l.googleRating !== null && (
                            <Selo tom="neutro">
                              ★ {l.googleRating}
                              {l.googleReviewCount ? ` (${numero(l.googleReviewCount)})` : ""}
                            </Selo>
                          )}
                          {l.lastContactedAt ? (
                            <Selo tom="turquesa">falámos em {data(l.lastContactedAt)}</Selo>
                          ) : (
                            <Selo tom="aviso">por contactar</Selo>
                          )}
                        </div>
                        {l.bottleneck && (
                          <p className="mt-2 text-xs leading-relaxed text-suave">{l.bottleneck}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Selo tom={l.tier === "A" ? "turquesa" : "neutro"}>
                          {l.score} · {l.tier}
                        </Selo>
                        <Botao pequeno onClick={() => definirAberto(l)}>
                          Ver copy
                        </Botao>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {filtrados.length > quantos && (
                <div className="border-t border-borda p-4 text-center">
                  <Botao variante="contorno" onClick={() => definirQuantos((q) => q + 100)}>
                    Mostrar mais {numero(Math.min(100, filtrados.length - quantos))}
                  </Botao>
                </div>
              )}
            </>
          )}
        </Cartao>
      </div>

      {aberto && <Copy lead={aberto} aoFechar={() => definirAberto(null)} />}

      {downloadAberto && (
        <Download
          filtros={filtros}
          quantos={paraOFicheiro}
          activos={nFiltros}
          limparFiltros={limparFiltros}
          painelDeFiltros={painelDeFiltros}
          aoFechar={() => {
            definirDownloadAberto(false);
            void exportacao.recarregar();
          }}
        />
      )}
    </div>
  );
}
