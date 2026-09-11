import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { dinheiro, data, numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Tabela, Vazio } from "../componentes/base";

function tomDoEstado(estado: string) {
  if (estado === "paid" || estado === "signed") return "bom" as const;
  if (estado === "cancelled" || estado === "failed") return "aviso" as const;
  return "neutro" as const;
}

export function Contratos() {
  const lista = usarDados(api.contratos, { intervaloMs: 60_000 });
  const [ocupado, definirOcupado] = useState<number | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);

  async function gerarLink(id: number) {
    definirErro(null);
    definirNota(null);
    definirOcupado(id);
    // A janela abre-se antes da espera, senão o browser bloqueia-a como popup.
    const janela = window.open("", "_blank", "noopener");
    try {
      const r = await api.linkDePagamento(id);
      if (r.url && janela) janela.location.href = r.url;
      else {
        janela?.close();
        definirErro(r.error ?? "O servidor não devolveu nenhum link de pagamento.");
      }
    } catch (e) {
      janela?.close();
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirOcupado(null);
    }
  }

  async function confirmar(id: number) {
    definirErro(null);
    definirNota(null);
    definirOcupado(id);
    try {
      await api.confirmarPagamento(id);
      definirNota("Pagamento confirmado. O contrato foi marcado como pago.");
      await lista.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirOcupado(null);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Contratos" descricao="Parcerias fechadas e faturação por volume de exames referenciados." />

      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {nota && <p className="text-sm text-bom">{nota}</p>}

      <Cartao titulo={`${numero(lista.dados?.length)} contratos`} semPadding>
        {lista.aCarregar && !lista.dados ? (
          <ACarregar />
        ) : !lista.dados?.length ? (
          <Vazio>Nenhum contrato ainda. Nenhuma cobrança foi efetuada.</Vazio>
        ) : (
          <Tabela colunas={["Contrato", "Mensal", "Adesão", "Estado", "Ações"]}>
            {lista.dados.map((c) => (
              <tr key={c.id} className="border-b border-borda/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">#{c.id}</p>
                  {c.createdAt && <p className="text-xs text-suave">{data(c.createdAt)}</p>}
                </td>
                <td className="px-4 py-3 tabular-nums">{dinheiro(c.monthlyValue)}</td>
                <td className="px-4 py-3 tabular-nums">{dinheiro(c.setupFee)}</td>
                <td className="px-4 py-3">
                  <Selo tom={tomDoEstado(c.status)}>{c.status}</Selo>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Botao pequeno variante="contorno" onClick={() => gerarLink(c.id)} disabled={ocupado === c.id}>
                      <I.Dinheiro className="h-3.5 w-3.5" />
                      Gerar link
                    </Botao>
                    <Botao pequeno variante="contorno" onClick={() => confirmar(c.id)} disabled={ocupado === c.id}>
                      Confirmar
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
