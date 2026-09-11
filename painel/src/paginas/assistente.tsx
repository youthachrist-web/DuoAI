import { useRef, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { quandoFoi } from "../lib/formatar";
import { Aviso, Botao, Cabecalho, Cartao, Selo, Vazio, campo } from "../componentes/base";

const SUGESTOES = [
  "Resumo executivo de hoje",
  "Quais as 3 clínicas que devo contactar primeiro?",
  "Escreve uma abordagem de parceria para uma clínica de fisioterapia",
];

export function Assistente() {
  const conversas = usarDados(api.conversas, { intervaloMs: 300_000 });
  const [falas, definirFalas] = useState<api.Fala[]>([]);
  const [historicoAberto, definirHistoricoAberto] = useState(false);
  const [texto, definirTexto] = useState("");
  const [aResponder, definirAResponder] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  async function perguntar(pergunta: string) {
    const limpa = pergunta.trim();
    if (!limpa || aResponder) return;

    definirErro(null);
    definirTexto("");
    const historico: api.Fala[] = [...falas, { role: "user", content: limpa }];
    // A fala do assistente entra vazia e vai crescendo com o que chega do servidor.
    definirFalas([...historico, { role: "assistant", content: "" }]);
    definirAResponder(true);

    try {
      await api.perguntar(historico, (pedaco) => {
        definirFalas((anteriores) => {
          const copia = [...anteriores];
          const ultima = copia[copia.length - 1];
          copia[copia.length - 1] = { ...ultima, content: ultima.content + pedaco };
          return copia;
        });
        fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
      // Uma resposta vazia no ecrã não diz nada a ninguém: tira-se e fica o erro.
      definirFalas((anteriores) =>
        anteriores[anteriores.length - 1]?.content === "" ? anteriores.slice(0, -1) : anteriores,
      );
    } finally {
      definirAResponder(false);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="DuoAI"
        descricao="O cérebro operacional da FourLife. Conhece a base, os leads e o que já foi feito."
        accao={
          <div className="flex gap-2">
            {(conversas.dados?.length ?? 0) > 0 && (
              <Botao variante="contorno" pequeno onClick={() => definirHistoricoAberto((a) => !a)}>
                Histórico
              </Botao>
            )}
            {falas.length > 0 && (
              <Botao variante="contorno" pequeno onClick={() => definirFalas([])}>
                Nova conversa
              </Botao>
            )}
          </div>
        }
      />

      {historicoAberto && (
        <Cartao titulo="Conversas anteriores">
          {!conversas.dados?.length ? (
            <Vazio>Ainda não há conversas guardadas.</Vazio>
          ) : (
            <ul className="space-y-2">
              {conversas.dados.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left hover:text-marca"
                    onClick={async () => {
                      try {
                        const m = await api.mensagensDaConversa(c.id);
                        definirFalas(
                          m.map((x) => ({
                            role: x.role === "assistant" ? "assistant" : "user",
                            content: x.content,
                          })),
                        );
                        definirHistoricoAberto(false);
                      } catch (e) {
                        definirErro(e instanceof Error ? e.message : String(e));
                      }
                    }}
                  >
                    {c.title ?? `Conversa #${c.id}`}
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.createdAt && <Selo>{quandoFoi(c.createdAt)}</Selo>}
                    <button
                      type="button"
                      title="Apagar esta conversa"
                      className="text-xs text-alerta"
                      onClick={async () => {
                        if (!window.confirm("Apagar esta conversa?")) return;
                        try {
                          await api.apagarConversa(c.id);
                          await conversas.recarregar();
                        } catch (e) {
                          definirErro(e instanceof Error ? e.message : String(e));
                        }
                      }}
                    >
                      apagar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      )}

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      <Cartao semPadding>
        <div className="max-h-[58vh] min-h-[220px] space-y-3 overflow-y-auto p-4">
          {!falas.length ? (
            <Vazio>Sem conversas ainda. As tuas conversas com o DuoAI ficam guardadas aqui.</Vazio>
          ) : (
            falas.map((f, i) => (
              <div key={i} className={f.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    f.role === "user" ? "bg-marca text-white" : "bg-fundo"
                  }`}
                >
                  {f.content || <span className="font-mono text-tenue">a pensar…</span>}
                </div>
              </div>
            ))
          )}
          <div ref={fim} />
        </div>

        <div className="border-t border-borda p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void perguntar(texto);
            }}
            className="flex gap-2"
          >
            <input
              className={campo}
              placeholder="Pergunta ao DuoAI…"
              value={texto}
              onChange={(e) => definirTexto(e.target.value)}
              disabled={aResponder}
            />
            <label
              title="Anexar ficheiro (CSV, TXT, MD, JSON)"
              className="grid h-[42px] w-[42px] shrink-0 cursor-pointer place-items-center rounded-xl border border-borda hover:bg-fundo"
            >
              <I.Documento className="h-4 w-4 text-suave" />
              <input
                type="file"
                accept=".csv,.txt,.md,.json,text/plain,text/csv,application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  // O ficheiro entra como texto na pergunta: o assistente lê-o como
                  // contexto, e assim não é preciso rota nova no servidor.
                  const conteudo = (await f.text()).slice(0, 20000);
                  definirTexto(
                    (t) => `${t}\n\n--- ${f.name} ---\n${conteudo}`.trim(),
                  );
                }}
              />
            </label>
            <Botao onClick={() => void perguntar(texto)} disabled={aResponder || !texto.trim()}>
              <I.Enviar className="h-4 w-4 rotate-90" />
            </Botao>
          </form>

          {!falas.length && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void perguntar(s)}
                  className="rounded-xl border border-borda px-2.5 py-1.5 text-xs text-suave hover:bg-fundo"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </Cartao>
    </div>
  );
}
