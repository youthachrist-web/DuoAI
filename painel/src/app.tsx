import { useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { usarDados } from "./lib/usar-dados";
import * as api from "./lib/api";
import * as I from "./componentes/icones";
import { SeloWhatsApp } from "./componentes/selo-whatsapp";
import { Painel } from "./paginas/painel";
import { Diario } from "./paginas/diario";
import { Worklab } from "./paginas/worklab";
import { Assistente } from "./paginas/assistente";
import { Leads } from "./paginas/leads";
import { Prospecao } from "./paginas/prospecao";
import { Propostas } from "./paginas/propostas";
import { Contratos } from "./paginas/contratos";
import { Relatorios } from "./paginas/relatorios";
import { Atividade } from "./paginas/atividade";
import { Lembretes } from "./paginas/lembretes";
import { CaixaDeEntrada } from "./paginas/caixa";
import { Transcricao } from "./paginas/transcricao";

type Pagina = {
  caminho: string;
  nome: string;
  icone: typeof I.Grelha;
  pagina: () => React.JSX.Element;
};

const MENU: { seccao: string; itens: Pagina[] }[] = [
  {
    seccao: "Menu principal",
    itens: [
      { caminho: "/", nome: "Painel", icone: I.Grelha, pagina: Painel },
      { caminho: "/diario", nome: "Painel Diário", icone: I.Calendario, pagina: Diario },
      { caminho: "/leads", nome: "Leads", icone: I.Pessoas, pagina: Leads },
      { caminho: "/prospecao", nome: "Prospeção", icone: I.Alvo, pagina: Prospecao },
    ],
  },
  {
    seccao: "Comercial",
    itens: [
      { caminho: "/propostas", nome: "Propostas", icone: I.Documento, pagina: Propostas },
      { caminho: "/contratos", nome: "Contratos", icone: I.Contrato, pagina: Contratos },
      { caminho: "/relatorios", nome: "Relatórios", icone: I.Jornal, pagina: Relatorios },
    ],
  },
  {
    seccao: "Ferramentas",
    itens: [
      { caminho: "/duoai", nome: "DuoAI", icone: I.Robo, pagina: Assistente },
      { caminho: "/worklab", nome: "Base Worklab", icone: I.Enviar, pagina: Worklab },
      { caminho: "/caixa", nome: "Inbox", icone: I.Caixa, pagina: CaixaDeEntrada },
      { caminho: "/transcricao", nome: "Transcrição", icone: I.Microfone, pagina: Transcricao },
      { caminho: "/lembretes", nome: "Reminders", icone: I.Sino, pagina: Lembretes },
      { caminho: "/atividade", nome: "Atividade", icone: I.Pulso, pagina: Atividade },
    ],
  },
];

const TODAS = MENU.flatMap((m) => m.itens);

/* ------------------------------------------------------------ barra lateral */

function Lateral({ aberta, fechar }: { aberta: boolean; fechar: () => void }) {
  const [onde] = useLocation();

  return (
    <>
      {/* No telemóvel a barra desliza por cima; o véu fecha-a ao tocar fora. */}
      {aberta && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={fechar} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-barra transition-transform lg:translate-x-0 ${
          aberta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <I.Marca className="h-9 w-9" />
          <span className="titulo text-[22px] font-extrabold text-white">
            four<span className="text-lima">Life</span>
          </span>
        </div>

        <nav className="sem-barra flex-1 overflow-y-auto px-3 pb-4">
          {MENU.map((grupo) => (
            <div key={grupo.seccao} className="mb-5">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-barra-suave">
                {grupo.seccao}
              </p>
              <ul className="space-y-0.5">
                {grupo.itens.map(({ caminho, nome, icone: Icone }) => {
                  const activa = onde === caminho;
                  return (
                    <li key={caminho}>
                      <Link
                        href={caminho}
                        onClick={fechar}
                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          activa
                            ? "bg-barra-clara text-white"
                            : "text-barra-texto/80 hover:bg-barra-clara/60 hover:text-white"
                        }`}
                      >
                        <Icone
                          className={`h-[18px] w-[18px] shrink-0 ${activa ? "text-turquesa" : ""}`}
                        />
                        {nome}
                        {activa && (
                          <span className="absolute right-1.5 h-5 w-1 rounded-full bg-turquesa" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-barra-clara px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lima/20 text-sm font-bold text-lima">
              F
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">Frederico</p>
              <p className="truncate text-[11px] text-barra-suave">FourLife · SST</p>
            </div>
            <a
              href="/sair"
              title="Sair"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-barra-suave hover:bg-white/10 hover:text-white"
            >
              <I.Sair className="h-4 w-4" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------- topo */

function Topo({ abrir }: { abrir: () => void }) {
  const { dados, aCarregar, recarregar } = usarDados(api.estado, { intervaloMs: 60_000 });
  const [onde] = useLocation();
  const aFalhar = dados?.checks.filter((c) => !c.ok) ?? [];
  const actual = TODAS.find((p) => p.caminho === onde);

  return (
    <header className="sticky top-0 z-20 border-b border-borda bg-fundo/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={abrir}
            aria-label="Abrir menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-borda bg-cartao lg:hidden"
          >
            <I.Menu className="h-[18px] w-[18px]" />
          </button>
          <div className="min-w-0">
            <h1 className="titulo truncate text-xl font-bold leading-tight">
              {actual?.nome ?? "DuoAI"}
            </h1>
            <p className="truncate text-xs text-suave">FourLife · Saúde Ocupacional e SST</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SeloWhatsApp />
          {aFalhar.length > 0 && (
            <Link
              href="/"
              title={aFalhar.map((c) => c.name).join(" · ")}
              className="grid h-9 w-9 place-items-center rounded-xl bg-aviso-tenue text-aviso"
            >
              <I.Atencao className="h-[18px] w-[18px]" />
            </Link>
          )}
          <button
            type="button"
            onClick={recarregar}
            aria-label="Recarregar"
            className="grid h-9 w-9 place-items-center rounded-xl border border-borda bg-cartao hover:bg-fundo"
          >
            <I.Recarregar className={`h-[18px] w-[18px] ${aCarregar ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function App() {
  const [menuAberto, definirMenuAberto] = useState(false);

  return (
    <div className="min-h-full lg:pl-[264px]">
      <Lateral aberta={menuAberto} fechar={() => definirMenuAberto(false)} />
      <Topo abrir={() => definirMenuAberto(true)} />
      <main className="mx-auto max-w-6xl px-4 py-5 pb-16 sm:px-6">
        <Switch>
          {TODAS.map(({ caminho, pagina }) => (
            <Route key={caminho} path={caminho} component={pagina} />
          ))}
          <Route>
            <p className="py-20 text-center text-sm text-suave">Esta página não existe.</p>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
