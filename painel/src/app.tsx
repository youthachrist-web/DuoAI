import { Link, Route, Switch, useLocation } from "wouter";
import { usarDados } from "./lib/usar-dados";
import * as api from "./lib/api";
import { Pastilha } from "./componentes/base";
import { Painel } from "./paginas/painel";
import { Diario } from "./paginas/diario";
import { Leads } from "./paginas/leads";
import { Prospecao } from "./paginas/prospecao";
import { Relatorios } from "./paginas/relatorios";

const PAGINAS = [
  { caminho: "/", nome: "Painel" },
  { caminho: "/diario", nome: "Diário" },
  { caminho: "/leads", nome: "Leads" },
  { caminho: "/prospecao", nome: "Prospeção" },
  { caminho: "/relatorios", nome: "Relatórios" },
];

function Cabecalho() {
  const { dados } = usarDados(api.estado, { intervaloMs: 60_000 });
  const [onde] = useLocation();
  const aFalhar = dados?.checks.filter((c) => !c.ok) ?? [];

  return (
    <header className="sticky top-0 z-10 border-b border-borda bg-cartao/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca text-sm font-bold text-white">
            D
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">DuoAI</p>
            <p className="text-[11px] text-suave">FourLife</p>
          </div>
        </div>
        <Pastilha ok={dados ? aFalhar.length === 0 : null}>
          {!dados ? "a ler" : aFalhar.length === 0 ? "tudo de pé" : `${aFalhar.length} com problema`}
        </Pastilha>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-1">
        {PAGINAS.map((p) => {
          const activa = onde === p.caminho;
          return (
            <Link
              key={p.caminho}
              href={p.caminho}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activa ? "bg-marca text-white" : "text-suave hover:bg-fundo"
              }`}
            >
              {p.nome}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function App() {
  return (
    <div className="min-h-full">
      <Cabecalho />
      <main className="mx-auto max-w-6xl px-4 py-5 pb-16">
        <Switch>
          <Route path="/" component={Painel} />
          <Route path="/diario" component={Diario} />
          <Route path="/leads" component={Leads} />
          <Route path="/prospecao" component={Prospecao} />
          <Route path="/relatorios" component={Relatorios} />
          <Route>
            <p className="py-16 text-center text-sm text-suave">Esta página não existe.</p>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
