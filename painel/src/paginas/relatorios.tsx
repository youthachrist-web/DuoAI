import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { data, dinheiro, numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Vazio } from "../componentes/base";

/** Os números do dia, por cima do texto do relatório. */
function Numeros() {
  const resumo = usarDados(api.resumo, { intervaloMs: 120_000 });
  const facetas = usarDados(api.facetas, { intervaloMs: 120_000 });
  const r = resumo.dados;
  const f = facetas.dados;
  if (!r && !f) return null;
  const celulas: [string, string][] = [
    ["Novos 24h", numero(f?.today)],
    ["Leads", numero(r?.totalLeads ?? f?.total)],
    ["Propostas", numero(r?.proposalsSent)],
    ["Pagos", numero(r?.paymentsDone)],
    ["Receita", dinheiro(r?.revenueMonth)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {celulas.map(([rotulo, valor]) => (
        <div key={rotulo} className="rounded-2xl border border-borda bg-cartao p-3.5">
          <p className="etiqueta">{rotulo}</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{valor}</p>
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

      <Numeros />

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
                </button>
              ))}
            </div>
          )}

          {activo && (
            <Cartao titulo={activo.title} accao={<span className="etiqueta">{data(activo.reportDate)}</span>}>
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
