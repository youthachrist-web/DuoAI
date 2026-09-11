import { useState } from "react";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { Aviso, Botao, Cabecalho, Cartao } from "../componentes/base";

const TIPOS = [
  { valor: "rotina", nome: "Rotina", nota: "Lembrete de exames periódicos e prevenção." },
  { valor: "alerta", nome: "Alerta", nota: "Resultado que pede atenção e uma conversa." },
  { valor: "confirmacao", nome: "Confirmação", nota: "Confirmar agendamento já marcado." },
] as const;

export function Worklab() {
  const [ficheiro, definirFicheiro] = useState<File | null>(null);
  const [tipo, definirTipo] = useState<(typeof TIPOS)[number]["valor"]>("rotina");
  const [aEnviar, definirAEnviar] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);
  const [resultado, definirResultado] = useState<string | null>(null);

  async function enviar() {
    if (!ficheiro) return;
    definirErro(null);
    definirResultado(null);
    definirAEnviar(true);
    try {
      const r = await api.enviarBaseWorklab(ficheiro, tipo);
      const n = (r as { count?: number; total?: number } | null);
      definirResultado(
        n?.count || n?.total
          ? `Base processada: ${n.count ?? n.total} pacientes.`
          : "Base processada.",
      );
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirAEnviar(false);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Base Worklab · B2C"
        descricao="Carrega a exportação do Worklab para preparar mensagens de prevenção, uma a uma."
      />

      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {resultado && <p className="text-sm text-bom">{resultado}</p>}

      <Cartao titulo="Carregar ficheiro">
        <label className="block">
          <span className="etiqueta">Ficheiro CSV do Worklab</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => definirFicheiro(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-marca file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"
          />
        </label>

        <div className="mt-4">
          <span className="etiqueta">Que mensagem sai de cada linha</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => definirTipo(t.valor)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  tipo === t.valor ? "border-marca bg-marca-tenue" : "border-borda hover:bg-fundo"
                }`}
              >
                <p className="text-sm font-semibold">{t.nome}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-suave">{t.nota}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Botao onClick={enviar} disabled={!ficheiro || aEnviar}>
            <I.Enviar className="h-4 w-4" />
            {aEnviar ? "a processar…" : "Processar base"}
          </Botao>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-suave">
          As mensagens falam sempre de sintomas e de prevenção, nunca do exame em si. Os dados de saúde
          não saem daqui e não entram em nenhuma lista de prospeção.
        </p>
      </Cartao>
    </div>
  );
}
