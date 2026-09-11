import { Link, Route, Switch, useLocation } from "wouter";
import { usarDados } from "./lib/usar-dados";
import * as api from "./lib/api";
import * as I from "./componentes/icones";
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

const PAGINAS = [
  { caminho: "/", nome: "Painel", icone: I.Grelha, pagina: Painel },
  { caminho: "/diario", nome: "Painel Diário", icone: I.Calendario, pagina: Diario },
  { caminho: "/worklab", nome: "Base Worklab", icone: I.Enviar, pagina: Worklab },
  { caminho: "/duoai", nome: "DuoAI", icone: I.Robo, pagina: Assistente },
  { caminho: "/leads", nome: "Leads", icone: I.Pessoas, pagina: Leads },
  { caminho: "/prospecao", nome: "Prospeção", icone: I.Alvo, pagina: Prospecao },
  { caminho: "/propostas", nome: "Propostas", icone: I.Documento, pagina: Propostas },
  { caminho: "/contratos", nome: "Contratos", icone: I.Contrato, pagina: Contratos },
  { caminho: "/relatorios", nome: "Relatórios", icone: I.Jornal, pagina: Relatorios },
  { caminho: "/atividade", nome: "Atividade", icone: I.Pulso, pagina: Atividade },
  { caminho: "/lembretes", nome: "Reminders", icone: I.Sino, pagina: Lembretes },
  { caminho: "/caixa", nome: "Inbox", icone: I.Caixa, pagina: CaixaDeEntrada },
  { caminho: "/transcricao", nome: "Transcrição", icone: I.Microfone, pagina: Transcricao },
];

function Topo() {
  const { dados, aCarregar, recarregar } = usarDados(api.estado, { intervaloMs: 60_000 });
  const aFalhar = dados?.checks.filter((c) => !c.ok) ?? [];

  return (
    <header className="sticky top-0 z-20 border-b border-borda bg-cartao/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <I.Marca className="h-9 w-9" />
          <span className="text-xl font-bold tracking-tight">DuoAI</span>
        </Link>

        <div className="flex items-center gap-2">
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
            className="grid h-9 w-9 place-items-center rounded-xl border border-borda hover:bg-fundo"
          >
            <I.Recarregar className={`h-[18px] w-[18px] ${aCarregar ? "animate-spin" : ""}`} />
          </button>
          <span className="flex items-center gap-1.5 pl-1">
            <span className={`h-2 w-2 rounded-full ${dados ? "bg-marca" : "bg-tenue"}`} />
            <span className="etiqueta !text-marca">{dados ? "online" : "a ligar"}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

function Navegacao() {
  const [onde] = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-cartao/97 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="sem-barra mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 py-1.5">
        {PAGINAS.map(({ caminho, nome, icone: Icone }) => {
          const activa = onde === caminho;
          return (
            <Link
              key={caminho}
              href={caminho}
              className={`flex min-w-[74px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
                activa ? "text-marca" : "text-tenue hover:text-suave"
              }`}
            >
              <Icone className="h-[22px] w-[22px]" />
              <span className="whitespace-nowrap text-[11px] font-medium leading-none">{nome}</span>
              <span className={`h-0.5 w-6 rounded-full ${activa ? "bg-marca" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function App() {
  return (
    <div className="min-h-full">
      <Topo />
      <main className="mx-auto max-w-5xl px-4 py-5 pb-32">
        <Switch>
          {PAGINAS.map(({ caminho, pagina }) => (
            <Route key={caminho} path={caminho} component={pagina} />
          ))}
          <Route>
            <p className="py-20 text-center text-sm text-suave">Esta página não existe.</p>
          </Route>
        </Switch>
      </main>
      <Navegacao />
    </div>
  );
}
