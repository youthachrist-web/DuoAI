import { useEffect, useRef, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "./icones";
import { numero, quandoFoi } from "../lib/formatar";
import { ACarregar, Botao, Vazio, campo } from "./base";
import { CIDADES, SETORES } from "../lib/nichos";

/**
 * O Four4AI: o assistente que anda em todas as páginas.
 *
 * Tem três separadores porque são três coisas diferentes e misturá-las torna as
 * duas piores: perguntar, mandar fazer, e ver o que já foi feito.
 *
 * Sobre "executar tarefas": o assistente não carrega em botões sozinho. Lê o que
 * se lhe pede, percebe o que isso quer dizer e propõe a acção — e é o Frederico
 * que confirma. Num painel que escreve a empresas reais, um assistente que age
 * sem confirmação é uma mensagem enviada por engano a alguém que não pediu nada.
 */

type Separador = "assistente" | "accoes" | "atividade";

type Proposta = {
  texto: string;
  correr: () => Promise<string>;
};

/** Lê a intenção da frase e, se houver uma acção que lhe corresponda, propõe-na. */
function proporAccao(frase: string): Proposta | null {
  const f = frase
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  const cidade = CIDADES.find((c) =>
    f.includes(
      c
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, ""),
    ),
  );
  const setor = SETORES.find((s) =>
    f.includes(
      s.curto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, ""),
    ),
  );

  if (/busca|procur|mapea|prospec|varre|encontra empresas/.test(f) && cidade) {
    const alvo = setor ?? SETORES[0];
    return {
      texto: `Lançar uma busca no mapa: ${alvo.curto} em ${cidade}.`,
      correr: async () => {
        const c = await api.lancarCorrida(alvo.nome, cidade, 15);
        return `Busca #${c.id} lançada — ${alvo.curto} em ${cidade}.`;
      },
    };
  }

  if (/relatorio|briefing|resumo do dia/.test(f) && /gera|faz|quero|cria/.test(f)) {
    return {
      texto: "Gerar o relatório de hoje.",
      correr: async () => {
        const r = await api.gerarRelatorio();
        return `Relatório de ${r.reportDate} gerado.`;
      },
    };
  }

  if (/suspend|para de escrever|desliga os contactos|pausa/.test(f)) {
    return {
      texto: "Suspender os contactos automáticos.",
      correr: async () => {
        await api.mudarOutreach(false);
        return "Contactos suspensos. Nada sai até autorizares outra vez.";
      },
    };
  }

  if (/autoriza|liga os contactos|comeca a escrever|inicia os contactos/.test(f)) {
    return {
      texto: "Autorizar os contactos automáticos.",
      correr: async () => {
        await api.mudarOutreach(true);
        return "Contactos autorizados.";
      },
    };
  }

  return null;
}

/* ------------------------------------------------------------- assistente */

function Conversa() {
  const [falas, definirFalas] = useState<api.Fala[]>([]);
  const [texto, definirTexto] = useState("");
  const [aResponder, definirAResponder] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);
  const [proposta, definirProposta] = useState<Proposta | null>(null);
  const [aCorrer, definirACorrer] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  async function perguntar(pergunta: string) {
    const limpa = pergunta.trim();
    if (!limpa || aResponder) return;

    definirErro(null);
    definirTexto("");
    definirProposta(proporAccao(limpa));

    const historico: api.Fala[] = [...falas, { role: "user", content: limpa }];
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
      definirFalas((a) => (a[a.length - 1]?.content === "" ? a.slice(0, -1) : a));
    } finally {
      definirAResponder(false);
    }
  }

  async function executar() {
    if (!proposta) return;
    definirACorrer(true);
    try {
      const resultado = await proposta.correr();
      definirFalas((a) => [...a, { role: "assistant", content: `✓ ${resultado}` }]);
      definirProposta(null);
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirACorrer(false);
    }
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {!falas.length ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium">Precisas de alguma coisa?</p>
            <p className="mt-1 text-xs leading-relaxed text-suave">
              Pergunta sobre a base, os leads ou o dia. Se pedires uma tarefa, eu proponho-a e tu
              confirmas.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {[
                "Resumo executivo de hoje",
                "Quais as 3 empresas que devo contactar primeiro?",
                "Lança uma busca de Metalurgia em Joinville",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void perguntar(s)}
                  className="rounded-xl border border-borda px-3 py-2 text-left text-xs text-suave hover:bg-fundo"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          falas.map((f, i) => (
            <div key={i} className={f.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  f.role === "user" ? "bg-turquesa text-white" : "bg-fundo"
                }`}
              >
                {f.content || <span className="font-mono text-tenue">a pensar…</span>}
              </div>
            </div>
          ))
        )}

        {proposta && (
          <div className="rounded-xl border border-lima/40 bg-lima-tenue p-3">
            <p className="text-xs font-medium">{proposta.texto}</p>
            <div className="mt-2 flex gap-2">
              <Botao pequeno onClick={executar} disabled={aCorrer}>
                {aCorrer ? "a correr…" : "Fazer"}
              </Botao>
              <Botao pequeno variante="contorno" onClick={() => definirProposta(null)}>
                Agora não
              </Botao>
            </div>
          </div>
        )}

        {erro && <p className="text-xs text-alerta">{erro}</p>}
        <div ref={fim} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void perguntar(texto);
        }}
        className="flex gap-2 border-t border-borda p-3"
      >
        <input
          className={campo}
          placeholder="Pergunta ao Four4AI…"
          value={texto}
          onChange={(e) => definirTexto(e.target.value)}
          disabled={aResponder}
        />
        <Botao onClick={() => void perguntar(texto)} disabled={aResponder || !texto.trim()}>
          <I.Enviar className="h-4 w-4 rotate-90" />
        </Botao>
      </form>
    </>
  );
}

/* ----------------------------------------------------------------- acções */

function Accoes() {
  const [cidade, definirCidade] = useState<string>(CIDADES[0]);
  const [setor, definirSetor] = useState(SETORES[0].nome);
  const [ocupado, definirOcupado] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const outreach = usarDados(api.estadoDoOutreach);

  async function correr(nome: string, accao: () => Promise<string>) {
    definirErro(null);
    definirNota(null);
    definirOcupado(nome);
    try {
      definirNota(await accao());
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirOcupado(null);
    }
  }

  const ligado = outreach.dados?.enabled ?? false;

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-3">
      <div>
        <p className="etiqueta mb-2">Procurar empresas no mapa</p>
        <select className={campo} value={setor} onChange={(e) => definirSetor(e.target.value)}>
          {SETORES.map((s) => (
            <option key={s.nome} value={s.nome}>
              {s.curto}
            </option>
          ))}
        </select>
        <select className={`${campo} mt-2`} value={cidade} onChange={(e) => definirCidade(e.target.value)}>
          {CIDADES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Botao
          className="mt-2 w-full"
          pequeno
          disabled={ocupado !== null}
          onClick={() =>
            correr("busca", async () => {
              const c = await api.lancarCorrida(setor, cidade, 15);
              return `Busca #${c.id} lançada.`;
            })
          }
        >
          <I.Lupa className="h-3.5 w-3.5" />
          {ocupado === "busca" ? "a lançar…" : "Lançar busca"}
        </Botao>
      </div>

      <div className="space-y-2 border-t border-borda pt-4">
        <p className="etiqueta">Do dia</p>
        <Botao
          variante="contorno"
          pequeno
          className="w-full"
          disabled={ocupado !== null}
          onClick={() =>
            correr("relatorio", async () => {
              const r = await api.gerarRelatorio();
              return `Relatório de ${r.reportDate} gerado.`;
            })
          }
        >
          <I.Jornal className="h-3.5 w-3.5" />
          {ocupado === "relatorio" ? "a gerar…" : "Gerar relatório de hoje"}
        </Botao>

        <Botao
          variante="contorno"
          pequeno
          className="w-full"
          disabled={ocupado !== null || outreach.dados === null}
          onClick={() =>
            correr("outreach", async () => {
              const r = await api.mudarOutreach(!ligado);
              await outreach.recarregar();
              return r.enabled
                ? "Contactos autorizados."
                : "Contactos suspensos. Nada sai até autorizares outra vez.";
            })
          }
        >
          <I.Escudo className="h-3.5 w-3.5" />
          {ligado ? "Suspender contactos" : "Autorizar contactos"}
        </Botao>
      </div>

      {nota && <p className="text-xs leading-relaxed text-bom">{nota}</p>}
      {erro && <p className="text-xs text-alerta">{erro}</p>}

      <p className="border-t border-borda pt-3 text-[11px] leading-relaxed text-suave">
        Estas são as tarefas que o Four4AI executa. Disparar mensagens não está aqui de propósito:
        cada disparo passa pela tua mão no Painel Diário.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- atividade */

function Atividade() {
  const { dados } = usarDados(api.actividade, { intervaloMs: 20_000 });

  if (!dados) return <ACarregar />;
  if (!dados.length)
    return (
      <div className="flex-1 p-3">
        <Vazio>Sem atividade registada ainda.</Vazio>
      </div>
    );

  return (
    <ul className="flex-1 divide-y divide-borda/60 overflow-y-auto">
      {dados.slice(0, 30).map((a) => (
        <li key={a.id} className="flex items-start gap-2.5 p-3 text-sm">
          <span className="shrink-0 font-mono text-[11px] text-tenue">
            {new Date(a.timestamp).toLocaleTimeString("pt-BR", { hour12: false }).slice(0, 5)}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium leading-snug">
              {a.agent} <span className="font-normal text-suave">→ {a.event}</span>
            </p>
            {a.detail && <p className="mt-0.5 text-[11px] leading-relaxed text-suave">{a.detail}</p>}
            {a.businessName && <p className="text-[11px] text-turquesa">{a.businessName}</p>}
            <p className="text-[11px] text-tenue">{quandoFoi(a.timestamp)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ balão */

export function Four4AI() {
  const [aberto, definirAberto] = useState(false);
  const [separador, definirSeparador] = useState<Separador>("assistente");
  const actividade = usarDados(api.actividade, { intervaloMs: 60_000 });

  // Fecha com Esc, como qualquer painel que se sobrepõe ao conteúdo.
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && definirAberto(false);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => definirAberto(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-turquesa py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lg shadow-turquesa/25 transition-colors hover:bg-turquesa-forte"
      >
        <I.Robo className="h-5 w-5" />
        <span className="hidden sm:inline">Precisas de alguma coisa?</span>
        <span className="sm:hidden">Four4AI</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-borda bg-cartao shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[400px]">
      <header className="flex items-center justify-between gap-3 border-b border-borda bg-barra px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-turquesa/20">
            <I.Robo className="h-4 w-4 text-turquesa" />
          </span>
          <div>
            <p className="titulo text-sm font-bold text-white">Four4AI</p>
            <p className="text-[11px] text-barra-suave">O cérebro operacional da FourLife</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => definirAberto(false)}
          aria-label="Fechar"
          className="grid h-7 w-7 place-items-center rounded-lg text-barra-suave hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </header>

      <nav className="flex border-b border-borda">
        {(
          [
            ["assistente", "Assistente"],
            ["accoes", "Ações"],
            ["atividade", `Atividade${actividade.dados?.length ? ` (${numero(actividade.dados.length)})` : ""}`],
          ] as const
        ).map(([chave, nome]) => (
          <button
            key={chave}
            type="button"
            onClick={() => definirSeparador(chave)}
            className={`flex-1 border-b-2 px-2 py-2.5 text-xs font-semibold transition-colors ${
              separador === chave
                ? "border-turquesa text-turquesa"
                : "border-transparent text-suave hover:text-texto"
            }`}
          >
            {nome}
          </button>
        ))}
      </nav>

      {separador === "assistente" && <Conversa />}
      {separador === "accoes" && <Accoes />}
      {separador === "atividade" && <Atividade />}
    </div>
  );
}
