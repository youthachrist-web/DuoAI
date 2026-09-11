import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { dinheiro, data, numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Tabela, Vazio, campo } from "../componentes/base";

const PACOTES = [
  {
    nome: "Base",
    rotulo: "Parceria Base",
    etiqueta: "Sem adesão",
    recomendado: false,
    linhas: [
      "Encaminhamento de exames complementares",
      "Tabela de preços com condições de parceria",
      "Agendamento prioritário para pacientes referenciados",
    ],
  },
  {
    nome: "Plus",
    rotulo: "Parceria Plus",
    etiqueta: "Recomendado",
    recomendado: true,
    linhas: [
      "Tudo da Parceria Base",
      "Coleta no local da clínica",
      "Resultados digitais entregues à clínica",
      "Material de coleta fornecido pela FourLife",
    ],
  },
  {
    nome: "Ocupacional",
    rotulo: "Saúde Ocupacional",
    etiqueta: "Empresas",
    recomendado: false,
    linhas: [
      "Exames admissionais, periódicos e demissionais",
      "Emissão de ASO e gestão documental",
      "Agendamento em bloco para colaboradores",
      "Relatório de saúde ocupacional por empresa",
    ],
  },
];

export function Propostas() {
  const lista = usarDados(api.propostas, { intervaloMs: 60_000 });
  const [ocupado, definirOcupado] = useState<number | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);
  const [emailManual, definirEmailManual] = useState<Record<number, string>>({});

  async function enviar(id: number) {
    definirErro(null);
    definirNota(null);
    definirOcupado(id);
    try {
      const email = emailManual[id]?.trim();
      await api.enviarProposta(id, email ? { email } : undefined);
      definirNota("Proposta enviada. Follow-ups agendados para +3 e +7 dias.");
      await lista.recarregar();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      // O servidor responde EMAIL_MISSING quando o lead não tem endereço; aí a
      // caixa de escrever aparece em vez de uma mensagem que não explica nada.
      definirErro(
        m.includes("EMAIL_MISSING")
          ? "É preciso um email para enviar a proposta — escreve-o na linha e tenta outra vez."
          : `Não foi possível enviar: ${m}`,
      );
    } finally {
      definirOcupado(null);
    }
  }

  async function marcarAceite(id: number, nome: string) {
    definirErro(null);
    definirNota(null);
    definirOcupado(id);
    try {
      await api.actualizarProposta(id, { status: "closed" });
      definirNota(`${nome} marcada como ganha.`);
      await lista.recarregar();
    } catch (e) {
      definirErro(`Não foi possível atualizar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Propostas"
        descricao="Convites de parceria enviados a clínicas e empresas. Sem custo de adesão."
      />

      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {nota && <p className="text-sm text-bom">{nota}</p>}

      <div className="grid gap-3 lg:grid-cols-3">
        {PACOTES.map((p) => (
          <section
            key={p.nome}
            className={`rounded-2xl border bg-cartao p-4 ${
              p.recomendado ? "border-turquesa ring-1 ring-turquesa/30" : "border-borda"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{p.rotulo}</h2>
              <Selo tom={p.recomendado ? "turquesa" : "neutro"}>{p.etiqueta}</Selo>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-suave">
              {p.linhas.map((l) => (
                <li key={l} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-turquesa" />
                  {l}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Cartao titulo={`${numero(lista.dados?.length)} propostas`} semPadding>
        {lista.aCarregar && !lista.dados ? (
          <ACarregar>A carregar propostas…</ACarregar>
        ) : !lista.dados?.length ? (
          <Vazio>Ainda não saiu nenhuma proposta. Elas nascem de um lead que respondeu.</Vazio>
        ) : (
          <Tabela colunas={["Proposta", "Pacote", "Valor", "Estado", "Ações"]}>
            {lista.dados.map((p) => (
              <tr key={p.id} className="border-b border-borda/60 last:border-0">
                <td className="px-4 py-3 align-top">
                  <p className="font-medium">#{p.id}</p>
                  {p.createdAt && <p className="text-xs text-suave">{data(p.createdAt)}</p>}
                  <input
                    className={`${campo} mt-2 max-w-[220px] text-xs`}
                    placeholder="email (se o lead não tiver)"
                    value={emailManual[p.id] ?? ""}
                    onChange={(e) =>
                      definirEmailManual((m) => ({ ...m, [p.id]: e.target.value }))
                    }
                  />
                </td>
                <td className="px-4 py-3 align-top text-suave">{p.packageName ?? "—"}</td>
                <td className="px-4 py-3 align-top tabular-nums">{dinheiro(p.totalValue)}</td>
                <td className="px-4 py-3 align-top">
                  <Selo tom={p.status === "closed" ? "bom" : p.status === "sent" ? "turquesa" : "neutro"}>
                    {p.status}
                  </Selo>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex justify-end gap-2">
                    <Botao pequeno variante="contorno" onClick={() => enviar(p.id)} disabled={ocupado === p.id}>
                      <I.Caixa className="h-3.5 w-3.5" />
                      {ocupado === p.id ? "a enviar…" : "Enviar proposta"}
                    </Botao>
                    <Botao
                      pequeno
                      variante="contorno"
                      onClick={() => marcarAceite(p.id, `Proposta #${p.id}`)}
                      disabled={ocupado === p.id || p.status === "closed"}
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
