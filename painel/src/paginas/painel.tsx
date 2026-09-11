import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero, dinheiro, quandoFoi } from "../lib/formatar";
import { ACarregar, Barra, Cartao, Metrica, Pastilha, Selo, Vazio } from "../componentes/base";
import { SETORES } from "../lib/nichos";
import { janelaAberta, janelaDoSetor, relogioDeBrasilia, textoDaJanela } from "../lib/melhores-horas";

function MetaDoDia({ feito, meta }: { feito: number; meta: number }) {
  const falta = Math.max(0, meta - feito);
  return (
    <Cartao titulo="Meta de receita diária" etiqueta={falta === 0 ? "cumprida" : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-3xl font-bold leading-none tabular-nums">{dinheiro(feito)}</p>
        <p className="text-sm text-suave">de {dinheiro(meta)}</p>
      </div>
      <div className="mt-3">
        <Barra valor={feito} maximo={meta} />
      </div>
      <p className="mt-2 text-xs text-suave">
        {falta === 0 ? "Meta atingida. Bom trabalho." : `Faltam ${dinheiro(falta)} para a meta de hoje.`}
      </p>
    </Cartao>
  );
}

/**
 * A trajetória dos últimos trinta dias, desenhada à mão.
 *
 * Uma biblioteca de gráficos para duas linhas custava mais de descarregar do que
 * o painel inteiro. O eixo vertical é partilhado pelas duas séries só quando
 * ambas existem; com receita a zero, o gráfico mostra os leads e diz que é isso
 * que está a mostrar, em vez de desenhar uma linha reta a fingir informação.
 */
function Trajetoria({ dias }: { dias: api.DiaDeReceita[] }) {
  if (dias.length < 2) return <Vazio>Ainda não há dias suficientes para desenhar.</Vazio>;

  const L = 320;
  const A = 90;
  const receitas = dias.map((d) => d.revenue);
  const leads = dias.map((d) => d.leads);
  const houveReceita = receitas.some((r) => r > 0);
  const serie = houveReceita ? receitas : leads;
  const topo = Math.max(1, ...serie);

  const x = (i: number) => (i / (dias.length - 1)) * L;
  const y = (v: number) => A - (v / topo) * (A - 6);
  const linha = serie.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${linha} L${L},${A} L0,${A} Z`;

  return (
    <>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-[90px] w-full" preserveAspectRatio="none" aria-hidden>
        <path d={area} className="fill-marca/10" />
        <path d={linha} className="stroke-marca" fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex items-baseline justify-between text-xs text-suave">
        <span>{dias[0]?.date}</span>
        <span className="font-medium">
          {houveReceita ? "receita por dia" : `leads por dia · máximo ${numero(topo)}`}
        </span>
        <span>{dias[dias.length - 1]?.date}</span>
      </div>
    </>
  );
}

/** As janelas por setor, em hora de Brasília. Verde é janela aberta agora. */
function Janelas() {
  const agora = relogioDeBrasilia();
  const linhas = SETORES.map((s) => {
    const j = janelaDoSetor(s.nome);
    return { setor: s, janela: j, aberta: janelaAberta(j) };
  }).sort((a, b) => Number(b.aberta) - Number(a.aberta) || a.janela.inicioHora - b.janela.inicioHora);

  return (
    <Cartao titulo="Boas horas por setor" etiqueta={`${agora} em brasília`}>
      <p className="mb-3 text-xs text-suave">Verde é boa hora agora.</p>
      <ul className="space-y-1.5">
        {linhas.map(({ setor, janela, aberta }) => (
          <li
            key={setor.nome}
            className={`rounded-xl border px-3 py-2 ${aberta ? "border-marca bg-marca-tenue" : "border-borda"}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className={`text-sm font-medium ${aberta ? "text-marca" : ""}`}>{setor.curto}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-suave">
                {textoDaJanela(janela)}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-suave">{janela.razao}</p>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}

export function Painel() {
  const resumo = usarDados(api.resumo, { intervaloMs: 60_000 });
  const facetas = usarDados(api.facetas, { intervaloMs: 60_000 });
  const estado = usarDados(api.estado, { intervaloMs: 60_000 });
  const pipeline = usarDados(api.pipeline, { intervaloMs: 120_000 });
  const trajetoria = usarDados(api.trajetoria, { intervaloMs: 300_000 });
  const agentes = usarDados(api.agentes, { intervaloMs: 60_000 });

  const r = resumo.dados;
  const f = facetas.dados;
  const etapas = pipeline.dados?.stages ?? [];
  const maiorEtapa = Math.max(1, ...etapas.map((e) => e.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metrica
          rotulo="Receita do mês"
          valor={dinheiro(r?.revenueMonth)}
          nota={r ? `Hoje: ${dinheiro(r.revenueToday)}` : undefined}
          marca={<I.Dinheiro className="h-24 w-24" />}
        />
        <Metrica
          rotulo="Leads na base"
          valor={numero(r?.totalLeads ?? f?.total)}
          nota={
            r ? (
              <span className="flex flex-wrap gap-1.5">
                <Selo tom="marca">Tier A: {numero(r.tierALeads)}</Selo>
                <Selo>Tier B: {numero(r.tierBLeads)}</Selo>
                {f && <Selo>Hoje: {numero(f.today)}</Selo>}
              </span>
            ) : undefined
          }
          marca={<I.Pessoas className="h-24 w-24" />}
        />
        <Metrica
          rotulo="Contratos em curso"
          valor={numero(r?.contractsSent)}
          nota={r ? `${numero(r.paymentsDone)} pagos · ${numero(r.proposalsSent)} propostas enviadas` : undefined}
          marca={<I.Contrato className="h-24 w-24" />}
        />
        <Metrica
          rotulo="Taxa de conversão"
          valor={`${(r?.conversionRate ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
          nota={r ? `${numero(r.responses)} respostas · ${numero(r.negotiations)} em negociação` : undefined}
          marca={<I.Alvo className="h-24 w-24" />}
        />
      </div>

      {r && <MetaDoDia feito={r.revenueToday} meta={r.dailyRevenueTarget} />}

      <Cartao titulo="Trajetória" etiqueta="últimos 30 dias">
        {!trajetoria.dados ? <ACarregar /> : <Trajetoria dias={trajetoria.dados} />}
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Funil" etiqueta="do primeiro contacto ao contrato">
          {!etapas.length ? (
            <ACarregar />
          ) : (
            <ol className="space-y-3">
              {etapas.map((e) => (
                <li key={e.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{e.name}</span>
                    <span className="shrink-0 tabular-nums text-suave">{numero(e.count)}</span>
                  </div>
                  <Barra valor={e.count} maximo={maiorEtapa} />
                </li>
              ))}
            </ol>
          )}
        </Cartao>

        <Cartao titulo="Como se chega a eles">
          {!f ? (
            <ACarregar />
          ) : (
            <dl className="space-y-3 text-sm">
              {(
                [
                  ["WhatsApp", f.contact.whatsapp],
                  ["Telefone", f.contact.telefone],
                  ["Email", f.contact.email],
                  ["Por contactar", f.uncontacted],
                ] as const
              ).map(([rotulo, n]) => (
                <div key={rotulo}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <dt className="font-medium">{rotulo}</dt>
                    <dd className="tabular-nums text-suave">{numero(n)}</dd>
                  </div>
                  <Barra valor={n} maximo={f.total} />
                </div>
              ))}
            </dl>
          )}
        </Cartao>

        <Cartao titulo="Estado do sistema">
          {!estado.dados ? (
            <ACarregar />
          ) : (
            <ul className="space-y-2.5">
              {estado.dados.checks.map((c) => (
                <li key={c.name} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{c.name}</span>
                    <Pastilha ok={c.ok}>{c.ok ? "de pé" : "atenção"}</Pastilha>
                  </div>
                  {c.detail && !c.ok && <p className="mt-1 text-xs leading-relaxed text-suave">{c.detail}</p>}
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao titulo="Agentes">
          {!agentes.dados ? (
            <ACarregar />
          ) : (
            <div className="space-y-3">
              {Object.entries(agentes.dados).map(([chave, a]) => (
                <div key={chave} className="rounded-xl border border-borda p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{a.name}</p>
                    <Pastilha ok={a.status === "running" ? true : null}>
                      {a.status === "running" ? "a correr" : a.status === "idle" ? "parado" : a.status}
                    </Pastilha>
                  </div>
                  <p className="mt-1.5 text-xs text-suave">
                    {numero(a.todayCount)} tratados · {numero(a.successCount)} com êxito
                  </p>
                  {a.currentTask && <p className="mt-1 text-xs text-suave">{a.currentTask}</p>}
                  {a.lastRunAt && <p className="text-xs text-tenue">correu {quandoFoi(a.lastRunAt)}</p>}
                </div>
              ))}
            </div>
          )}
        </Cartao>
      </div>

      <Janelas />

      <Cartao titulo="Cidades com mais empresas">
        {!f?.cities.length ? (
          <Vazio>Ainda não há leads mapeados.</Vazio>
        ) : (
          <ol className="grid gap-2 sm:grid-cols-2">
            {f.cities.slice(0, 14).map((c) => (
              <li key={c.value} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{c.value}</span>
                <span className="tabular-nums text-suave">{numero(c.count)}</span>
              </li>
            ))}
          </ol>
        )}
      </Cartao>
    </div>
  );
}
