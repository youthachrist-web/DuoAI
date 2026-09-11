import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { dinheiro, data, numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Tabela, Vazio } from "../componentes/base";

const PACOTES = [
  {
    nome: "Parceria Base",
    linhas: [
      "Exames admissionais, periódicos e demissionais",
      "Emissão de ASO e gestão documental",
      "Agendamento em bloco para colaboradores",
    ],
  },
  {
    nome: "Parceria Plus",
    linhas: [
      "Tudo o que a Base tem",
      "Coleta no local da empresa, com material fornecido",
      "Agendamento prioritário e encaminhamento de exames complementares",
    ],
  },
];

export function Propostas() {
  const lista = usarDados(api.propostas, { intervaloMs: 60_000 });
  const [aEnviar, definirAEnviar] = useState<number | null>(null);
  const [erro, definirErro] = useState<string | null>(null);

  async function marcarAceite(id: number) {
    definirErro(null);
    definirAEnviar(id);
    try {
      await api.actualizarProposta(id, { status: "accepted" });
      await lista.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirAEnviar(null);
    }
  }

  async function enviar(id: number) {
    definirErro(null);
    definirAEnviar(id);
    try {
      await api.enviarProposta(id);
      await lista.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirAEnviar(null);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Propostas"
        descricao="Convites de parceria enviados a empresas e clínicas. Sem custo de adesão."
      />

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      <div className="grid gap-3 sm:grid-cols-2">
        {PACOTES.map((p) => (
          <Cartao key={p.nome} titulo={p.nome} etiqueta="sem adesão">
            <ul className="space-y-1.5 text-sm leading-relaxed text-suave">
              {p.linhas.map((l) => (
                <li key={l} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-marca" />
                  {l}
                </li>
              ))}
            </ul>
          </Cartao>
        ))}
      </div>

      <Cartao titulo={`${numero(lista.dados?.length)} propostas`} semPadding>
        {lista.aCarregar && !lista.dados ? (
          <ACarregar />
        ) : !lista.dados?.length ? (
          <Vazio>Ainda não saiu nenhuma proposta. Elas nascem de um lead que respondeu.</Vazio>
        ) : (
          <Tabela colunas={["Proposta", "Pacote", "Valor", "Estado", "Ações"]}>
            {lista.dados.map((p) => (
              <tr key={p.id} className="border-b border-borda/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">#{p.id}</p>
                  {p.createdAt && <p className="text-xs text-suave">{data(p.createdAt)}</p>}
                </td>
                <td className="px-4 py-3 text-suave">{p.packageName ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">{dinheiro(p.totalValue)}</td>
                <td className="px-4 py-3">
                  <Selo tom={p.status === "sent" ? "bom" : "neutro"}>{p.status}</Selo>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Botao pequeno variante="contorno" onClick={() => enviar(p.id)} disabled={aEnviar === p.id}>
                      <I.Caixa className="h-3.5 w-3.5" />
                      {aEnviar === p.id ? "a enviar…" : "Enviar"}
                    </Botao>
                    <Botao
                      pequeno
                      variante="contorno"
                      onClick={() => marcarAceite(p.id)}
                      disabled={aEnviar === p.id || p.status === "accepted"}
                    >
                      Marcar aceite
                    </Botao>
                  </div>
                </td>
              </tr>
            ))}
          </Tabela>
        )}
      </Cartao>
    </div>
  );
}
