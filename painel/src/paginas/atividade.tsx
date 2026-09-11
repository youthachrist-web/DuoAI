import { useMemo, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero, quandoFoi } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio } from "../componentes/base";
import { GARGALOS } from "../lib/nichos";

type Origem = "todas" | "linkedin" | "mapa";

function Decisor({ lead }: { lead: api.Lead }) {
  const [estado, definir] = useState<"parado" | "a procurar" | "achou" | "nada">("parado");
  const [nome, definirNome] = useState<string | null>(lead.ownerName);
  const [erro, definirErro] = useState<string | null>(null);

  async function procurar() {
    definirErro(null);
    definir("a procurar");
    try {
      const r = await api.procurarDecisor(lead.id);
      if (r.decisor) {
        definirNome(r.decisor);
        definir("achou");
      } else {
        definir("nada");
      }
    } catch (e) {
      definir("parado");
      definirErro(e instanceof Error ? e.message : String(e));
    }
  }

  if (nome) return <Selo tom="turquesa">{nome}</Selo>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Botao pequeno variante="contorno" onClick={procurar} disabled={estado === "a procurar"}>
        <I.Lupa className="h-3.5 w-3.5" />
        {estado === "a procurar" ? "a procurar…" : "Procurar decisor agora"}
      </Botao>
      {estado === "nada" && <span className="text-xs text-suave">Sem contexto suficiente.</span>}
      {erro && <span className="text-xs text-alerta">{erro}</span>}
    </div>
  );
}

function Origens() {
  const { dados, erro } = usarDados(api.origens, { intervaloMs: 60_000 });

  if (erro) return <Aviso tom="erro">Não consegui ler as origens: {erro}</Aviso>;
  if (!dados) return <ACarregar />;

  const gargalos = Object.entries(dados.contagens.porGargalo ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-borda p-3.5">
          <p className="etiqueta">Base de mapeamento</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{numero(dados.contagens.mapa)}</p>
          <p className="text-xs text-suave">OpenStreetMap</p>
        </div>
        <div className="rounded-xl border border-borda p-3.5">
          <p className="etiqueta">LinkedIn</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{numero(dados.contagens.linkedin)}</p>
          <p className="text-xs text-suave">via Apify</p>
        </div>
      </div>

      {gargalos.length > 0 && (
        <div>
          <p className="etiqueta mb-2">Por gargalo</p>
          <ul className="space-y-1.5 text-sm">
            {gargalos.map(([chave, n]) => (
              <li key={chave} className="flex items-baseline justify-between gap-3">
                <span>{GARGALOS[chave] ?? chave}</span>
                <span className="tabular-nums text-suave">{numero(n)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Atividade() {
  const registo = usarDados(api.actividade, { intervaloMs: 20_000 });
  const comunicacoes = usarDados(() => api.comunicacoes(30), { intervaloMs: 60_000 });
  const leads = usarDados(() => api.leads(600), { intervaloMs: 180_000 });

  const [aba, definirAba] = useState<"sistema" | "envios">("sistema");
  const [origem, definirOrigem] = useState<Origem>("todas");
  const [gargalo, definirGargalo] = useState("");
  const [quantos, definirQuantos] = useState(20);

  const filtrados = useMemo(() => {
    return (leads.dados ?? []).filter((l) => {
      if (origem === "linkedin" && !l.linkedinUrl) return false;
      if (origem === "mapa" && l.linkedinUrl) return false;
      if (gargalo && (l.bottleneckKind ?? "sem-analise") !== gargalo) return false;
      return true;
    });
  }, [leads.dados, origem, gargalo]);

  const gargalosPresentes = useMemo(() => {
    const s = new Set((leads.dados ?? []).map((l) => l.bottleneckKind ?? "sem-analise"));
    return [...s];
  }, [leads.dados]);

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Atividade"
        descricao="O que o sistema fez, e de onde vieram os leads."
        accao={<span className="etiqueta !text-turquesa">ao vivo</span>}
      />

      <Cartao titulo="Origem dos leads" etiqueta="de onde vieram · quem decide">
        <Origens />
      </Cartao>

      <Cartao
        titulo="Quem decide"
        accao={<span className="etiqueta">{numero(filtrados.length)} leads</span>}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["todas", "Todas"],
              ["linkedin", "LinkedIn"],
              ["mapa", "Google Maps / OSM"],
            ] as const
          ).map(([v, nome]) => (
            <button
              key={v}
              type="button"
              onClick={() => definirOrigem(v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                origem === v ? "border-turquesa bg-turquesa-tenue text-turquesa" : "border-borda text-suave"
              }`}
            >
              {nome}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => definirGargalo("")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              !gargalo ? "border-turquesa bg-turquesa-tenue text-turquesa" : "border-borda text-suave"
            }`}
          >
            Qualquer gargalo
          </button>
          {gargalosPresentes.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => definirGargalo(g)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                gargalo === g ? "border-turquesa bg-turquesa-tenue text-turquesa" : "border-borda text-suave"
              }`}
            >
              {GARGALOS[g] ?? g}
            </button>
          ))}
        </div>

        {leads.aCarregar && !leads.dados ? (
          <ACarregar />
        ) : !filtrados.length ? (
          <Vazio>Nenhum lead com estes filtros.</Vazio>
        ) : (
          <>
            <ul className="divide-y divide-borda/60">
              {filtrados.slice(0, quantos).map((l) => (
                <li key={l.id} className="py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">{l.businessName}</p>
                      <p className="text-xs text-suave">
                        {l.city} · {l.niche}
                      </p>
                      <p className="mt-0.5 text-xs text-tenue">
                        {l.linkedinUrl ? "LinkedIn (via Apify)" : "Base de mapeamento (OpenStreetMap)"}
                      </p>
                    </div>
                    <Selo>{GARGALOS[l.bottleneckKind ?? "sem-analise"] ?? l.bottleneckKind}</Selo>
                  </div>
                  <div className="mt-2">
                    <Decisor lead={l} />
                  </div>
                </li>
              ))}
            </ul>
            {filtrados.length > quantos && (
              <div className="pt-3 text-center">
                <Botao variante="contorno" pequeno onClick={() => definirQuantos((q) => q + 20)}>
                  Mostrar mais · restam {numero(filtrados.length - quantos)}
                </Botao>
              </div>
            )}
          </>
        )}
      </Cartao>

      <Cartao
        titulo="Registo"
        accao={
          <div className="flex gap-1">
            {(["sistema", "envios"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => definirAba(a)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  aba === a ? "bg-turquesa-tenue text-turquesa" : "text-suave hover:bg-fundo"
                }`}
              >
                {a === "sistema" ? "Sistema" : "Envios"}
              </button>
            ))}
          </div>
        }
      >
        {aba === "sistema" ? (
          !registo.dados ? (
            <ACarregar>A carregar atividade…</ACarregar>
          ) : !registo.dados.length ? (
            <Vazio>Sem atividade registada ainda.</Vazio>
          ) : (
            <ul className="space-y-3">
              {registo.dados.slice(0, 40).map((a) => (
                <li key={a.id} className="border-b border-borda/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug">{a.event}</p>
                    <Selo>{a.agent}</Selo>
                  </div>
                  {a.detail && <p className="mt-0.5 text-xs text-suave">{a.detail}</p>}
                  {a.businessName && <p className="text-xs text-turquesa">{a.businessName}</p>}
                  <p className="text-xs text-tenue">{quandoFoi(a.timestamp)}</p>
                </li>
              ))}
            </ul>
          )
        ) : !comunicacoes.dados ? (
          <ACarregar />
        ) : !comunicacoes.dados.length ? (
          <Vazio>Ainda não saiu nenhuma mensagem.</Vazio>
        ) : (
          <ul className="space-y-3">
            {comunicacoes.dados.map((c) => (
              <li key={c.id} className="border-b border-borda/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug">{c.subject ?? c.type ?? c.channel}</p>
                  <Selo tom={c.status === "sent" || c.status === "delivered" ? "bom" : "neutro"}>
                    {c.status}
                  </Selo>
                </div>
                <p className="mt-0.5 break-all text-xs text-suave">{c.toAddress}</p>
                {c.createdAt && <p className="text-xs text-tenue">{quandoFoi(c.createdAt)}</p>}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
