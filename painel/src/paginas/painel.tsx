import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import { numero, quandoFoi } from "../lib/formatar";
import { Cartao, Metrica, Pastilha, Vazio } from "../componentes/base";

export function Painel() {
  const resumo = usarDados(api.resumo, { intervaloMs: 60_000 });
  const facetas = usarDados(api.facetas, { intervaloMs: 60_000 });
  const estado = usarDados(api.estado, { intervaloMs: 60_000 });
  const agentes = usarDados(api.agentes, { intervaloMs: 60_000 });
  const actividade = usarDados(api.actividade, { intervaloMs: 60_000 });

  const f = facetas.dados;
  const r = resumo.dados;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metrica rotulo="Leads na base" valor={numero(r?.totalLeads ?? f?.total)} />
        <Metrica rotulo="Entraram hoje" valor={numero(f?.today)} />
        <Metrica rotulo="Tier A" valor={numero(r?.tierALeads)} nota="os de maior pontuação" />
        <Metrica rotulo="Por contactar" valor={numero(f?.uncontacted)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo="Como se chega a eles">
          {!f ? (
            <Vazio>a ler…</Vazio>
          ) : (
            <dl className="space-y-2.5 text-sm">
              {[
                ["WhatsApp", f.contact.whatsapp],
                ["Telefone", f.contact.telefone],
                ["Email", f.contact.email],
              ].map(([rotulo, n]) => (
                <div key={rotulo as string} className="flex items-center gap-3">
                  <dt className="w-24 shrink-0 text-suave">{rotulo}</dt>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-fundo">
                    <div
                      className="h-full rounded-full bg-marca"
                      style={{ width: `${f.total ? ((n as number) / f.total) * 100 : 0}%` }}
                    />
                  </div>
                  <dd className="w-12 shrink-0 text-right tabular-nums">{numero(n as number)}</dd>
                </div>
              ))}
            </dl>
          )}
        </Cartao>

        <Cartao titulo="Estado do sistema">
          {!estado.dados ? (
            <Vazio>a ler…</Vazio>
          ) : (
            <ul className="space-y-2.5">
              {estado.dados.checks.map((c) => (
                <li key={c.name} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{c.name}</span>
                    <Pastilha ok={c.ok}>{c.ok ? "de pé" : "atenção"}</Pastilha>
                  </div>
                  {c.detail && !c.ok && (
                    <p className="mt-1 text-xs leading-relaxed text-suave">{c.detail}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao titulo="Cidades com mais empresas">
          {!f?.cities.length ? (
            <Vazio>ainda não há leads mapeados.</Vazio>
          ) : (
            <ol className="space-y-1.5 text-sm">
              {f.cities.slice(0, 8).map((c) => (
                <li key={c.value} className="flex justify-between gap-3">
                  <span className="truncate">{c.value}</span>
                  <span className="tabular-nums text-suave">{numero(c.count)}</span>
                </li>
              ))}
            </ol>
          )}
        </Cartao>

        <Cartao titulo="O que os agentes andaram a fazer">
          {!actividade.dados?.length ? (
            <Vazio>nada registado ainda.</Vazio>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {actividade.dados.slice(0, 7).map((a) => (
                <li key={a.id}>
                  <p className="font-medium">{a.event}</p>
                  <p className="text-xs text-suave">
                    {a.detail ?? a.agent}
                    {a.createdAt && ` · ${quandoFoi(a.createdAt)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      {agentes.dados && (
        <Cartao titulo="Agentes">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(agentes.dados).map(([chave, a]) => (
              <div key={chave} className="rounded-lg border border-borda p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <Pastilha ok={a.status === "running" ? true : null}>{a.status}</Pastilha>
                </div>
                <p className="mt-1 text-xs text-suave">
                  {numero(a.todayCount)} tratados · {numero(a.successCount)} com êxito
                </p>
                {a.lastRunAt && (
                  <p className="text-xs text-suave">correu {quandoFoi(a.lastRunAt)}</p>
                )}
              </div>
            ))}
          </div>
        </Cartao>
      )}
    </div>
  );
}
