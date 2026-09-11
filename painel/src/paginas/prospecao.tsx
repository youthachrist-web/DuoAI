import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import { numero, quandoFoi } from "../lib/formatar";
import { Aviso, Botao, Cartao, Pastilha, Vazio } from "../componentes/base";

const CIDADES = [
  "Joinville", "Blumenau", "Itajaí", "Navegantes", "Balneário Camboriú", "Penha",
  "Barra Velha", "Camboriú", "Porto Belo", "Itapema", "Balneário Piçarras", "Tijucas",
  "Itapoá", "Araquari", "Guabiruba", "Brusque", "Antônio Carlos", "Biguaçu",
  "São José", "Palhoça", "Florianópolis", "São Paulo", "Canoas", "Gravataí",
  "Cachoeirinha", "Sapucaia do Sul",
];

const SETORES = [
  "Metalurgia e Fundição", "Construção Civil e Obras Públicas",
  "Indústria Transformadora e Manufatura", "Estruturas Metálicas e Carpintaria",
  "Logística e Armazéns", "Transporte de Cargas e Ferroviário",
  "Manutenção Industrial e Eletromecânica", "Setor Alimentar Industrial",
  "Gestão de Resíduos e Limpeza Urbana", "Indústria Química e Farmacêutica",
  "Estaleiros Navais", "Serviços Portuários e Estiva",
  "Indústria Papeleira e Celulose", "Extração e Pedreiras",
  "Clínicas Médicas e Ambulatórios", "Clínicas de Medicina Ocupacional",
  "Fisioterapia e Reabilitação", "Academias",
];

export function Prospecao() {
  const corridas = usarDados(api.corridas, { intervaloMs: 20_000 });
  const linkedin = usarDados(api.resumoLinkedin, { intervaloMs: 60_000 });
  const [cidade, definirCidade] = useState(CIDADES[0]);
  const [setor, definirSetor] = useState(SETORES[0]);
  const [aLancar, definirALancar] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);

  async function lancar() {
    definirErro(null);
    definirALancar(true);
    try {
      await api.lancarCorrida(setor, cidade, 15);
      await corridas.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirALancar(false);
    }
  }

  const campo =
    "w-full rounded-lg border border-borda bg-cartao px-3 py-2 text-sm outline-none focus:border-marca";

  return (
    <div className="space-y-5">
      <Cartao titulo="Procurar empresas novas no mapa">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
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
          <Botao onClick={lancar} disabled={aLancar}>
            {aLancar ? "a lançar…" : "Procurar"}
          </Botao>
        </div>
        {erro && <div className="mt-3"><Aviso>{erro}</Aviso></div>}
        <p className="mt-3 text-xs leading-relaxed text-suave">
          A busca vai ao OpenStreetMap, que é público e não custa nada. Empresas que já estejam na
          base são reconhecidas e não entram outra vez.
        </p>
      </Cartao>

      <Cartao titulo="Decisores pelo LinkedIn">
        {!linkedin.dados ? (
          <Vazio>a ler…</Vazio>
        ) : (
          <>
            {linkedin.dados.recusa && <Aviso>{linkedin.dados.recusa}</Aviso>}
            <ul className="space-y-1.5 text-sm">
              {linkedin.dados.linhas.map((l, i) => (
                <li key={i} className="text-suave">{l}</li>
              ))}
            </ul>
          </>
        )}
      </Cartao>

      <Cartao titulo="Últimas buscas">
        {!corridas.dados?.length ? (
          <Vazio>ainda não houve buscas.</Vazio>
        ) : (
          <ul className="space-y-2">
            {corridas.dados.slice(0, 25).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-borda px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.city} · {c.niche}</p>
                  <p className="text-xs text-suave">
                    encontrou {numero(c.foundCount)} · importou {numero(c.importedCount)}
                    {c.createdAt && ` · ${quandoFoi(c.createdAt)}`}
                  </p>
                </div>
                <Pastilha ok={c.status === "completed" ? true : c.status === "failed" ? false : null}>
                  {c.status === "completed" ? "feita" : c.status === "failed" ? "falhou" : c.status}
                </Pastilha>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
