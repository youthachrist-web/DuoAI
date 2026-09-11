import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero, quandoFoi } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio, campo } from "../componentes/base";

export function Lembretes() {
  const lista = usarDados(api.lembretes, { intervaloMs: 60_000 });
  const leads = usarDados(() => api.leads(500));

  const [leadId, definirLeadId] = useState("");
  const [mensagem, definirMensagem] = useState("");
  const [quando, definirQuando] = useState("");
  const [cadencia, definirCadencia] = useState("once");
  const [aCriar, definirACriar] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);

  const comWhatsApp = (leads.dados ?? []).filter((l) => l.whatsapp);

  async function criar() {
    definirErro(null);
    if (!mensagem.trim() || !quando) {
      definirErro("Falta a mensagem ou a data.");
      return;
    }
    definirACriar(true);
    try {
      await api.criarLembrete({
        leadId: leadId ? Number(leadId) : null,
        message: mensagem.trim(),
        scheduledFor: new Date(quando).toISOString(),
        cadence: cadencia,
      });
      definirMensagem("");
      definirQuando("");
      await lista.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirACriar(false);
    }
  }

  async function apagar(id: number) {
    if (!window.confirm("Apagar este lembrete?")) return;
    try {
      await api.apagarLembrete(id);
      await lista.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    }
  }

  const activos = (lista.dados ?? []).filter((l) => l.active !== false);
  const inactivos = (lista.dados ?? []).filter((l) => l.active === false);

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Lembretes" descricao="Mensagens agendadas para não deixar um lead esfriar." />

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      <Cartao titulo="Criar lembrete">
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={campo} value={leadId} onChange={(e) => definirLeadId(e.target.value)}>
            <option value="">Sem lead associado</option>
            {comWhatsApp.map((l) => (
              <option key={l.id} value={l.id}>
                {l.businessName} · {l.city}
              </option>
            ))}
          </select>
          <select className={campo} value={cadencia} onChange={(e) => definirCadencia(e.target.value)}>
            <option value="once">Uma vez</option>
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
          <input
            type="datetime-local"
            className={campo}
            value={quando}
            onChange={(e) => definirQuando(e.target.value)}
          />
          <input
            className={campo}
            placeholder="O que queres lembrar"
            value={mensagem}
            onChange={(e) => definirMensagem(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <Botao onClick={criar} disabled={aCriar}>
            <I.Sino className="h-4 w-4" />
            {aCriar ? "a criar…" : "Criar lembrete"}
          </Botao>
        </div>
        {!comWhatsApp.length && !leads.aCarregar && (
          <p className="mt-3 text-xs text-suave">Ainda não há leads com WhatsApp para associar.</p>
        )}
      </Cartao>

      <Cartao titulo={`Ativos (${numero(activos.length)})`}>
        {lista.aCarregar && !lista.dados ? (
          <ACarregar />
        ) : !activos.length ? (
          <Vazio>Nenhum lembrete ativo. Cria um novo acima.</Vazio>
        ) : (
          <ul className="space-y-2">
            {activos.map((l) => (
              <li
                key={l.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-borda px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{l.message ?? "(sem texto)"}</p>
                  <p className="mt-0.5 text-xs text-suave">
                    {l.scheduledFor ? quandoFoi(l.scheduledFor) : "sem data"}
                    {l.cadence && l.cadence !== "once" && ` · ${l.cadence}`}
                  </p>
                </div>
                <Botao pequeno variante="perigo" onClick={() => apagar(l.id)}>
                  Apagar
                </Botao>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      {inactivos.length > 0 && (
        <Cartao titulo={`Inativos (${numero(inactivos.length)})`}>
          <ul className="space-y-2">
            {inactivos.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 text-sm text-suave">
                <span className="truncate">{l.message}</span>
                <Selo>inativo</Selo>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}
