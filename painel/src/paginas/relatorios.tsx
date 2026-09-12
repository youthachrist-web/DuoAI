import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { data, dinheiro, numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio } from "../componentes/base";

/**
 * Os números do relatório escolhido, não os de agora.
 *
 * Cada relatório guarda os seus, e é isso que faz sentido: ao abrir o de
 * ontem, o que interessa é o que estava em cima da mesa ontem. Mostrar os
 * números de hoje ao lado do texto de ontem faz o texto parecer errado.
 */
function Numeros({ relatorio }: { relatorio?: api.Relatorio }) {
  const n = api.numerosDoRelatorio(relatorio?.metricsJson);
  if (!relatorio) return null;
  const celulas: [string, string][] = [
    ["Leads", numero(n.totalLeads)],
    ["Novos 24h", numero(n.newLeads24h)],
    ["Propostas", numero(n.proposalsSent)],
    ["Pagos", numero(n.contractsPaid)],
    ["Receita", dinheiro(n.revenuePaid)],
    ["MRR", dinheiro(n.mrr)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {celulas.map(([rotulo, valor]) => (
        <div key={rotulo} className="rounded-2xl border border-borda bg-cartao p-3.5">
          <p className="etiqueta">{rotulo}</p>
          <p className="numero mt-1 text-xl leading-none">{valor}</p>
        </div>
      ))}
    </div>
  );
}

export function Relatorios() {
  const lista = usarDados(api.relatorios, { intervaloMs: 300_000 });
  const [escolhido, definirEscolhido] = useState<number | null>(null);
  const [aGerar, definirAGerar] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);

  const relatorios = lista.dados ?? [];
  const activo = relatorios.find((r) => r.id === escolhido) ?? relatorios[0];

  async function gerar() {
    definirErro(null);
    definirAGerar(true);
    try {
      const novo = await api.gerarRelatorio();
      await lista.recarregar();
      if (novo?.id) definirEscolhido(novo.id);
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirAGerar(false);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Relatórios"
        descricao="Briefing diário, gerado automaticamente todas as manhãs e enviado por email."
        accao={
          <Botao onClick={gerar} disabled={aGerar}>
            <I.Jornal className="h-4 w-4" />
            {aGerar ? "a gerar…" : "Gerar agora"}
          </Botao>
        }
      />

      {erro && <Aviso tom="erro">{erro}</Aviso>}


      {lista.aCarregar && !lista.dados ? (
        <ACarregar />
      ) : !relatorios.length ? (
        <Cartao>
          <Vazio>Nenhum relatório ainda. Gera o primeiro briefing do dia.</Vazio>
        </Cartao>
      ) : (
        <>
          {relatorios.length > 1 && (
            <div className="sem-barra flex gap-2 overflow-x-auto pb-1">
              {relatorios.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => definirEscolhido(r.id)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    activo?.id === r.id
                      ? "border-turquesa bg-turquesa-tenue text-turquesa"
                      : "border-borda bg-cartao text-suave hover:bg-fundo"
                  }`}
                >
                  {data(r.reportDate)}
                  <span className="mt-0.5 block text-[11px] font-normal opacity-70">
                    {r.deliveryStatus === "sent" ? "Enviado por email" : "Gerado"}
                  </span>
                </button>
              ))}
            </div>
          )}

          <Numeros relatorio={activo} />

          {activo && (
            <Cartao
              titulo={activo.title}
              accao={
                <div className="flex items-center gap-2">
                  {activo.deliveryStatus === "sent" && <Selo tom="bom">Email enviado</Selo>}
                  <span className="etiqueta">{data(activo.reportDate)}</span>
                </div>
              }
            >
              {/* O relatório vem em markdown do servidor. Mostra-se como texto, tal como
                  está: interpretá-lo aqui abriria a porta a HTML injectado pela base. */}
              <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {activo.markdown}
              </pre>
            </Cartao>
          )}
        </>
      )}
    </div>
  );
}
