import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { dinheiro, data } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio, campo } from "../componentes/base";

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

/** O pacote que se recomenda quando a clínica não sabe qual escolher. */
const RECOMENDADO = "Plus";

function tomDoEstado(estado: string): "turquesa" | "bom" | "aviso" | "neutro" {
  if (estado === "video_opened") return "turquesa";
  if (estado === "responded") return "bom";
  if (estado === "negotiating") return "aviso";
  if (estado === "closed") return "neutro";
  return "turquesa";
}

export function Propostas() {
  const lista = usarDados(api.propostas, { intervaloMs: 60_000 });
  const [ocupado, definirOcupado] = useState<number | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);
  const [emailManual, definirEmailManual] = useState<Record<number, string>>({});

  async function enviar(id: number, nome: string) {
    definirErro(null);
    definirNota(null);
    definirOcupado(id);
    try {
      const email = emailManual[id]?.trim();
      await api.enviarProposta(id, email ? { email } : undefined);
      definirNota(`Proposta enviada a ${nome}. Follow-ups agendados para +3 e +7 dias.`);
      await lista.recarregar();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      // O servidor responde EMAIL_MISSING quando o lead não tem endereço; aí a
      // caixa de escrever aparece em vez de uma mensagem que não explica nada.
      definirErro(
        m.includes("EMAIL_MISSING")
          ? "É preciso um email para enviar a proposta — escreve-o no cartão e tenta outra vez."
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
      definirNota(`${nome}: proposta ganha.`);
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
        titulo="Propostas de parceria"
        descricao="Convites de parceria enviados a clínicas e empresas. Parcerias FourLife, sem custo de adesão."
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

      {lista.aCarregar && !lista.dados ? (
        <Cartao>
          <ACarregar>A carregar propostas…</ACarregar>
        </Cartao>
      ) : !lista.dados?.length ? (
        <Cartao>
          <Vazio>Ainda não saiu nenhuma proposta. Elas nascem de um lead que respondeu.</Vazio>
        </Cartao>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.dados.map((p) => {
            const nome = p.businessName ?? `Proposta #${p.id}`;
            const aTrabalhar = ocupado === p.id;
            return (
              <section
                key={p.id}
                className="flex flex-col rounded-2xl border border-borda bg-cartao"
              >
                <header className="border-b border-borda p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Selo tom={tomDoEstado(p.status)}>{p.status.replace("_", " ")}</Selo>
                    {/* O número com zeros à frente é o que aparece no email que
                        a clínica recebeu — tem de ser o mesmo aqui. */}
                    <span className="font-mono text-xs text-suave">
                      #{String(p.id).padStart(4, "0")}
                    </span>
                  </div>
                  <h2 className="truncate font-semibold leading-snug">{nome}</h2>
                  {p.niche && <p className="text-xs text-suave">{p.niche}</p>}
                </header>

                <div className="flex-1 space-y-3 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="etiqueta">Pacote</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Selo tom={p.packageType === RECOMENDADO ? "turquesa" : "neutro"}>
                          {p.packageType ?? "—"}
                        </Selo>
                        {p.packageType === RECOMENDADO && (
                          <span className="etiqueta flex items-center gap-0.5 text-turquesa">
                            <I.Estrela className="h-3 w-3" /> Rec.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="etiqueta">Adesão</p>
                      {p.value && p.value > 0 ? (
                        <p className="numero text-lg">{dinheiro(p.value)}</p>
                      ) : (
                        <p className="font-bold text-turquesa">Sem custo</p>
                      )}
                      <p className="text-[10px] text-suave">por volume referenciado</p>
                    </div>
                  </div>

                  {/* Abrir o vídeo é o primeiro sinal de interesse que temos; é o
                      que diz a quem se volta a ligar e a quem não. */}
                  {p.videoOpenedAt && (
                    <p className="flex items-center gap-2 rounded-xl border border-turquesa/30 bg-turquesa-tenue px-3 py-2 text-xs text-turquesa">
                      <I.Video className="h-3.5 w-3.5 shrink-0" />
                      Vídeo aberto em <b>{data(p.videoOpenedAt)}</b>
                    </p>
                  )}

                  <input
                    className={`${campo} text-xs`}
                    placeholder="email (se o lead não tiver)"
                    value={emailManual[p.id] ?? ""}
                    onChange={(e) => definirEmailManual((m) => ({ ...m, [p.id]: e.target.value }))}
                  />
                </div>

                <footer className="flex flex-col gap-2 border-t border-borda p-4">
                  <div className="flex gap-2">
                    <Botao
                      pequeno
                      variante="contorno"
                      className="flex-1"
                      disabled={!p.videoUrl}
                      onClick={() =>
                        p.videoUrl && window.open(p.videoUrl, "_blank", "noopener,noreferrer")
                      }
                    >
                      <I.Video className="h-4 w-4" />
                      Vídeo
                    </Botao>
                    <Botao
                      pequeno
                      variante="contorno"
                      className="flex-1"
                      disabled={!p.pdfUrl}
                      onClick={() =>
                        p.pdfUrl && window.open(p.pdfUrl, "_blank", "noopener,noreferrer")
                      }
                    >
                      <I.Documento className="h-4 w-4" />
                      PDF
                    </Botao>
                  </div>

                  <Botao
                    variante={p.sentAt ? "contorno" : "principal"}
                    className="w-full"
                    disabled={aTrabalhar}
                    onClick={() => void enviar(p.id, nome)}
                  >
                    <I.Enviar className="h-4 w-4 rotate-90" />
                    {aTrabalhar ? "a enviar…" : p.sentAt ? "Reenviar proposta" : "Enviar proposta"}
                  </Botao>

                  {p.status === "closed" ? (
                    <p className="flex items-center justify-center gap-1.5 rounded-xl border border-bom/30 bg-lima-tenue py-1.5 text-xs font-semibold text-bom">
                      <I.Trofeu className="h-3.5 w-3.5" /> Proposta ganha
                    </p>
                  ) : (
                    <Botao
                      variante="contorno"
                      className="w-full"
                      disabled={aTrabalhar}
                      onClick={() => void marcarAceite(p.id, nome)}
                    >
                      <I.Trofeu className="h-4 w-4" />
                      Marcar aceite
                    </Botao>
                  )}
                </footer>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
