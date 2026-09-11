import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero, quandoFoi } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Pastilha, Vazio, campo } from "../componentes/base";

const CIDADES = [
  "Joinville", "Blumenau", "Itajaí", "Navegantes", "Balneário Camboriú", "Penha",
  "Barra Velha", "Camboriú", "Porto Belo", "Itapema", "Balneário Piçarras", "Tijucas",
  "Itapoá", "Araquari", "Guabiruba", "Brusque", "Antônio Carlos", "Biguaçu",
  "São José", "Palhoça", "Florianópolis", "São Paulo", "Canoas", "Gravataí",
  "Cachoeirinha", "Sapucaia do Sul",
];

const SETORES = [
  "Metalurgia e Fundição",
  "Construção Civil e Obras Públicas",
  "Indústria Transformadora e Manufatura",
  "Estruturas Metálicas e Carpintaria",
  "Logística e Armazéns",
  "Transporte de Cargas e Ferroviário",
  "Manutenção Industrial e Eletromecânica",
  "Setor Alimentar Industrial",
  "Gestão de Resíduos e Limpeza Urbana",
  "Indústria Química e Farmacêutica",
  "Estaleiros Navais",
  "Serviços Portuários e Estiva",
  "Indústria Papeleira e Celulose",
  "Extração e Pedreiras",
  "Clínicas Médicas e Ambulatórios",
  "Clínicas de Medicina Ocupacional",
  "Fisioterapia e Reabilitação",
  "Academias",
];

function estadoDaCorrida(status: string): { texto: string; ok: boolean | null } {
  if (status === "completed") return { texto: "concluído", ok: true };
  if (status === "failed") return { texto: "falhou", ok: false };
  if (status === "running") return { texto: "a processar", ok: null };
  return { texto: status === "queued" ? "em fila" : status, ok: null };
}

export function Prospecao() {
  const corridas = usarDados(api.corridas, { intervaloMs: 15_000 });
  const linkedin = usarDados(api.resumoLinkedin, { intervaloMs: 60_000 });
  const fontes = usarDados(api.fontes, { intervaloMs: 120_000 });

  const [cidade, definirCidade] = useState(CIDADES[0]);
  const [setor, definirSetor] = useState(SETORES[0]);
  const [limite, definirLimite] = useState(15);
  const [aLancar, definirALancar] = useState(false);
  const [nota, definirNota] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);

  async function lancar() {
    definirErro(null);
    definirNota(null);
    definirALancar(true);
    try {
      await api.lancarCorrida(setor, cidade, limite);
      definirNota(`Procura iniciada: ${setor} em ${cidade}.`);
      await corridas.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirALancar(false);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Prospeção Automática · SST"
        descricao="Procura empresas novas no OpenStreetMap, que é público e não custa nada. Empresas que já estejam na base são reconhecidas e não entram outra vez."
      />

      <Cartao titulo="Procurar empresas">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_auto_auto]">
          <select className={campo} value={setor} onChange={(e) => definirSetor(e.target.value)}>
            {SETORES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className={campo} value={cidade} onChange={(e) => definirCidade(e.target.value)}>
            {CIDADES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className={campo}
            value={limite}
            onChange={(e) => definirLimite(Number(e.target.value))}
            aria-label="Quantas empresas pedir"
          >
            {[10, 15, 25, 40].map((n) => (
              <option key={n} value={n}>
                {n} empresas
              </option>
            ))}
          </select>
          <Botao onClick={lancar} disabled={aLancar}>
            <I.Lupa className="h-4 w-4" />
            {aLancar ? "a lançar…" : "Procurar"}
          </Botao>
        </div>
        {nota && <p className="mt-3 text-sm text-bom">{nota}</p>}
        {erro && (
          <div className="mt-3">
            <Aviso tom="erro">{erro}</Aviso>
          </div>
        )}
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Decisores pelo LinkedIn">
          {!linkedin.dados ? (
            <ACarregar />
          ) : (
            <>
              {linkedin.dados.recusa && (
                <div className="mb-3">
                  <Aviso>{linkedin.dados.recusa}</Aviso>
                </div>
              )}
              <ul className="space-y-1.5 text-sm leading-relaxed text-suave">
                {linkedin.dados.linhas.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </>
          )}
        </Cartao>

        <Cartao titulo="De onde vêm as empresas">
          {!fontes.dados ? (
            <ACarregar />
          ) : (
            <ul className="space-y-3">
              {fontes.dados.fontes.map((f) => (
                <li key={f.name} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{f.name}</span>
                    <Pastilha ok={f.ok}>{f.ok ? "a funcionar" : "em falta"}</Pastilha>
                  </div>
                  {f.detail && <p className="mt-1 text-xs leading-relaxed text-suave">{f.detail}</p>}
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <Cartao titulo="Execuções" accao={<span className="etiqueta">{numero(corridas.dados?.length)} no total</span>}>
        {!corridas.dados ? (
          <ACarregar />
        ) : !corridas.dados.length ? (
          <Vazio>Ainda sem execuções. Faz a primeira procura acima.</Vazio>
        ) : (
          <ul className="space-y-2">
            {corridas.dados.slice(0, 40).map((c) => {
              const e = estadoDaCorrida(c.status);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-borda px-3.5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {c.city} · {c.niche}
                    </p>
                    <p className="text-xs text-suave">
                      encontrou {numero(c.foundCount)} · importou {numero(c.importedCount)}
                      {c.createdAt && ` · ${quandoFoi(c.createdAt)}`}
                    </p>
                  </div>
                  <Pastilha ok={e.ok}>{e.texto}</Pastilha>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
