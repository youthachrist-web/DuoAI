import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import { numero, quandoFoi } from "../lib/formatar";
import { ACarregar, Aviso, Cabecalho, Cartao, Selo, Vazio } from "../componentes/base";

const NOMES_DE_GARGALO: Record<string, string> = {
  conformidade: "Conformidade legal e SST",
  parceria: "Parceria (clínicas)",
  absentismo: "Absentismo / crescimento",
  beneficios: "Benefícios e retenção",
  logistica: "Logística de exames",
  "sem-analise": "Sem análise ainda",
};

function Origens() {
  const { dados, erro } = usarDados(api.origens, { intervaloMs: 60_000 });

  if (erro) return <Aviso tom="erro">Não consegui ler as origens: {erro}</Aviso>;
  if (!dados) return <ACarregar />;

  const gargalos = Object.entries(dados.contagens.porGargalo ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-borda p-3.5">
          <p className="etiqueta">Base de mapeamento</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{numero(dados.contagens.mapa)}</p>
          <p className="text-xs text-suave">OpenStreetMap</p>
        </div>
        <div className="rounded-xl border border-borda p-3.5">
          <p className="etiqueta">LinkedIn</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{numero(dados.contagens.linkedin)}</p>
          <p className="text-xs text-suave">via Apify</p>
        </div>
      </div>

      {gargalos.length > 0 && (
        <div>
          <p className="etiqueta mb-2">Por gargalo</p>
          <ul className="space-y-1.5 text-sm">
            {gargalos.map(([chave, n]) => (
              <li key={chave} className="flex items-baseline justify-between gap-3">
                <span>{NOMES_DE_GARGALO[chave] ?? chave}</span>
                <span className="tabular-nums text-suave">{numero(n)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Atividade() {
  const registo = usarDados(api.actividade, { intervaloMs: 20_000 });
  const comunicacoes = usarDados(() => api.comunicacoes(30), { intervaloMs: 60_000 });
  const [aba, definirAba] = useState<"sistema" | "envios">("sistema");

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Atividade"
        descricao="O que o sistema fez, e de onde vieram os leads."
        accao={<span className="etiqueta !text-marca">ao vivo</span>}
      />

      <Cartao titulo="Origem dos leads" etiqueta="de onde vieram">
        <Origens />
      </Cartao>

      <Cartao
        titulo="Registo"
        accao={
          <div className="flex gap-1">
            {(["sistema", "envios"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => definirAba(a)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  aba === a ? "bg-marca-tenue text-marca" : "text-suave hover:bg-fundo"
                }`}
              >
                {a === "sistema" ? "Sistema" : "Envios"}
              </button>
            ))}
          </div>
        }
      >
        {aba === "sistema" ? (
          !registo.dados ? (
            <ACarregar>A carregar atividade…</ACarregar>
          ) : !registo.dados.length ? (
            <Vazio>Sem atividade registada ainda.</Vazio>
          ) : (
            <ul className="space-y-3">
              {registo.dados.slice(0, 40).map((a) => (
                <li key={a.id} className="border-b border-borda/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug">{a.event}</p>
                    <Selo>{a.agent}</Selo>
                  </div>
                  {a.detail && <p className="mt-0.5 text-xs text-suave">{a.detail}</p>}
                  {a.createdAt && <p className="text-xs text-tenue">{quandoFoi(a.createdAt)}</p>}
                </li>
              ))}
            </ul>
          )
        ) : !comunicacoes.dados ? (
          <ACarregar />
        ) : !comunicacoes.dados.length ? (
          <Vazio>Ainda não saiu nenhuma mensagem.</Vazio>
        ) : (
          <ul className="space-y-3">
            {comunicacoes.dados.map((c) => (
              <li key={c.id} className="border-b border-borda/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug">{c.subject ?? c.type ?? c.channel}</p>
                  <Selo tom={c.status === "sent" || c.status === "delivered" ? "bom" : "neutro"}>
                    {c.status}
                  </Selo>
                </div>
                <p className="mt-0.5 break-all text-xs text-suave">{c.toAddress}</p>
                {c.createdAt && <p className="text-xs text-tenue">{quandoFoi(c.createdAt)}</p>}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
