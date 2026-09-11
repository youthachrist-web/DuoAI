import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero, dinheiro, quandoFoi } from "../lib/formatar";
import { ACarregar, Barra, Cartao, Metrica, Pastilha, Selo, Vazio } from "../componentes/base";
import { JANELAS, agoraEmBrasilia, janelaAberta } from "../lib/melhores-horas";

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

function Janelas() {
  const { hora, diaDaSemana, texto } = agoraEmBrasilia();
  const fimDeSemana = diaDaSemana === 0 || diaDaSemana === 6;
  return (
    <Cartao titulo="Boas horas para escrever" etiqueta={`${texto} em brasília`}>
      <div className="flex flex-wrap gap-2">
        {JANELAS.map((j) => {
          const aberta = janelaAberta(j, hora, diaDaSemana);
          return (
            <span
              key={j.nome}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                aberta ? "border-marca bg-marca-tenue text-marca" : "border-borda text-suave"
              }`}
            >
              {j.nome} · {j.inicio}h–{j.fim}h
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-suave">
        {fimDeSemana
          ? "Fim de semana. As empresas não estão a trabalhar — vale esperar por segunda."
          : "Verde é janela aberta agora. É horário comercial, não uma previsão: não há respostas suficientes para afirmar mais do que isto."}
      </p>
    </Cartao>
  );
}

export function Painel() {
  const resumo = usarDados(api.resumo, { intervaloMs: 60_000 });
  const facetas = usarDados(api.facetas, { intervaloMs: 60_000 });
  const estado = usarDados(api.estado, { intervaloMs: 60_000 });
  const pipeline = usarDados(api.pipeline, { intervaloMs: 120_000 });
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

        <Janelas />

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
      </div>

      <Cartao titulo="Agentes" etiqueta="o que cada um anda a fazer">
        {!agentes.dados ? (
          <ACarregar />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <Cartao titulo="Cidades com mais empresas">
        {!f?.cities.length ? (
          <Vazio>Ainda não há leads mapeados.</Vazio>
        ) : (
          <ol className="grid gap-2 sm:grid-cols-2">
            {f.cities.slice(0, 12).map((c) => (
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
