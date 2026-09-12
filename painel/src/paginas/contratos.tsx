import { useEffect, useRef, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { dinheiro, data, numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Tabela, Vazio } from "../componentes/base";

/** O pacote recomendado, o mesmo das propostas. */
const RECOMENDADO = "Plus";

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
  const [aConfirmar, definirAConfirmar] = useState(false);
  const jaTratou = useRef(false);

  /*
   * O regresso da Stripe.
   *
   * Quem paga volta a esta página com ?payment=... no endereço. O sucesso traz
   * a sessão, e é com ela — não com a nossa palavra — que se pergunta à Stripe
   * se o dinheiro entrou mesmo. Depois o endereço é limpo, para um recarregar
   * não voltar a confirmar o mesmo pagamento.
   */
  useEffect(() => {
    if (jaTratou.current) return;
    const parametros = new URLSearchParams(window.location.search);
    const resultado = parametros.get("payment");
    if (!resultado) return;
    jaTratou.current = true;

    const limparEndereco = () =>
      window.history.replaceState({}, "", window.location.pathname);

    if (resultado === "cancel") {
      definirNota("Pagamento cancelado. Nenhuma cobrança foi efetuada.");
      limparEndereco();
      return;
    }
    if (resultado !== "success") {
      limparEndereco();
      return;
    }

    const sessao = parametros.get("session_id");
    const contrato = Number(parametros.get("contract_id"));
    if (!sessao || !contrato) {
      limparEndereco();
      return;
    }

    definirAConfirmar(true);
    api
      .confirmarPagamento(contrato, sessao)
      .then(async (r) => {
        if (r.paid) definirNota("Pagamento confirmado. O contrato foi marcado como pago.");
        else definirErro("Ainda não recebemos a confirmação. Tenta outra vez daqui a instantes.");
        await lista.recarregar();
      })
      .catch((e: unknown) =>
        definirErro(
          `Não foi possível confirmar o pagamento: ${e instanceof Error ? e.message : String(e)}`,
        ),
      )
      .finally(() => {
        definirAConfirmar(false);
        limparEndereco();
      });
    // Só uma vez, ao entrar na página com o regresso da Stripe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function gerarLink(id: number, nome: string) {
    definirErro(null);
    definirNota(null);
    definirOcupado(id);
    try {
      const base = `${window.location.origin}/contratos`;
      const r = await api.linkDePagamento(id, {
        // O {CHECKOUT_SESSION_ID} é a Stripe que o preenche ao devolver o cliente.
        successUrl: `${base}?payment=success&contract_id=${id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${base}?payment=cancel&contract_id=${id}`,
      });
      if (!r.checkoutUrl) throw new Error(r.error ?? "O servidor não devolveu nenhum link.");
      // Vai-se à Stripe na mesma janela: um separador novo perde o regresso.
      window.location.assign(r.checkoutUrl);
    } catch (e) {
      definirErro(
        `Não foi possível gerar o link para ${nome}: ${e instanceof Error ? e.message : String(e)}`,
      );
      definirOcupado(null);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Contratos"
        descricao="Parcerias fechadas e faturação por volume de exames referenciados."
      />

      {aConfirmar && <Aviso tom="aviso">A confirmar o pagamento com a Stripe…</Aviso>}
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {nota && <p className="text-sm text-bom">{nota}</p>}

      <Cartao titulo={`${numero(lista.dados?.length)} contratos`} semPadding>
        {lista.aCarregar && !lista.dados ? (
          <ACarregar />
        ) : !lista.dados?.length ? (
          <Vazio>Nenhum contrato ainda. Nenhuma cobrança foi efetuada.</Vazio>
        ) : (
          <Tabela colunas={["Cliente", "Pacote", "Adesão", "Mensal", "Estado", "Ações"]}>
            {lista.dados.map((c) => {
              const nome = c.businessName ?? `Contrato #${c.id}`;
              return (
                <tr key={c.id} className="border-b border-borda/60 last:border-0">
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium">{nome}</p>
                    <p className="text-xs text-suave">{c.ownerName || "Sem responsável conhecido"}</p>
                    {c.createdAt && <p className="text-xs text-tenue">{data(c.createdAt)}</p>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-1.5">
                      <Selo tom={c.packageType === RECOMENDADO ? "turquesa" : "neutro"}>
                        {c.packageType ?? "—"}
                      </Selo>
                      {c.packageType === RECOMENDADO && (
                        <span className="etiqueta flex items-center gap-0.5 text-turquesa">
                          <I.Estrela className="h-3 w-3" /> Rec.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top tabular-nums">{dinheiro(c.setupFee)}</td>
                  <td className="px-4 py-3 align-top font-semibold tabular-nums text-turquesa">
                    {dinheiro(c.monthlyFee)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Selo tom={tomDoEstado(c.status)}>{c.status}</Selo>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end">
                      {c.status === "paid" ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-bom">
                          <span className="h-2 w-2 rounded-full bg-bom" />
                          Pago
                        </span>
                      ) : (
                        <Botao
                          pequeno
                          variante="contorno"
                          onClick={() => void gerarLink(c.id, nome)}
                          disabled={ocupado === c.id}
                        >
                          <I.Dinheiro className="h-3.5 w-3.5" />
                          {ocupado === c.id ? "a abrir…" : "Gerar link"}
                        </Botao>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Tabela>
        )}
      </Cartao>
    </div>
  );
}
