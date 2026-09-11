import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import { data } from "../lib/formatar";
import { Cartao, Vazio } from "../componentes/base";

export function Relatorios() {
  const lista = usarDados(api.relatorios, { intervaloMs: 300_000 });

  if (!lista.dados?.length) {
    return <Cartao titulo="Relatórios"><Vazio>Ainda não há relatórios.</Vazio></Cartao>;
  }

  return (
    <div className="space-y-4">
      {lista.dados.map((r) => (
        <Cartao
          key={r.id}
          titulo={r.title}
          accao={<span className="text-xs text-suave">{data(r.reportDate)}</span>}
        >
          {/* O relatório vem em markdown do servidor. Mostra-se como texto, tal como está:
              interpretá-lo aqui abriria a porta a injectar HTML vindo da base. */}
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {r.markdown}
          </pre>
        </Cartao>
      ))}
    </div>
  );
}
