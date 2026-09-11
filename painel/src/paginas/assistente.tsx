import { useRef, useState } from "react";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { Aviso, Botao, Cabecalho, Cartao, Vazio, campo } from "../componentes/base";

const SUGESTOES = [
  "Resumo executivo de hoje",
  "Quais as 3 empresas que devo contactar primeiro?",
  "Que setores estão a render mais leads?",
];

export function Assistente() {
  const [falas, definirFalas] = useState<api.Fala[]>([]);
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
          falas.length > 0 ? (
            <Botao variante="contorno" pequeno onClick={() => definirFalas([])}>
              Nova conversa
            </Botao>
          ) : undefined
        }
      />

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      <Cartao semPadding>
        <div className="max-h-[58vh] min-h-[220px] space-y-3 overflow-y-auto p-4">
          {!falas.length ? (
            <Vazio>Pergunta o que quiseres sobre a operação.</Vazio>
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
