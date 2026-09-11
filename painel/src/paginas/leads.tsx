import { useEffect, useMemo, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero, data } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio, campo } from "../componentes/base";
import { TIPOS_DE_PEDIDO } from "../lib/nichos";
import { janelaAberta, janelaDoSetor, textoDaJanela } from "../lib/melhores-horas";
import { normalizarCelular, sinaisDoLead } from "../lib/telefone";

const PERIODOS = [
  { valor: "all", nome: "Toda a base de leads" },
  { valor: "today", nome: "Só os de hoje" },
  { valor: "week", nome: "Desta semana" },
  { valor: "month", nome: "Deste mês" },
  { valor: "new", nome: "Novos desde o último download" },
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
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onClick={aoFechar}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-borda bg-cartao sm:rounded-2xl"
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

        <div className="space-y-4 p-4">
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
  aoFechar,
  painelDeFiltros,
}: {
  filtros: api.FiltrosDeExportacao;
  quantos: number;
  aoFechar: () => void;
  painelDeFiltros: React.ReactNode;
}) {
  const [aBaixar, definirABaixar] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);
  const [guardado, definirGuardado] = useState(false);

  async function guardar() {
    definirErro(null);
    definirABaixar(true);
    try {
      const blob = await api.exportarLeads(filtros);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fourlife-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      definirGuardado(true);
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirABaixar(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onClick={aoFechar}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-borda bg-cartao sm:rounded-2xl"
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

        <div className="border-t border-borda p-4">
          {erro && (
            <div className="mb-3">
              <Aviso tom="erro">Não foi possível baixar: {erro}</Aviso>
            </div>
          )}
          <p className="mb-2 text-sm">
            <b className="numero text-lg">{numero(quantos)}</b>{" "}
            {quantos === 1 ? "empresa entra no ficheiro" : "empresas entram no ficheiro"}
          </p>
          <Botao onClick={guardar} disabled={aBaixar} className="w-full">
            <I.Descarregar className="h-4 w-4" />
            {aBaixar ? "A preparar a folha de cálculo…" : guardado ? "Guardar outra vez" : "Guardar ficheiro"}
          </Botao>
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
    cidades.length + setores.length + tiers.length + contacto.length + (site ? 1 : 0) + (scoreMin ? 1 : 0);

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
          {([[0, "Qualquer score"], [60, "60 ou mais"], [80, "80 ou mais — só os mais quentes"]] as const).map(
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
            onClick={() => {
              definirCidades([]);
              definirSetores([]);
              definirTiers([]);
              definirContacto([]);
              definirSite("");
              definirScoreMin(0);
              definirNaoContactados(false);
            }}
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
          quantos={filtrados.length}
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
