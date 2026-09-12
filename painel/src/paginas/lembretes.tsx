import { useMemo, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio, campo } from "../componentes/base";
import { normalizarCelular, recebeWhatsApp } from "../lib/telefone";

const RECORRENCIAS = [
  { valor: "none", nome: "Sem recorrência" },
  { valor: "daily", nome: "Diário" },
  { valor: "weekly", nome: "Semanal" },
  { valor: "monthly", nome: "Mensal" },
  { valor: "minutes", nome: "Por minutos" },
] as const;

/** A unidade do intervalo, para o campo dizer de quê são os números. */
const UNIDADES: Record<string, string> = {
  daily: "dias",
  weekly: "semanas",
  monthly: "meses",
  minutes: "minutos",
};

function quando(iso?: string | null) {
  if (!iso) return "sem data";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Lembretes() {
  const lista = usarDados(api.lembretes, { intervaloMs: 30_000 });
  const leads = usarDados(() => api.leads(2000));

  const [forma, definirForma] = useState({
    chatId: "",
    chatName: "",
    message: "",
    reminderDate: "",
    recurrenceType: "none",
    recurrenceInterval: "",
  });
  const [aCriar, definirACriar] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);

  // Só leads com celular verdadeiro e sem pedido de não contacto.
  const comWhatsApp = useMemo(
    () =>
      (leads.dados ?? [])
        .filter((l) => recebeWhatsApp(l) && !l.optOutAt)
        .sort((a, b) => b.score - a.score),
    [leads.dados],
  );

  const mudar = (chave: keyof typeof forma) => (v: string) =>
    definirForma((f) => ({ ...f, [chave]: v }));

  async function criar() {
    definirErro(null);
    definirNota(null);
    if (!forma.chatId.trim() || !forma.message.trim() || !forma.reminderDate) {
      definirErro("Falta o contacto, a mensagem ou a data.");
      return;
    }
    definirACriar(true);
    try {
      await api.criarLembrete({
        ...forma,
        reminderDate: new Date(forma.reminderDate).toISOString(),
        recurrenceInterval: forma.recurrenceInterval ? Number(forma.recurrenceInterval) : null,
      });
      definirNota("Reminder criado com sucesso.");
      definirForma({
        chatId: "",
        chatName: "",
        message: "",
        reminderDate: "",
        recurrenceType: "none",
        recurrenceInterval: "",
      });
      await lista.recarregar();
    } catch (e) {
      definirErro(`Erro ao criar reminder: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirACriar(false);
    }
  }

  /* Desligar em vez de apagar: o texto e a data ficam guardados, e volta-se a
     ligar quando for altura. Apagar é definitivo. */
  async function alternar(id: number) {
    definirErro(null);
    try {
      await api.alternarLembrete(id);
      await lista.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    }
  }

  async function apagar(id: number) {
    if (!window.confirm("Apagar este reminder?")) return;
    try {
      await api.apagarLembrete(id);
      await lista.recarregar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    }
  }

  const activos = (lista.dados ?? []).filter((l) => l.isActive !== false);
  const inactivos = (lista.dados ?? []).filter((l) => l.isActive === false);
  const recorrentes = (lista.dados ?? []).filter(
    (l) => l.recurrenceType && l.recurrenceType !== "none",
  );
  const agora = Date.now();

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Reminders" descricao="Mensagens agendadas, para não deixar um lead esfriar." />

      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {nota && <p className="text-sm text-bom">{nota}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Ativos", activos.length],
            ["Inativos", inactivos.length],
            ["Recorrentes", recorrentes.length],
            ["Total", lista.dados?.length ?? 0],
          ] as const
        ).map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-2xl border border-borda bg-cartao p-3.5">
            <p className="etiqueta">{rotulo}</p>
            <p className="numero mt-1 text-2xl leading-none">{numero(valor)}</p>
          </div>
        ))}
      </div>

      <Cartao titulo="Criar Reminder">
        <label className="block">
          <span className="etiqueta">Lead com WhatsApp</span>
          <select
            className={`${campo} mt-1`}
            value=""
            onChange={(e) => {
              const l = comWhatsApp.find((x) => String(x.id) === e.target.value);
              if (!l) return;
              definirForma((f) => ({
                ...f,
                chatId: `${normalizarCelular(l.whatsapp ?? l.phone)}@c.us`,
                chatName: l.businessName,
              }));
            }}
          >
            <option value="">
              {comWhatsApp.length
                ? `Escolher entre ${comWhatsApp.length} leads`
                : "Nenhum lead com WhatsApp ainda"}
            </option>
            {comWhatsApp.map((l) => (
              <option key={l.id} value={l.id}>
                {l.businessName} · {l.city}
              </option>
            ))}
          </select>
        </label>

        <input
          className={`${campo} mt-2 font-mono`}
          placeholder="5547991234567@c.us"
          value={forma.chatId}
          onChange={(e) => mudar("chatId")(e.target.value)}
        />
        <p className="mt-1 text-xs text-suave">
          Escolhe um lead acima e o número é preenchido, ou escreve-o à mão no formato
          <span className="font-mono"> 55DDNNNNNNNNN@c.us</span>.
        </p>

        <input
          className={`${campo} mt-3`}
          placeholder="Nome do contacto"
          value={forma.chatName}
          onChange={(e) => mudar("chatName")(e.target.value)}
        />

        <textarea
          className={`${campo} mt-2 min-h-28 resize-y`}
          placeholder="Texto do reminder…"
          value={forma.message}
          onChange={(e) => mudar("message")(e.target.value)}
        />

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="etiqueta">Data e hora</span>
            <input
              type="datetime-local"
              className={`${campo} mt-1`}
              value={forma.reminderDate}
              onChange={(e) => mudar("reminderDate")(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="etiqueta">Recorrência</span>
            <select
              className={`${campo} mt-1`}
              value={forma.recurrenceType}
              onChange={(e) => mudar("recurrenceType")(e.target.value)}
            >
              {RECORRENCIAS.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.nome}
                </option>
              ))}
            </select>
          </label>
          {forma.recurrenceType !== "none" && (
            <label className="block">
              <span className="etiqueta">Intervalo (de quantos em quantos)</span>
              <input
                type="number"
                min={1}
                className={`${campo} mt-1`}
                placeholder="1"
                value={forma.recurrenceInterval}
                onChange={(e) => mudar("recurrenceInterval")(e.target.value)}
              />
            </label>
          )}
        </div>

        <div className="mt-3">
          <Botao onClick={criar} disabled={aCriar}>
            <I.Sino className="h-4 w-4" />
            {aCriar ? "a criar…" : "Criar Reminder"}
          </Botao>
        </div>
      </Cartao>

      <Cartao titulo={`Ativos (${numero(activos.length)})`}>
        {lista.aCarregar && !lista.dados ? (
          <ACarregar />
        ) : !activos.length ? (
          <Vazio>Nenhum reminder ativo. Cria um novo acima.</Vazio>
        ) : (
          <ul className="space-y-2">
            {activos.map((l) => {
              const atrasado = l.reminderDate ? new Date(l.reminderDate).getTime() < agora : false;
              return (
                <li
                  key={l.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-borda px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{l.message ?? "(sem texto)"}</p>
                    <p className="mt-0.5 text-xs text-suave">
                      {l.chatName ? `${l.chatName} · ` : ""}
                      {quando(l.reminderDate)}
                      {l.recurrenceType && l.recurrenceType !== "none" && (
                        ` · cada ${l.recurrenceInterval ?? 1} ${UNIDADES[l.recurrenceType] ?? l.recurrenceType}`
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {atrasado && <Selo tom="aviso">Atrasado</Selo>}
                    <Botao pequeno variante="contorno" onClick={() => void alternar(l.id)}>
                      Desligar
                    </Botao>
                    <Botao pequeno variante="perigo" onClick={() => apagar(l.id)}>
                      Apagar
                    </Botao>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>

      {inactivos.length > 0 && (
        <Cartao titulo={`Inativos (${numero(inactivos.length)})`}>
          <ul className="space-y-2">
            {inactivos.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 text-sm text-suave">
                <span className="min-w-0 flex-1 truncate">{l.message}</span>
                <Selo>Inativo</Selo>
                <Botao pequeno variante="contorno" onClick={() => void alternar(l.id)}>
                  Ligar
                </Botao>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}
